package operator

import "context"

type IOperator interface {
	RunFunc(ctx context.Context, data []map[string]any) (err error)
	InitFunc(ctx context.Context) (err error)
	DestroyFunc(ctx context.Context) (err error)
}

type DataType string

const (
	INT    DataType = "int32"
	LONG   DataType = "int64"
	NULL   DataType = "nil"
	DATE   DataType = "date"
	BOOL   DataType = "bool"
	STRING DataType = "string"
	BYTES  DataType = "[]byte"
	DOUBLE DataType = "float64"
	FLOAT  DataType = "float32"
)

type Item struct {
	Type     DataType
	Data     any
	ByteSize int
}
