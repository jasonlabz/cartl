package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/jasonlabz/cartl/bootstrap"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	bootstrap.MustInit(ctx)
	log.Println("worker command started")

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGINT, syscall.SIGTERM, syscall.SIGQUIT)
	<-quit

	cancel()
	log.Println("worker command exiting")
}
