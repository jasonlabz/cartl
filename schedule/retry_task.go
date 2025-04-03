package schedule

import (
	"context"
	"time"
)

// RetryTask 重试任务
type RetryTask struct {
	ctx      context.Context
	task     Task
	strategy RetryStrategy
}

// NewRetryTask 通过上下文关系ctx，重试策略strategy以及任务task生成重试任务
func NewRetryTask(ctx context.Context, strategy RetryStrategy, task Task) *RetryTask {
	return &RetryTask{
		ctx:      ctx,
		strategy: strategy,
		task:     task,
	}
}

// Do 同步执行
func (r *RetryTask) Do() (err error) {
	ticker := time.NewTicker(1)
	defer ticker.Stop()
	var before time.Duration
	for i := 1; ; i++ {
		select {
		case <-r.ctx.Done():
			if err == nil {
				err = r.ctx.Err()
			}
			return
		default:
		}

		err = r.task.Do()

		retry, wait := r.strategy.Next(err, i)
		if !retry {
			return
		}

		if wait != before {
			ticker.Reset(wait)
			before = wait
		}

		select {
		case <-ticker.C:
		case <-r.ctx.Done():
			return
		}
	}
}
