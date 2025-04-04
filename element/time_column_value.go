package element

import (
	"fmt"
	"time"
)

// NilTimeColumnValue 空值时间列值
type NilTimeColumnValue struct {
	*nilColumnValue
}

// NewNilTimeColumnValue 创建空值时间列值
func NewNilTimeColumnValue() ColumnValue {
	return &NilTimeColumnValue{
		nilColumnValue: &nilColumnValue{},
	}
}

// Type 列类型
func (n *NilTimeColumnValue) Type() ColumnType {
	return TypeTime
}

// Clone 克隆空值时间列值
func (n *NilTimeColumnValue) Clone() ColumnValue {
	return NewNilTimeColumnValue()
}

// TimeColumnValue 时间列值
type TimeColumnValue struct {
	notNilColumnValue
	TimeDecoder //时间解码器

	val time.Time
}

// NewTimeColumnValue 根据时间t获得时间列值
func NewTimeColumnValue(t time.Time) ColumnValue {
	return NewTimeColumnValueWithDecoder(t, NewStringTimeDecoder(DefaultTimeFormat))
}

// NewTimeColumnValueWithDecoder 根据时间t和时间解码器t获得时间列值
func NewTimeColumnValueWithDecoder(t time.Time, d TimeDecoder) ColumnValue {
	return &TimeColumnValue{
		TimeDecoder: d,
		val:         t,
	}
}

// Type 列类型
func (t *TimeColumnValue) Type() ColumnType {
	return TypeTime
}

// AsBool 无法转化布尔值
func (t *TimeColumnValue) AsBool() (bool, error) {
	return false, NewTransformErrorFormColumnTypes(t.Type(), TypeBool, fmt.Errorf("val: %v", t.String()))
}

// AsBigInt 无法转化整数
func (t *TimeColumnValue) AsBigInt() (BigIntNumber, error) {
	return nil, NewTransformErrorFormColumnTypes(t.Type(), TypeBigInt, fmt.Errorf("val: %v", t.String()))
}

// AsDecimal 无法转化高精度实数
func (t *TimeColumnValue) AsDecimal() (DecimalNumber, error) {
	return nil, NewTransformErrorFormColumnTypes(t.Type(), TypeDecimal, fmt.Errorf("val: %v", t.String()))
}

// AsString 变为字符串
func (t *TimeColumnValue) AsString() (s string, err error) {
	var i interface{}
	i, err = t.TimeDecode(t.val)
	if err != nil {
		return "", NewTransformErrorFormColumnTypes(t.Type(), TypeString, fmt.Errorf("val: %v", t.String()))
	}
	return i.(string), nil
}

// AsBytes 变为字节流
func (t *TimeColumnValue) AsBytes() (b []byte, err error) {
	var i interface{}
	i, err = t.TimeDecode(t.val)
	if err != nil {
		return nil, NewTransformErrorFormColumnTypes(t.Type(), TypeString, fmt.Errorf("val: %v", t.String()))
	}
	return []byte(i.(string)), nil
}

// AsTime 变为时间
func (t *TimeColumnValue) AsTime() (time.Time, error) {
	return t.val, nil
}

func (t *TimeColumnValue) String() string {
	return t.val.Format(DefaultTimeFormat)
}

// Clone 克隆时间列值
func (t *TimeColumnValue) Clone() ColumnValue {
	return &TimeColumnValue{
		val: t.val,
	}
}

// Cmp  返回1代表大于， 0代表相等， -1代表小于
func (t *TimeColumnValue) Cmp(right ColumnValue) (int, error) {
	rightValue, err := right.AsTime()
	if err != nil {
		return 0, err
	}

	if t.val.After(rightValue) {
		return 1, nil
	}
	if t.val.Before(rightValue) {
		return -1, nil
	}
	return 0, nil
}
