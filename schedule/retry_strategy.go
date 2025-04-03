package schedule

import (
	"encoding/json"
	"math"
	"math/rand"
	"time"

	"github.com/bytedance/sonic"
	"github.com/jasonlabz/potato/jsonutil"
	"github.com/pingcap/errors"
)

// NewRetryStrategy 根据配置文件生成重试策略
func NewRetryStrategy(j RetryJudge, conf *jsonutil.JSON) (s RetryStrategy, err error) {
	var retry *jsonutil.JSON
	if ok := conf.Exists("retry"); !ok {
		return NewNoneRetryStrategy(), nil
	}
	if retry, err = conf.GetSubJSON("retry"); err != nil {
		return
	}
	var typ string
	if typ, err = retry.GetString("type"); err != nil {
		return
	}

	var strategy *jsonutil.JSON
	if strategy, err = retry.GetSubJSON("strategy"); err != nil {
		return
	}

	switch typ {
	case "ntimes":
		var retryConf NTimesRetryConfig
		if err = sonic.Unmarshal([]byte(strategy.String()), &retryConf); err != nil {
			return
		}
		if retryConf.N == 0 || retryConf.Wait == 0 {
			err = errors.New("ntimes retry config is valid")
			return
		}
		s = NewNTimesRetryStrategy(j, retryConf.N, retryConf.Wait)
		return
	case "forever":
		var retryConf ForeverRetryConfig
		if err = json.Unmarshal([]byte(strategy.String()), &retryConf); err != nil {
			return
		}
		if retryConf.Wait == 0 {
			err = errors.New("forever retry config is valid")
			return
		}
		s = NewForeverRetryStrategy(j, retryConf.Wait)
		return
	case "exponential":
		var retryConf ExponentialRetryConfig
		if err = json.Unmarshal([]byte(strategy.String()), &retryConf); err != nil {
			return
		}
		if retryConf.Init == 0 || retryConf.Max == 0 {
			err = errors.New("exponential retry config is valid")
			return
		}
		s = NewExponentialRetryStrategy(j, retryConf.Init, retryConf.Max)
		return
	}
	err = errors.Errorf("no such type(%v)", typ)
	return
}

// NTimesRetryConfig n次数重复重试策略
type NTimesRetryConfig struct {
	N    int           `json:"n"`
	Wait time.Duration `json:"wait"` //重试等待时间
}

// ForeverRetryConfig 永久重复重试策略
type ForeverRetryConfig struct {
	Wait time.Duration `json:"wait"` //重试等待时间
}

// ExponentialRetryConfig 幂重复重试策略
type ExponentialRetryConfig struct {
	Init time.Duration `json:"init"`
	Max  time.Duration `json:"max"`
}

// RetryStrategy 重试策略
type RetryStrategy interface {
	Next(err error, n int) (retry bool, wait time.Duration)
}

// RetryJudge 重试判断器
type RetryJudge interface {
	ShouldRetry(err error) bool
}

// NoneRetryStrategy 无重试策略
type NoneRetryStrategy struct{}

// NewNoneRetryStrategy 创建无重试策略
func NewNoneRetryStrategy() RetryStrategy {
	return &NoneRetryStrategy{}
}

// Next 下一次是否retry需要重试，wait等待时间
func (r *NoneRetryStrategy) Next(err error, n int) (retry bool, wait time.Duration) {
	return
}

// NTimesRetryStrategy n次数重复重试策略
type NTimesRetryStrategy struct {
	j    RetryJudge
	n    int
	wait time.Duration
}

// NewNTimesRetryStrategy 通过重试判定器j,最大次数n以及重试间隔wait创建n次数重复重试策略
func NewNTimesRetryStrategy(j RetryJudge, n int, wait time.Duration) RetryStrategy {
	return &NTimesRetryStrategy{
		j:    j,
		n:    n,
		wait: wait,
	}
}

// Next 通过错误err以及当前次数n获取下次是否重试retry以及下次时间间隔wait
func (r *NTimesRetryStrategy) Next(err error, n int) (retry bool, wait time.Duration) {
	if !r.j.ShouldRetry(err) {
		return false, 0
	}

	if n >= r.n {
		return false, 0
	}
	return true, r.wait
}

// ForeverRetryStrategy 永久重试策略
type ForeverRetryStrategy struct {
	j    RetryJudge
	wait time.Duration
}

// NewForeverRetryStrategy 通过重试判定器j以及重试间隔wait创建永久重试策略
func NewForeverRetryStrategy(j RetryJudge, wait time.Duration) RetryStrategy {
	return &ForeverRetryStrategy{
		j:    j,
		wait: wait,
	}
}

// Next 通过错误err,获取下次是否重试retry以及下次时间间隔wait,在永久重试策略没有最大重试次数，当前次数n没有作用
func (r *ForeverRetryStrategy) Next(err error, _ int) (retry bool, wait time.Duration) {
	if !r.j.ShouldRetry(err) {
		return false, 0
	}

	return true, r.wait
}

// ExponentialStrategy 幂重试策略
type ExponentialStrategy struct {
	j    RetryJudge
	f    float64
	init float64
	max  float64
}

// NewExponentialRetryStrategy 通过重试判定器j,开始时间间隔init以及最大时间间隔max创建幂重试策略
func NewExponentialRetryStrategy(j RetryJudge, init, max time.Duration) RetryStrategy {
	rand.Seed(time.Now().UnixNano())
	return &ExponentialStrategy{
		j:    j,
		f:    2.0,
		init: float64(init),
		max:  float64(max),
	}
}

// Next 通过错误err,获取下次是否重试retry以及下次时间间隔wait,在幂重试策略最大时间间隔
func (r *ExponentialStrategy) Next(err error, n int) (retry bool, wait time.Duration) {
	if !r.j.ShouldRetry(err) {
		return false, 0
	}
	x := 1.0 + rand.Float64() // random number in [1..2]
	m := math.Min(x*r.init*math.Pow(r.f, float64(n)), r.max)
	if m >= r.max {
		return false, 0
	}
	return true, time.Duration(m)
}
