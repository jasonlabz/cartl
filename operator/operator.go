package operator

import "context"

type IOperator interface {
	RunFunc(ctx context.Context, data []map[string]any) (err error)
	InitFunc(ctx context.Context) (err error)
	DestroyFunc(ctx context.Context) (err error)
}
