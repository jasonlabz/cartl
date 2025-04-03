package schedule

import (
	"errors"
	"sync"
	"testing"
	"time"
)

func TestTaskScheduler_Once(t *testing.T) {
	scheduler := NewTaskScheduler(2, 0)
	wait := make(chan struct{})
	waited := make(chan struct{})
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 1000; i++ {
			if i == 100 {
				close(wait)
				<-waited
			}
			scheduler.Push(&mockTask{})
		}
	}()
	wg.Add(1)
	go func() {
		defer wg.Done()
		<-wait
		scheduler.Stop()
		close(waited)
	}()
	wg.Wait()
}

func TestTaskScheduler_Multi(t *testing.T) {
	scheduler := NewTaskScheduler(2, 0)
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 1000; i++ {
			scheduler.Push(&mockTask{})
		}
	}()
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 1000; i++ {
			scheduler.Push(&mockTask{})
		}
	}()
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 1000; i++ {
			scheduler.Push(&mockTask{})
		}
	}()
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 1000; i++ {
			scheduler.Stop()
		}
	}()
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 1000; i++ {
			scheduler.Stop()
		}
	}()
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 1000; i++ {
			scheduler.Size()
		}
	}()
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 1000; i++ {
			scheduler.Size()
		}
	}()
	wg.Wait()
}

func TestTaskScheduler_Size(t *testing.T) {
	scheduler := NewTaskScheduler(1, 0)
	scheduler.Push(&mockTask{100 * time.Millisecond})
	if scheduler.Size() != 1 {
		t.Errorf("Size() = %v want: 1", scheduler.Size())
	}
	time.Sleep(1 * time.Second)
	if scheduler.Size() != 0 {
		t.Errorf("Size() = %v want: 0", scheduler.Size())
	}
}

func TestTaskScheduler_Stop(t *testing.T) {
	scheduler := NewTaskScheduler(1, 0)
	scheduler.Stop()
	_, err := scheduler.Push(&mockTask{})
	if !errors.Is(err, ErrClosed) {
		t.Errorf("Push() = %v want: %v", err, ErrClosed)
	}
}
