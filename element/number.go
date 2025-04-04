package element

import (
	"errors"
	"fmt"
	"math"
	"math/big"
	"strconv"
	"strings"

	"github.com/shopspring/decimal"
)

var _IntZero = big.NewInt(0)
var _IntTen = big.NewInt(10)
var _StrZero = "0"
var _DefaultNumberConverter NumberConverter = &Converter{}

// Number 数字
type Number interface {
	Bool() (bool, error)
	String() string
}

// NumberConverter 数字转化器
type NumberConverter interface {
	ConvertBigIntFromInt(i int64) (num BigIntNumber)
	ConvertDecimalFromFloat(f float64) (num DecimalNumber)
	ConvertBigInt(s string) (num BigIntNumber, err error)
	ConvertDecimal(s string) (num DecimalNumber, err error)
}

// BigIntNumber 高精度整数
type BigIntNumber interface {
	Number

	Int64() (int64, error)
	Decimal() DecimalNumber
	CloneBigInt() BigIntNumber
	AsBigInt() *big.Int
}

// DecimalNumber 高精度实数
type DecimalNumber interface {
	Number

	Float64() (float64, error)
	BigInt() BigIntNumber
	CloneDecimal() DecimalNumber
	AsDecimal() decimal.Decimal
}

// Int64 64位整数
type Int64 struct {
	value int64
}

// Bool 转化为布尔值
func (i *Int64) Bool() (bool, error) {
	return i.value != 0, nil
}

// Int64 转化为64位整数
func (i *Int64) Int64() (int64, error) {
	return i.value, nil
}

// Float64 转化为64位实数
func (i *Int64) Float64() (float64, error) {
	return float64(i.value), nil
}

// BigInt 转化为高精度整数
func (i *Int64) BigInt() BigIntNumber {
	return i
}

// Decimal 转化为高精度实数
func (i *Int64) Decimal() DecimalNumber {
	return i
}

// Decimal 转化为字符串
func (i *Int64) String() string {
	return strconv.FormatInt(i.value, 10)
}

// CloneBigInt 克隆高精度整数
func (i *Int64) CloneBigInt() BigIntNumber {
	return &Int64{
		value: i.value,
	}
}

// CloneDecimal 克隆高精度实数
func (i *Int64) CloneDecimal() DecimalNumber {
	return &Int64{
		value: i.value,
	}
}

// AsBigInt 转化为高精度整数
func (i *Int64) AsBigInt() *big.Int {
	return big.NewInt(i.value)
}

// AsDecimal 转化为高精度精度
func (i *Int64) AsDecimal() decimal.Decimal {
	return decimal.NewFromInt(i.value)
}

// BigInt 大整数
type BigInt struct {
	value *big.Int
}

// Bool 转化为布尔值
func (b *BigInt) Bool() (bool, error) {
	return b.value.Cmp(_IntZero) != 0, nil
}

// Int64 转化为64位整数
func (b *BigInt) Int64() (int64, error) {
	if b.value.IsInt64() {
		return b.value.Int64(), nil
	}
	return 0, errors.New("element: BigInt to int64 fail for out of range")
}

// Float64 转化为64位实数
func (b *BigInt) Float64() (v float64, err error) {
	f := new(big.Float).SetInt(b.value)
	if v, _ = f.Float64(); math.Abs(v) > math.MaxFloat64 {
		v = 0.0
		err = errors.New("element: BigIntStr to float64 fail for out of range")
		return
	}
	return
}

// BigInt 转化为高精度整数
func (b *BigInt) BigInt() BigIntNumber {
	return b
}

// Decimal 转化为高精度实数
func (b *BigInt) Decimal() DecimalNumber {
	return b
}

// Decimal 转化为字符串
func (b *BigInt) String() string {
	return b.value.String()
}

// CloneBigInt 克隆高精度整数
func (b *BigInt) CloneBigInt() BigIntNumber {
	return &BigInt{
		value: new(big.Int).Set(b.value),
	}
}

// CloneDecimal 克隆高精度实数
func (b *BigInt) CloneDecimal() DecimalNumber {
	return &BigInt{
		value: new(big.Int).Set(b.value),
	}
}

// AsBigInt 转化为高精度整数
func (b *BigInt) AsBigInt() *big.Int {
	return b.value
}

