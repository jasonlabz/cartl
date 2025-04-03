package routers

import (
	"github.com/gin-gonic/gin"
	knife4go "github.com/jasonlabz/knife4go"
	"github.com/jasonlabz/potato/core/config"

	_ "github.com/jasonlabz/cartl/docs"
	"github.com/jasonlabz/cartl/server/controller"
	"github.com/jasonlabz/cartl/server/middleware"
)

// InitApiRouter 封装路由
func InitApiRouter() *gin.Engine {
	router := gin.Default()

	// 全局中间件，查看定义的中间价在middlewares文件夹中
	rootMiddleware(router)

	registerRootAPI(router)

	// 对路由进行分组，处理不同的分组，根据自己的需求定义即可
	staticRouter := router.Group("/server")
	staticRouter.Static("/", "application")

	serverGroup := router.Group("/lg_server")
	//debug模式下，注册swagger路由
	//knife4go: beautify swagger-ui http://ip:port/lg_server/doc.html
	// knife4go: beautify swagger-ui,
	serverConfig := config.GetConfig()
	if serverConfig.Debug {
		_ = knife4go.InitSwaggerKnife(serverGroup)
	}

	apiGroup := serverGroup.Group("/api")

	// base api
	registerBaseAPI(apiGroup)

	// 中间件拦截器
	groupMiddleware(apiGroup, middleware.SetContext(), middleware.RequestMiddleware())

	// v1 group api
	v1 := apiGroup.Group("/v1")
	registerV1GroupAPI(v1)

	return router
}

func rootMiddleware(r *gin.Engine, middlewares ...gin.HandlerFunc) {
	r.Use(middlewares...)
}

func groupMiddleware(g *gin.RouterGroup, middlewares ...gin.HandlerFunc) {
	g.Use(middlewares...)
}

func FileServer() (err error) {
	// 文件服务
	//err = http.ListenAndServe(":8001", http.FileServer(http.Dir("/root/files")))
	return
}

// TODO:注册根路由  http://ip:port/**
func registerRootAPI(router *gin.Engine) {
	if router == nil {
		return
	}
}

// TODO:注册服務路由  http://ip:port/server_name/**
func registerBaseAPI(router *gin.RouterGroup) {
	if router == nil {
		return
	}
	router.GET("/health-check", controller.HealthCheck)
}

// TODO:注册組路由 http://ip:port/server_name/group_name/**
func registerV1GroupAPI(v1Group *gin.RouterGroup) {
	if v1Group == nil {
		return
	}
}
