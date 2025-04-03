package job_service

import (
	"sync"

	"github.com/jasonlabz/cartl/server/service"
)

var svc *Service
var once sync.Once

func GetInstance() service.JobService {
	if svc != nil {
		return svc
	}
	once.Do(func() {
		svc = &Service{}
	})

	return svc
}

type Service struct {
}
