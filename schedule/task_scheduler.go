package schedule

import (
	"errors"
	"sync"

	"go.uber.org/atomic"
)

// ErrClosed 已关闭错误
var (
	ErrClosed = errors.New("task scheduler closed")
)

type taskWrapper struct {
	task   Task
	result chan error
}

// TaskScheduler 任务调度器
type TaskScheduler struct {
	taskWrappers chan *taskWrapper //待执行任务队列
	wg           sync.WaitGroup
	stop         chan struct{} //停止信号
	stopped      *atomic.Int32 //停止标识
	size         *atomic.Int32 //待执行队列大小
}

// NewTaskScheduler 根据执行者数workerNumber，待执行队列容量cap生成任务调度器
func NewTaskScheduler(workerNumber, cap int) *TaskScheduler {
	t := &TaskScheduler{
		taskWrappers: make(chan *taskWrapper, cap),
		stop:         make(chan struct{}),
		stopped:      atomic.NewInt32(0),
		size:         atomic.NewInt32(0),
	}

	for i := 0; i < workerNumber; i++ {
		t.wg.Add(1)
		go func() {
			defer t.wg.Done()
			t.processTask()
		}()
	}

	return t
}

// Push 将任务task加入队列，获得执行结果通知信道，在已关闭时报错
func (t *TaskScheduler) Push(task Task) (<-chan error, error) {
	if t.stopped.CAS(1, 1) {
		return nil, ErrClosed
	}
	t.stopped.Load()
	tw := &taskWrapper{
		task:   task,
		result: make(chan error, 1),
	}

	select {
	case t.taskWrappers <- tw:
		t.size.Inc()
		return tw.result, nil
	case <-t.stop:
		return nil, ErrClosed
	}
}

// Size 待执行队列大小
func (t *TaskScheduler) Size() int32 {
	return t.size.Load()
}

// Stop 停止任务调度器
func (t *TaskScheduler) Stop() {
	if !t.stopped.CAS(0, 1) {
		return
	}
	close(t.stop)
	t.wg.Wait()
}

func (t *TaskScheduler) processTask() {
	for {
		select {
		case tw, ok := <-t.taskWrappers:
			if !ok {
				return
			}
			tw.result <- tw.task.Do()
			t.size.Dec()
		case <-t.stop:
			return
		}
	}
}
