package database

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"strconv"

	"github.com/jasonlabz/cartl/config"
	"github.com/jasonlabz/cartl/element"
)

type mockDialect struct {
	name string
	err  error
}

func (m *mockDialect) Source(bs *BaseSource) (Source, error) {
	return &mockSource{
		BaseSource: bs,
		name:       m.name,
	}, m.err
}

type mockDialectConnector struct {
	err error
}

func (m *mockDialectConnector) Source(bs *BaseSource) (Source, error) {
	return &mockWithConnector{
		mockSource: &mockSource{
			BaseSource: bs,
			name:       "",
		},
		err: m.err,
	}, nil
}

type mockSource struct {
	*BaseSource
	name string
}

func (m *mockSource) DriverName() string {
	return m.name
}
func (m *mockSource) ConnectName() string {
	return "mock dsn"
}

func (m *mockSource) Key() string {
	return m.ConnectName()
}

func (m *mockSource) Table(bt *BaseTable) Table {
	return &mockTable{
		BaseTable: bt,
	}
}

type mockWithConnector struct {
	*mockSource
	err error
}

func (m *mockWithConnector) Connector() (driver.Connector, error) {
	return &mockConnector{}, m.err
}

type mockFieldType struct {
	*BaseFieldType
	goType GoType
}

func newMockFieldType(goType GoType) *mockFieldType {
	return &mockFieldType{
		BaseFieldType: NewBaseFieldType(&sql.ColumnType{}),
		goType:        goType,
	}
}

func (m *mockFieldType) DatabaseTypeName() string {
	return strconv.Itoa(int(m.goType))
}

func (m *mockFieldType) GoType() GoType {
	return m.goType
}

type mockField struct {
	*BaseField

	typ FieldType
}

func newMockField(bf *BaseField, typ FieldType) *mockField {
	return &mockField{
		BaseField: bf,
		typ:       typ,
	}
}

func (m *mockField) Type() FieldType {
	return m.typ
}

func (m *mockField) Quoted() string {
	return m.Name()
}

func (m *mockField) BindVar(i int) string {
	return "$" + strconv.Itoa(i)
}

func (m *mockField) Select() string {
	return m.Name()
}

func (m *mockField) Scanner() Scanner {
	return &mockScanner{
		f: m,
	}
}

func (m *mockField) Valuer(c element.Column) Valuer {
	return NewGoValuer(m, c)
}

type mockScanner struct {
	f Field
	BaseScanner
}

func (m *mockScanner) Scan(src interface{}) error {
	var cv element.ColumnValue
	switch m.f.Type().DatabaseTypeName() {
	case strconv.Itoa(int(GoTypeBool)):
		switch data := src.(type) {
		case nil:
			cv = element.NewNilBoolColumnValue()
		case bool:
			cv = element.NewBoolColumnValue(data)
		default:
			return fmt.Errorf("src is %v(%T)", src, src)
		}
	case strconv.Itoa(int(GoTypeInt64)):
		switch data := src.(type) {
		case nil:
			cv = element.NewNilBigIntColumnValue()
		case int64:
			cv = element.NewBigIntColumnValueFromInt64(data)
		default:
			return fmt.Errorf("src is %v(%T)", src, src)
		}
	case strconv.Itoa(int(GoTypeFloat64)):
		switch data := src.(type) {
		case nil:
			cv = element.NewNilDecimalColumnValue()
		case float64:
			cv = element.NewDecimalColumnValueFromFloat(data)
		default:
			return fmt.Errorf("src is %v(%T)", src, src)
		}
	case strconv.Itoa(int(GoTypeString)):
		switch data := src.(type) {
		case nil:
			cv = element.NewNilStringColumnValue()
		case string:
			cv = element.NewStringColumnValue(data)
		default:
			return fmt.Errorf("src is %v(%T)", src, src)
		}
	}
	m.SetColumn(element.NewDefaultColumn(cv, m.f.Name(), 0))
	return nil
}

type mockTable struct {
	*BaseTable
}

func newMockTable(bt *BaseTable) *mockTable {
	return &mockTable{
		BaseTable: bt,
	}
}

func (m *mockTable) Quoted() string {
	return m.Instance() + "." + m.Schema() + "." + m.Name()
}

func (m *mockTable) AddField(bf *BaseField) {
	i, _ := strconv.Atoi(bf.FieldType().DatabaseTypeName())
	m.AppendField(newMockField(bf, newMockFieldType(GoType(i))))
}

func testJSONFromString(s string) *config.JSON {
	json, err := config.NewJSONFromString(s)
	if err != nil {
		panic(err)
	}
	return json
}
