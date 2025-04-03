package element

import (
	"fmt"
	"math/big"
	"time"

	"github.com/shopspring/decimal"
)

type mockTimeDecoder struct {
	StringTimeDecoder
}

func (m *mockTimeDecoder) TimeDecode(t time.Time) (interface{}, error) {
	return time.Time{}, fmt.Errorf("mockTimeDecoder error")
}

type mockColumnValue struct {
	*nilColumnValue
}

func newMockColumnValue() ColumnValue {
	return &mockColumnValue{
		nilColumnValue: &nilColumnValue{},
	}
}

func (m *mockColumnValue) Type() ColumnType {
	return ColumnType("mock")
}

func testBigIntFromString(v string) *big.Int {
	bi, ok := new(big.Int).SetString(v, 10)
	if !ok {
		panic(fmt.Errorf("%v is not int", v))
	}
	return bi
}

func testBigIntColumnValueFromString(v string) *BigIntColumnValue {
	c, err := NewBigIntColumnValueFromString(v)
	if err != nil {
		panic(err)
	}
	return c.(*BigIntColumnValue)
}

func testDecimalFormString(v string) decimal.Decimal {
	d, err := decimal.NewFromString(v)
	if err != nil {
		panic(err)
	}
	return d
}

func testDecimalColumnValueFormString(v string) ColumnValue {
	d, err := NewDecimalColumnValueFromString(v)
	if err != nil {
		panic(err)
	}
	return d
}
