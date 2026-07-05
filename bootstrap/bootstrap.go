package bootstrap

import (
	"context"
	"path/filepath"

	"github.com/jasonlabz/potato/configx"
	"github.com/jasonlabz/potato/configx/file"
	"github.com/jasonlabz/potato/cryptox"
	"github.com/jasonlabz/potato/cryptox/aes"
	"github.com/jasonlabz/potato/cryptox/des"
	"github.com/jasonlabz/potato/gormx"
	"github.com/jasonlabz/potato/grpcx"
	"github.com/jasonlabz/potato/httpx"
	"github.com/jasonlabz/potato/log"
	"github.com/jasonlabz/potato/utils"

	"github.com/jasonlabz/cartl/global/resource"
)

func MustInit(ctx context.Context) {
	// 初始化配置文件
	initConfig(ctx)
	// 初始化日志对象
	initLogger(ctx)
	// 初始化全局变量
	initResource(ctx)
	// 初始化加解秘钥
	initCrypto(ctx)
	// 初始化DB
	initDB(ctx)
	// 初始化RMQ
	initRMQ(ctx)
	// 初始化Redis
	initRedis(ctx)
	// 初始化ES
	initES(ctx)
	// 初始化客户端信息
	initServicer(ctx)
}

func initLogger(_ context.Context) {
	resource.Logger = log.GetLogger()
}

func initResource(_ context.Context) {
	// all global variable should be initial
}

func initCrypto(_ context.Context) {
	cryptoConfigs := GetConfig().Crypto
	for _, conf := range cryptoConfigs {
		if conf.Key == "" {
			continue
		}
		switch conf.Type {
		case cryptox.CryptoTypeAES:
			aes.SetAESCrypto(aes.NewAESCrypto([]byte(conf.Key)))
		case cryptox.CryptoTypeDES:
			des.SetDESCrypto(des.NewDESCrypto([]byte(conf.Key)))
		}
	}
}

func initDB(_ context.Context) {
	dbConf := GetConfig().DataSource
	if !dbConf.Enable {
		return
	}
	gormConfig := &gormx.Config{}
	err := utils.CopyStruct(dbConf, gormConfig)
	if err != nil {
		panic(err)
	}
	gormConfig.DBName = gormx.DefaultDBNameMaster
	gormConfig.Logger =
		gormx.LoggerAdapter(resource.Logger.WithCallerSkip(3))
	_, err = gormx.InitConfig(gormConfig)
	if err != nil {
		panic(err)
	}
	// dao.SetGormDB(db)
}

func initRMQ(_ context.Context) {
	// 走默认初始化逻辑
	// resource.RMQClient = rabbitmqx.GetRabbitMQOperator()
}

func initRedis(_ context.Context) {
	// 走默认初始化逻辑
	// resource.RedisClient = goredis.GetRedisOperator()
}

func initES(_ context.Context) {
	// 走默认初始化逻辑
	// resource.EsClient = es.GetESOperator()
}

func initConfig(_ context.Context) {
	filePaths, err := utils.ListDir("conf", ".yaml")
	if err != nil {
		filePaths = []string{}
	}
	for _, filePath := range filePaths {
		fileName := filepath.Base(filePath)
		provider, err := file.NewConfigProvider(filePath)
		if err != nil {
			continue
		}
		configx.AddProviders(fileName, provider)
	}
}

func initServicer(_ context.Context) {
	filePaths, _ := utils.ListDir(filepath.Join("conf", "servicer"), ".yaml")
	for _, filePath := range filePaths {
		// 先解析为 httpx.Config 获取 Protocol 字段
		info := &httpx.Config{}
		if err := configx.ParseConfigByViper(filePath, info); err != nil {
			continue
		}
		service := filepath.Base(filePath)
		if info.Name != "" {
			service = info.Name
		}
		// 按 Protocol 分流：grpc/grpcs 重新解析为 grpcx.Config，其余直接注册 httpx
		switch info.Protocol {
		case "grpc", "grpcs":
			grpcCfg := &grpcx.Config{}
			if err := configx.ParseConfigByViper(filePath, grpcCfg); err != nil {
				continue
			}
			grpcx.Store(service, grpcCfg)
		default:
			httpx.Store(service, info)
		}
	}
}
