package xcron

import (
	"context"
	"sync"
	"time"

	"github.com/robfig/cron/v3"

	"github.com/jasonlabz/cartl/core/log"
	"github.com/jasonlabz/cartl/core/xcron/base"
)

var (
	once                         sync.Once
	crontab                      *cron.Cron
	jobMap                       sync.Map
	secondParser, standardParser cron.Parser
)

func init() {
	once.Do(func() {
		// 初始化标准表达式解析
		standardParser = cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor)
		// 初始化秒级表达式解析
		secondParser = cron.NewParser(cron.Second | cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor)
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
