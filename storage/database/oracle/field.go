package oracle

import (
	"database/sql/driver"
	"fmt"
	"math/big"
	"strconv"
	"time"

	"github.com/godror/godror"
	"github.com/jasonlabz/cartl/element"
	"github.com/jasonlabz/cartl/storage/database"
	"github.com/shopspring/decimal"
)

var (
	dateLayout     = element.DefaultTimeFormat[:10]
	datetimeLayout = element.DefaultTimeFormat[:26]
)

// Field 字段
type Field struct {
	*database.BaseField
	database.BaseConfigSetter
}

// NewField 通过基本列属性生成字段
func NewField(bf *database.BaseField) *Field {
	return &Field{
		BaseField: bf,
	}
}

// Quoted 引用，用于SQL语句
func (f *Field) Quoted() string {
	return Quoted(f.Name())
}

// BindVar SQL占位符，用于SQL语句
func (f *Field) BindVar(i int) string {
	//解决时间格式错误ORA-01861: literal does not match format string
	switch f.FieldType().DatabaseTypeName() {
	case "DATE":
		return "to_date(:" + strconv.Itoa(i) + ",'yyyy-mm-dd hh24:mi:ss')"
	case "TIMESTAMP", "TIMESTAMP WITH TIME ZONE", "TIMESTAMP WITH LOCAL TIME ZONE":
		return "to_timestamp(:" + strconv.Itoa(i) + ",'yyyy-mm-dd hh24:mi:ss.ff9')"
	}

	return ":" + strconv.Itoa(i)
}

// Select 查询时字段，用于SQL查询语句
func (f *Field) Select() string {
	return Quoted(f.Name())
}

// Type 字段类型
func (f *Field) Type() database.FieldType {
	return NewFieldType(f.FieldType())
}

// Scanner 扫描器，用于读取数据
func (f *Field) Scanner() database.Scanner {
	return NewScanner(f)
}

// Valuer 赋值器，采用GoValuer处理数据
func (f *Field) Valuer(c element.Column) database.Valuer {
	return NewValuer(f, c)
}

// FieldType 字段类型
type FieldType struct {
	*database.BaseFieldType

	supportted bool
}

// NewFieldType 创建新的字段类型
func NewFieldType(typ database.ColumnType) *FieldType {
	f := &FieldType{
		BaseFieldType: database.NewBaseFieldType(typ),
	}
	switch f.DatabaseTypeName() {

	case "BOOLEAN",
		"BINARY_INTEGER",
		"NUMBER", "FLOAT", "DOUBLE",
		"TIMESTAMP", "TIMESTAMP WITH TIME ZONE", "TIMESTAMP WITH LOCAL TIME ZONE", "DATE",
		"VARCHAR2", "NVARCHAR2", "CHAR", "NCHAR", "LONG",
		"CLOB", "NCLOB", "BLOB", "RAW", "LONG RAW":
		f.supportted = true
	}
	return f
}

// IsSupported 是否支持解析
func (f *FieldType) IsSupported() bool {
	return f.supportted
}

// Scanner 扫描器
type Scanner struct {
	f *Field
	database.BaseScanner
}

// NewScanner 根据列类型生成扫描器
func NewScanner(f *Field) *Scanner {
	return &Scanner{
		f: f,
	}
}

