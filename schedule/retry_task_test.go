package schedule

import (
	"context"
	"errors"
	"testing"
	"time"
)

type mockNTimeTask struct {
	err error
	n   int
}

func (m *mockNTimeTask) Do() error {
	m.n--
	if m.n == 0 {
		return m.err
	}
	return errors.New("mock error")
}

func TestRetryTask_Do(t *testing.T) {
	type args struct {
		ctx      context.Context
		strategy RetryStrategy
		task     Task
		timeout  time.Duration
	}

	tests := []struct {
		name    string
		args    args
		wantErr bool
	}{
		{
			name: "1",
			args: args{
				ctx:      context.TODO(),
				strategy: NewNTimesRetryStrategy(&mockRetryJudger{}, 10, 1*time.Millisecond),
				task: &mockNTimeTask{
					n: 2,
				},
			},
			wantErr: false,
		},
		{
			name: "2",
			args: args{
				ctx:      context.TODO(),
				strategy: NewNTimesRetryStrategy(&mockRetryJudger{}, 10, 1*time.Millisecond),
				task: &mockNTimeTask{
					n: 11,
				},
			},
			wantErr: true,
		},
		{
			name: "2",
			args: args{
				ctx:      context.TODO(),
				strategy: NewNTimesRetryStrategy(&mockRetryJudger{}, 10, 1*time.Millisecond),
				task: &mockNTimeTask{
					n: 11,
				},
			},
			wantErr: true,
		},
		{
			name: "3",
			args: args{
				ctx:      context.TODO(),
				strategy: NewNTimesRetryStrategy(&mockRetryJudger{}, 10, 2*time.Millisecond),
				task: &mockNTimeTask{
					n: 11,
				},
				timeout: 1 * time.Nanosecond,
			},
			wantErr: true,
		},
		{
			name: "4",
			args: args{
				ctx:      context.TODO(),
				strategy: NewNTimesRetryStrategy(&mockRetryJudger{}, 10, 2*time.Millisecond),
				task: &mockNTimeTask{
					n: 11,
				},
				timeout: 2 * time.Millisecond,
			},
			wantErr: true,
		},
		{
			name: "4",
			args: args{
				ctx:      context.TODO(),
				strategy: NewNTimesRetryStrategy(&mockRetryJudger{}, 10, 2*time.Millisecond),
				task: &mockNTimeTask{
					n: 11,
				},
				timeout: 2*time.Millisecond + 1*time.Nanosecond,
			},
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctx, cancel := context.WithCancel(tt.args.ctx)
			defer func() {
				if tt.args.timeout == 0 {
					cancel()
				}
			}()
			go func() {
				if tt.args.timeout != 0 {
					<-time.After(tt.args.timeout)
					cancel()
				}
			}()
			r := NewRetryTask(ctx, tt.args.strategy, tt.args.task)
			if err := r.Do(); (err != nil) != tt.wantErr {
				t.Errorf("RetryTask.Do() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