// AsDecimal 转化为高精度精度
func (b *BigInt) AsDecimal() decimal.Decimal {
	return decimal.NewFromBigInt(b.value, 0)
}

// BigIntStr 高精度整数
type BigIntStr struct {
	value string
}

// Bool 转化为布尔值
func (b *BigIntStr) Bool() (bool, error) {
	return false, errors.New("element: BigIntStr to Bool fail for out of range")
}

// Int64 转化为64位整数
func (b *BigIntStr) Int64() (int64, error) {
	return 0, errors.New("element: BigIntStr to int64 fail for out of range")
}

// Float64 转化为64位实数
func (b *BigIntStr) Float64() (v float64, err error) {
	f, _ := new(big.Float).SetString(b.value)
	if v, _ = f.Float64(); math.Abs(v) > math.MaxFloat64 {
		v = 0.0
		err = errors.New("element: BigIntStr to float64 fail for out of range")
		return
	}
	return
}

// BigInt 转化为高精度整数
func (b *BigIntStr) BigInt() BigIntNumber {
	return b
}

// Decimal 转化为高精度实数
func (b *BigIntStr) Decimal() DecimalNumber {
	return b
}

// Decimal 转化为字符串
func (b *BigIntStr) String() string {
	return b.value
}

// CloneBigInt 克隆高精度整数
func (b *BigIntStr) CloneBigInt() BigIntNumber {
	return &BigIntStr{
		value: b.value,
	}
}

// CloneDecimal 克隆高精度实数
func (b *BigIntStr) CloneDecimal() DecimalNumber {
	return &BigIntStr{
		value: b.value,
	}
}

// AsBigInt 转化为高精度整数
func (b *BigIntStr) AsBigInt() *big.Int {
	v, _ := new(big.Int).SetString(b.value, 10)
	return v
}

// AsDecimal 转化为高精度精度
func (b *BigIntStr) AsDecimal() decimal.Decimal {
	v, _ := new(big.Int).SetString(b.value, 10)
	return decimal.NewFromBigInt(v, 0)
}

// Float64 64位实数
type Float64 struct {
	value float64
}

// Bool 转化为布尔
func (f *Float64) Bool() (bool, error) {
	return f.value != 0.0, nil
}

// Float64 转化为64位实数
func (f *Float64) Float64() (float64, error) {
	return f.value, nil
}

// BigInt 转化为高精度整数
func (f *Float64) BigInt() BigIntNumber {
	s := f.String()
	pIndex := strings.Index(s, ".")
	if pIndex == -1 {
		pIndex = len(s)
	}
	return convertBigInt(s[:pIndex]).(BigIntNumber)
}

// Decimal 转化为高精度实数
func (f *Float64) Decimal() DecimalNumber {
	return f
}

// Decimal 转化为字符串
func (f *Float64) String() string {
	return strconv.FormatFloat(f.value, 'f', -1, 64)
}

// CloneDecimal 克隆高精度实数
func (f *Float64) CloneDecimal() DecimalNumber {
	return &Float64{
		value: f.value,
	}
}

// AsDecimal 转化为高精度精度
func (f *Float64) AsDecimal() decimal.Decimal {
	return decimal.NewFromFloat(f.value)
}

// DecimalStr 高精度实数
type DecimalStr struct {
	value  string
	intLen int
}

// Bool 转化为布尔
func (d *DecimalStr) Bool() (bool, error) {
	return d.value != _StrZero, nil
}

// Float64 转化为64位实数
func (d *DecimalStr) Float64() (v float64, err error) {
	f, _ := new(big.Float).SetString(d.value)
	if v, _ = f.Float64(); math.Abs(v) > math.MaxFloat64 {
		v = 0.0
		err = errors.New("element: DecimalStr to float64 fail for out of range")
		return
	}
	return
}

// BigInt 转化为高精度整数
func (d *DecimalStr) BigInt() BigIntNumber {
	return convertBigInt(d.value[:d.intLen]).(BigIntNumber)

}

// Decimal 转化为高精度实数
func (d *DecimalStr) Decimal() DecimalNumber {
	return d
}

// Decimal 转化为字符串
func (d *DecimalStr) String() string {
	return d.value
}