// Scan 根据列类型读取数据
// "BOOLEAN" 做为bool类型处理
// "BINARY_INTEGER" 做为bigint类型处理
// "NUMBER", "FLOAT", "DOUBLE" 做为decimal类型处理
// "TIMESTAMP", "TIMESTAMP WITH TIME ZONE", "TIMESTAMP WITH LOCAL TIME ZONE", "DATE"做为time类型处理
// "CLOB", "NCLOB", "VARCHAR2", "NVARCHAR2", "CHAR", "NCHAR"做为string类型处理
// "BLOB", "RAW", "LONG RAW", "LONG" 做为bytes类型处理
func (s *Scanner) Scan(src interface{}) (err error) {
	var cv element.ColumnValue
	byteSize := element.ByteSize(src)

	switch s.f.Type().DatabaseTypeName() {
	case "BOOLEAN":
		switch data := src.(type) {
		case nil:
			cv = element.NewNilBoolColumnValue()
		case bool:
			cv = element.NewBoolColumnValue(data)
		default:
			return fmt.Errorf("src is %v(%T), but not %v", src, src, element.TypeBigInt)
		}
	case "BINARY_INTEGER":
		switch data := src.(type) {
		case nil:
			cv = element.NewNilBigIntColumnValue()
		case int64:
			cv = element.NewBigIntColumnValueFromInt64(data)
		case uint64:
			cv = element.NewBigIntColumnValue(new(big.Int).SetUint64(data))
		default:
			return fmt.Errorf("src is %v(%T), but not %v", src, src, element.TypeBigInt)
		}
	//todo test BFILE
	case //"BFILE",
		"BLOB", "LONG", "RAW", "LONG RAW":
		switch data := src.(type) {
		case nil:
			cv = element.NewNilBytesColumnValue()
		case []byte:
			cv = element.NewBytesColumnValue(data)
		default:
			return fmt.Errorf("src is %v(%T),but not %v", src, src, element.TypeBytes)
		}
	case "DATE":
		switch data := src.(type) {
		case nil:
			cv = element.NewNilTimeColumnValue()
		case time.Time:
			cv = element.NewTimeColumnValueWithDecoder(data, element.NewStringTimeDecoder(dateLayout))
		default:
			return fmt.Errorf("src is %v(%T), but not %v", src, src, element.TypeTime)
		}
	case "TIMESTAMP", "TIMESTAMP WITH TIME ZONE", "TIMESTAMP WITH LOCAL TIME ZONE":
		switch data := src.(type) {
		case nil:
			cv = element.NewNilTimeColumnValue()
		case time.Time:
			cv = element.NewTimeColumnValueWithDecoder(data, element.NewStringTimeDecoder(datetimeLayout))
		default:
			return fmt.Errorf("src is %v(%T), but not %v", src, src, element.TypeTime)
		}
	case "CLOB", "NCLOB", "VARCHAR2", "NVARCHAR2", "CHAR", "NCHAR":
		switch data := src.(type) {
		case string:
			if data == "" {
				cv = element.NewNilStringColumnValue()
			} else {
				switch s.f.Type().DatabaseTypeName() {
				case "CHAR", "NCHAR":
					data = s.f.TrimStringChar(data)
				}
				cv = element.NewStringColumnValue(data)
			}
		default:
			return fmt.Errorf("src is %v(%T), but not %v", src, src, element.TypeString)
		}
	case "NUMBER", "FLOAT", "DOUBLE":
		s := ""
		switch data := src.(type) {
		case nil:
			cv = element.NewNilDecimalColumnValue()
		case float32:
			cv = element.NewDecimalColumnValue(decimal.NewFromFloat32(data))
		case float64:
			cv = element.NewDecimalColumnValueFromFloat(data)
		case int64:
			s = strconv.FormatInt(data, 10)
		case uint64:
			s = strconv.FormatUint(data, 10)
		case bool:
			s = "0"
			if data {
				s = "1"
			}
		case godror.Number:
			s = string(data)
			byteSize = len(s)
		default:
			return fmt.Errorf("src is %v(%T), but not %v", src, src, element.TypeDecimal)
		}
		if s != "" {
			if cv, err = element.NewDecimalColumnValueFromString(s); err != nil {
				return
			}
		}
	default:
		return fmt.Errorf("src is %v(%T), but db type is %v", src, src, s.f.Type().DatabaseTypeName())
	}
	s.SetColumn(element.NewDefaultColumn(cv, s.f.Name(), byteSize))
	return
}

// Valuer 赋值器
type Valuer struct {
	f *Field
	c element.Column
}

// NewValuer 创建新赋值器
func NewValuer(f *Field, c element.Column) *Valuer {
	return &Valuer{
		f: f,
		c: c,
	}
}

// Value 赋值
func (v *Valuer) Value() (value driver.Value, err error) {
	switch v.f.Type().DatabaseTypeName() {
	case "BOOLEAN":
		//在oracle中插入空字符居然是nil对应NULL
		if v.c.IsNil() {
			return "", nil
		}
		var b bool
		if b, err = v.c.AsBool(); err != nil {
			return nil, err
		}
		if b {
			return "1", nil
		}
		return "0", nil
		//todo test BFILE
	case //"BFILE",
		"BLOB", "LONG", "RAW", "LONG RAW":
		//竞优这些类型插入的nil对应NULL
		if v.c.IsNil() {
			return nil, nil
		}
		return v.c.AsBytes()
	}
	//在oracle中插入空字符居然是nil对应NULL
	if v.c.IsNil() {
		return "", nil
	}
	//由于oracle特殊的转化机制导致所有的数据需要转化为string类型进行插入
	return v.c.AsString()
}
