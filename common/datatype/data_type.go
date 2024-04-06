package datatype

import "time"

type FieldType string

const (
	BYTES   FieldType = "[]byte"
	RUNES   FieldType = "[]rune"
	INT     FieldType = "int"
	INT8    FieldType = "int8"
	INT16   FieldType = "int16"
	INT32   FieldType = "int32"
	INT64   FieldType = "int64"
	FLOAT32 FieldType = "float32"
	FLOAT64 FieldType = "float64"
	BOOL    FieldType = "bool"
	STRING  FieldType = "string"
	TIME    FieldType = "time"
)

type Field struct {
	Type        FieldType
	StringValue string
	IntValue    int64
	TimeValue   time.Time
	FloatValue  float64
	Scale       int
	Precision   int
}

func Trans() {

}