// CloneDecimal 克隆高精度实数
func (d *DecimalStr) CloneDecimal() DecimalNumber {
	return &DecimalStr{
		value:  d.value,
		intLen: d.intLen,
	}
}

// AsDecimal 转化为高精度精度
func (d *DecimalStr) AsDecimal() decimal.Decimal {
	intString := d.value
	if d.intLen+1 < len(d.value) {
		intString = d.value[:d.intLen] + d.value[d.intLen+1:]
	}
	v, _ := new(big.Int).SetString(intString, 10)
	return decimal.NewFromBigInt(v, int32(-len(d.value)+d.intLen+1))
}

// Decimal 高精度实数
type Decimal struct {
	value decimal.Decimal
}

// Bool 转化为布尔
func (d *Decimal) Bool() (bool, error) {
	return d.value.Cmp(decimal.Zero) != 0, nil
}

// Float64 转化为64位实数
func (d *Decimal) Float64() (float64, error) {
	v, _ := d.value.Float64()
	if math.Abs(v) > math.MaxFloat64 {
		return 0, errors.New("element: Decimal to float64 fail out of range")
	}
	return v, nil
}

// BigInt 转化为高精度整数
func (d *Decimal) BigInt() BigIntNumber {
	exp := d.value.Exponent()
	value := d.value.Coefficient()

	diff := math.Abs(-float64(exp))
	expScale := new(big.Int).Exp(_IntTen, big.NewInt(int64(diff)), nil)
	if 0 > exp {
		value = value.Quo(value, expScale)
	} else if 0 < exp {
		value = value.Mul(value, expScale)
	}

	return &BigInt{
		value: value,
	}
}

// Decimal 转化为高精度实数
func (d *Decimal) Decimal() DecimalNumber {
	return d
}

// Decimal 转化为字符串
func (d *Decimal) String() string {
	return d.value.String()
}

// CloneDecimal 克隆高精度实数
func (d *Decimal) CloneDecimal() DecimalNumber {
	return &Decimal{
		value: d.value.Copy(),
	}
}

// AsDecimal 转化为高精度精度
func (d *Decimal) AsDecimal() decimal.Decimal {
	return d.value
}

// OldConverter 无检查转化
type OldConverter struct{}

// ConvertBigIntFromInt 转化成实数
func (c *OldConverter) ConvertBigIntFromInt(i int64) (num BigIntNumber) {
	return &BigInt{
		value: big.NewInt(i),
	}
}

// ConvertDecimalFromFloat 转化成实数
func (c *OldConverter) ConvertDecimalFromFloat(f float64) (num DecimalNumber) {
	return &Decimal{
		value: decimal.NewFromFloat(f),
	}
}

// ConvertDecimal 把字符串转化成实数
func (c *OldConverter) ConvertDecimal(s string) (num DecimalNumber, err error) {
	var d decimal.Decimal
	if d, err = decimal.NewFromString(s); err != nil {
		return
	}
	num = &Decimal{
		value: d,
	}
	return
}

// ConvertBigInt 把字符串转化成整数
func (c *OldConverter) ConvertBigInt(s string) (num BigIntNumber, err error) {
	b, ok := new(big.Int).SetString(s, 10)
	if !ok {
		err = errors.New("number is not int")
		return
	}
	num = &BigInt{
		value: b,
	}
	return
}

// Converter 数字转化器
type Converter struct{}

// ConvertBigIntFromInt 转化成实数
func (c *Converter) ConvertBigIntFromInt(i int64) (num BigIntNumber) {
	return &Int64{
		value: i,
	}
}

// ConvertDecimalFromFloat 转化成实数
func (c *Converter) ConvertDecimalFromFloat(f float64) (num DecimalNumber) {
	return &Float64{
		value: f,
	}
}

