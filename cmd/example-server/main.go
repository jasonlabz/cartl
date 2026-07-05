package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	_ "net/http/pprof"
	"os"
	"os/signal"
	"syscall"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/keepalive"

	"github.com/gin-gonic/gin"
	"github.com/jasonlabz/potato/ginmetrics"

	"github.com/jasonlabz/cartl/bootstrap"
	"github.com/jasonlabz/cartl/server/routers"
)

// @title		    TODO: ***********服务
// @version		    1.0
// @description	    TODO: 旨在***********
// @host			TODO: localhost:port
// @contact.name	TODO: your name
// @contact.url	    TODO: http://www.*****.io/support
// @contact.email	TODO: mail_name@qq.com
// @BasePath		TODO: /base_path
func main() {
	// context
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// bootstrap init
	bootstrap.MustInit(ctx)

	// gin mode
	serverMode := gin.ReleaseMode
	serverConfig := bootstrap.GetConfig()
	if serverConfig.IsDebugMode() {
		serverMode = gin.DebugMode
	}
	gin.SetMode(serverMode)

	r := routers.InitApiRouter()

	prometheusConf := serverConfig.GetPrometheusConfig()
	if prometheusConf.Enable {
		// get global Monitor object
		m := ginmetrics.GetMonitor()

		// +optional set metric path, default /debug/metrics
		m.SetMetricPath(prometheusConf.Path)
		// +optional set slow time, default 5s
		m.SetSlowTime(10)
		// +optional set request duration, default {0.1, 0.3, 1.2, 5, 10}
		// used to p95, p99
		m.SetDuration([]float64{0.1, 0.3, 1.2, 5, 10})

		// set middleware for gin
		m.Use(r)
	}

	pprofSrv := startPProfServer(r, serverConfig)
	fileSrv := startFileServer(serverConfig)
	grpcSrv, grpcLis := startGRPCServer(serverConfig)

	// start program
	srv := startHTTPServer(r, serverConfig)

	if srv == nil && pprofSrv == nil && fileSrv == nil && grpcSrv == nil {
		log.Println("no service enabled, exiting")
		return
	}

	// receive quit signal, ready to exit
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)

	<-quit
	log.Println("Shutdown Server ...")
	cancel()

	shutdownCtx, cancelShutdown := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancelShutdown()

	if fileSrv != nil {
		if err := fileSrv.Shutdown(shutdownCtx); err != nil {
			log.Printf("file server shutdown failed: %v", err)
		}
	}
	if pprofSrv != nil {
		if err := pprofSrv.Shutdown(shutdownCtx); err != nil {
			log.Printf("pprof server shutdown failed: %v", err)
		}
	}
	if srv != nil {
		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Printf("http server shutdown failed: %v", err)
		}
	}
	if grpcSrv != nil {
		stopDone := make(chan struct{})
		go func() {
			grpcSrv.GracefulStop()
			close(stopDone)
		}()
		select {
		case <-stopDone:
		case <-shutdownCtx.Done():
			grpcSrv.Stop()
		}
	}
	if grpcLis != nil {
		_ = grpcLis.Close()
	}
	log.Println("Server exit")
}

// startHTTPServer 自定义http配置
func startHTTPServer(router *gin.Engine, c *bootstrap.Config) *http.Server {
	if !c.IsHTTPEnable() {
		return nil
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", c.GetHTTPPort()),
		Handler:      router,
		ReadTimeout:  c.GetHTTPReadTimeout(),
		WriteTimeout: c.GetHTTPWriteTimeout(),
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	return srv
}

func startPProfServer(router *gin.Engine, c *bootstrap.Config) *http.Server {
	pprofConf := c.GetPProfConfig()
	if !pprofConf.Enable {
		return nil
	}

	router.GET("/debug/pprof/*any", gin.WrapH(http.DefaultServeMux))
	srv := &http.Server{Addr: fmt.Sprintf(":%d", pprofConf.Port), Handler: nil}
	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("pprof server failed: %v", err)
		}
	}()
	return srv
}

func startGRPCServer(c *bootstrap.Config) (*grpc.Server, net.Listener) {
	if !c.IsGRPCEnable() {
		return nil, nil
	}

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", c.GetGRPCPort()))
	if err != nil {
		log.Fatalf("grpc listen failed: %v", err)
	}

	grpcCfg := c.GetServerConfig().GRPC
	srv := grpc.NewServer(
		grpc.KeepaliveParams(keepalive.ServerParameters{
			MaxConnectionIdle:     300 * time.Second,
			MaxConnectionAge:      1800 * time.Second,
			MaxConnectionAgeGrace: 30 * time.Second,
			Time:                  30 * time.Second,
			Timeout:               10 * time.Second,
		}),
		grpc.MaxConcurrentStreams(grpcCfg.MaxConcurrentStreams),
	)

	go func() {
		if serveErr := srv.Serve(lis); serveErr != nil {
			if !errors.Is(serveErr, net.ErrClosed) {
				log.Printf("grpc server failed: %v", serveErr)
			}
		}
	}()

	return srv, lis
}

// startFileServer 文件服务
func startFileServer(c *bootstrap.Config) *http.Server {
	config := c.GetStaticConfig()
	if !c.IsStaticEnable() || config.Path == "" {
		return nil
	}

	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.Dir(config.Path)))

	var handler http.Handler = mux
	if config.Username != "" && config.Password != "" {
		handler = basicAuth(mux, config.Username, config.Password)
	}

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", config.Port),
		Handler: handler,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("file server listen: %s\n", err)
		}
	}()

	return srv
}

// basicAuth 认证检查
func basicAuth(handler http.Handler, username, password string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, pass, ok := r.BasicAuth()
		if !ok || user != username || pass != password {
			w.Header().Set("WWW-Authenticate", `Basic realm="Restricted"`)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		handler.ServeHTTP(w, r)
	})
}
