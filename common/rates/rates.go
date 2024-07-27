package rates

import (
	"context"
	"golang.org/x/time/rate"

	"github.com/jasonlabz/cartl/element"
)

type RateLimiter struct {
	limiter *rate.Limiter
}

func NewRateLimiter(rps float64, burst int) *RateLimiter {
	return &RateLimiter{
		limiter: rate.NewLimiter(rate.Limit(rps), burst),
	}
}

func (r *RateLimiter) Limit(next <-chan element.Record) <-chan element.Record {
	out := make(chan element.Record)
	go func() {
		defer close(out)
		background := context.Background()
		for record := range next {
			r.limiter.Wait(background) // 控制速率
			out <- record
		}
	}()
	return out
}
