package cron

import (
	"context"
	"sync"
	"time"

	"github.com/robfig/cron/v3"

	"github.com/jasonlabz/cartl/core/cron/base"
	"github.com/jasonlabz/cartl/core/log"
)

var (
	once    sync.Once
	crontab *cron.Cron
	jobMap  sync.Map
)

func init() {
	once.Do(func() {
		crontab = cron.New(cron.WithLocation(time.Local), cron.WithSeconds(),
			cron.WithChain(cron.Recover(log.DefaultLogger())))
	})
	if crontab == nil {
		panic("cron init error")
	}
	crontab.Start()
}

func RegisterCronTask(ctx context.Context) {

}

func RegisterJob(ctx context.Context, switchOn bool, spec string, job base.JobBase) (err error) {
	jobName := job.GetJobName()
	jobIdentity, err := crontab.AddJob(spec, job)
	if err != nil {
		return
	}
	jobMap.Store(jobName, jobIdentity)
	return
}

func RegisterFunc(ctx context.Context, switchOn bool, spec string, cmd func()) (err error) {
	_, err = crontab.AddFunc(spec, cmd)
	return
}

func SubmitJob() {
	cron.New(cron.WithSeconds(), cron.WithChain(
		cron.Recover(log.DefaultLogger()),
	))
}

func SubmitJob() {
	cron.New(cron.WithSeconds(), cron.WithChain(
		cron.Recover(log.DefaultLogger()),
	))
}