// ConvertDecimal 把字符串转化成实数
func (c *Converter) ConvertDecimal(s string) (num DecimalNumber, err error) {
	eIndex := strings.IndexAny(s, "Ee")
	if eIndex == -1 {
		return convertDecimal(s)
	}
	num, err = convertDecimal(s[:eIndex])
	if err != nil {
		return nil, err
	}

	var expInt int64
	if expInt, err = strconv.ParseInt(s[eIndex+1:], 10, 32); err != nil {
		return nil, fmt.Errorf("can't convert %s to decimal: fractional part too long", s)
	}
	exp := expInt
	var dValue *big.Int
	switch data := num.(type) {
	case *Int64:
		dValue = big.NewInt(data.value)
	case *BigIntStr:
		dValue, _ = new(big.Int).SetString(data.value, 10)
	case *DecimalStr:
		intString := data.value
		if data.intLen+1 < len(data.value) {
			intString = data.value[:data.intLen] + data.value[data.intLen+1:]
			expInt := -len(data.value[data.intLen+1:])
			exp += int64(expInt)
		}
		if len(intString) <= 18 {
			parsed64, _ := strconv.ParseInt(intString, 10, 64)
			dValue = big.NewInt(parsed64)
		} else {
			dValue, _ = new(big.Int).SetString(intString, 10)
		}
	}

	if exp < math.MinInt32 || exp > math.MaxInt32 {
		// NOTE(vadim): I doubt a string could realistically be this long
		return nil, fmt.Errorf("can't convert %s to decimal: fractional part too long", s)
	}
	return &Decimal{
		value: decimal.NewFromBigInt(dValue, int32(exp)),
	}, nil
}

// ConvertBigInt 把字符串转化成整数
func (c *Converter) ConvertBigInt(s string) (num BigIntNumber, err error) {
	if len(s) == 0 {
		err = errors.New("element: convertDecimal empty string")
		return
	}
	sign := ""
	if s[0] == '+' || s[0] == '-' {
		if s[0] == '-' {
			sign = "-"
		}
		s = s[1:]
	}

	if len(s) == 0 {
		err = errors.New("element: convertDecimal empty string")
		return
	}

	start := len(s)
	for i := 0; i < len(s); i++ {
		if s[i] != '0' {
			start = i
			break
		}
	}
	s = s[start:]

	if err = checkInt(s); err != nil {
		return
	}
	first := s
	if len(first) == 0 {
		first = "0"
	}
	return convertBigInt(sign + first).(BigIntNumber), nil
}

func convertBigInt(s string) (n Number) {
	v, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return &BigIntStr{
			value: s,
		}
	}
	return &Int64{
		value: v,
	}
}

func convertDecimal(s string) (num DecimalNumber, err error) {
	if len(s) == 0 {
		err = errors.New("element: convertDecimal empty string")
		return
	}
	sign := ""
	if s[0] == '+' || s[0] == '-' {
		if s[0] == '-' {
			sign = "-"
		}
		s = s[1:]
	}

	if len(s) == 0 {
		err = errors.New("element: convertDecimal empty string")
		return
	}

	if s[0] == '.' && len(s[1:]) == 0 {
		err = errors.New("element: convertDecimal only dot")
		return
	}

	start := len(s)
	for i := 0; i < len(s); i++ {
		if s[i] != '0' {
			start = i
			break
		}
	}
	s = s[start:]
	pIndex := -1

	for i := 0; i < len(s); i++ {
		if s[i] == '.' {
			if pIndex > -1 {
				return nil, errors.New("element: convertDecimal too many dots")
			}
			pIndex = i
		}
	}

	if pIndex != -1 {
		end := -1
		for i := len(s) - 1; i >= 0; i-- {
			if s[i] != '0' {
				end = i
				break
			}
		}
		s = s[:end+1]

		if err = checkInt(s[:pIndex]); err != nil {
			return
		}

		if err = checkInt(s[pIndex+1:]); err != nil {
			return
		}
		first := s[:pIndex]
		if len(first) == 0 {
			first = "0"
		}
		if len(s[pIndex+1:]) == 0 {
			return &DecimalStr{
				value:  sign + first,
				intLen: len(sign) + len(first),
			}, nil
		}

		return &DecimalStr{
			value:  sign + first + s[pIndex:],
			intLen: len(sign) + len(first),
		}, nil
	}

	if err = checkInt(s); err != nil {
		return
	}

	first := s
	if len(first) == 0 {
		first = "0"
	}
	return convertBigInt(sign + first).(DecimalNumber), nil
}

func checkInt(s string) (err error) {
	for _, ch := range s {
		if ch < '0' || ch > '9' {
			err = errors.New("element: convertDecimal invalid syntax")
			return
		}
	}
	return
}
