package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	_ "net/http/pprof"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jasonlabz/potato/config"
	"github.com/jasonlabz/potato/ginmetrics"

	_ "github.com/jasonlabz/cartl/bootstrap"
	"github.com/jasonlabz/cartl/server/routers"
)

// @title		ETL计算引擎服务
// @version		1.0
// @description	 封装ETL处理逻辑，降低数据治理门槛
// @host			localhost:8080
// @contact.name	lucas
// @contact.url	http://www.swagger.io/support
// @contact.email	1783022886@qq.com
// @BasePath		/lg_server/api
func main() {
	// gin mode
	serverMode := gin.ReleaseMode
	serverConfig := config.GetConfig()
	if serverConfig.Debug {
		serverMode = gin.DebugMode
	}
	gin.SetMode(serverMode)

	r := routers.InitApiRouter()

	appConf := serverConfig.Application
	if appConf != nil && appConf.Prom.Enable {
		// get global Monitor object
		m := ginmetrics.GetMonitor()

		// +optional set metric path, default /debug/metrics
		m.SetMetricPath(appConf.Prom.Path)
		// +optional set slow time, default 5s
		m.SetSlowTime(10)
		// +optional set request duration, default {0.1, 0.3, 1.2, 5, 10}
		// used to p95, p99
		m.SetDuration([]float64{0.1, 0.3, 1.2, 5, 10})

		// set middleware for gin
		m.Use(r)
	}

	if appConf != nil && appConf.PProf.Enable {
		r.GET("/debug/pprof/*any", gin.WrapH(http.DefaultServeMux))

		go func() {
			if err := http.ListenAndServe(fmt.Sprintf(":%d", appConf.PProf.Port), nil); err != nil {
				log.Fatalf("pprof server failed: %v", err)
			}
		}()
	}

	startServer(r)
}

// startServer 自定义http配置
func startServer(router *gin.Engine) {
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", config.GetConfig().Application.Port),
		Handler: router,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	quit := make(chan os.Signal)
	signal.Notify(quit, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutdown Server ...")

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server Shutdown:", err)
	}
	log.Println("Server exiting")
}
