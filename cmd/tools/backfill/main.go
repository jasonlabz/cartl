package main

import (
	"context"
	"log"

	"github.com/jasonlabz/cartl/bootstrap"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	bootstrap.MustInit(ctx)
	log.Println("tools/backfill command started")
	log.Println("tools/backfill command finished")
}
