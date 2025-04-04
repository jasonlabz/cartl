package postgres

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"net"

	"github.com/jasonlabz/cartl/element"
	"github.com/jasonlabz/cartl/storage/database"
	"github.com/lib/pq"
	"github.com/pingcap/errors"
)

// WriteModeCopyIn copy in写入方式
const WriteModeCopyIn = "copyIn"

// Table postgres表
type Table struct {
	*database.BaseTable
	database.BaseConfigSetter
}

// NewTable 创建postgres表，注意此时BaseTable中的schema参数为架构名，instance为数据库名，而name是表明
func NewTable(b *database.BaseTable) *Table {
	return &Table{
		BaseTable: b,
	}
}

// Quoted 引用全名
func (t *Table) Quoted() string {
	return Quoted(t.Schema()) + "." + Quoted(t.Name())
}

func (t *Table) String() string {
	return t.Quoted()
}

// AddField 新增列
func (t *Table) AddField(baseField *database.BaseField) {
	f := NewField(baseField)
	f.SetConfig(t.Config())
	t.AppendField(f)
}

// ExecParam 获取执行参数，其中copy in的参数方式以及被注册
func (t *Table) ExecParam(mode string, txOpts *sql.TxOptions) (database.Parameter, bool) {
	switch mode {
	case WriteModeCopyIn:
		return NewCopyInParam(t, txOpts), true
	}
	return nil, false
}

// ShouldRetry 重试
func (t *Table) ShouldRetry(err error) bool {
	switch cause := errors.Cause(err).(type) {
	case net.Error:
		return true
	default:
		return cause == driver.ErrBadConn
	}
}

// ShouldOneByOne 单个重试
func (t *Table) ShouldOneByOne(err error) bool {
	_, ok := errors.Cause(err).(*pq.Error)
	return ok
}

// CopyInParam copy in 参数
type CopyInParam struct {
	*database.BaseParam
}

// NewCopyInParam  通过表table和事务参数txOps插入参数
func NewCopyInParam(t database.Table, txOpts *sql.TxOptions) *CopyInParam {
	return &CopyInParam{
		BaseParam: database.NewBaseParam(t, txOpts),
	}
}

// Query 批量copy in插入sql语句
func (ci *CopyInParam) Query(_ []element.Record) (query string, err error) {
	var columns []string
	for _, f := range ci.Table().Fields() {
		columns = append(columns, f.Name())
	}
	return pq.CopyInSchema(ci.Table().Schema(), ci.Table().Name(),
		columns...), nil
}

// Agrs 通过多条记录 records生成批量copy in参数
func (ci *CopyInParam) Agrs(records []element.Record) (valuers []interface{}, err error) {
	for _, r := range records {
		for fi, f := range ci.Table().Fields() {
			var c element.Column
			if c, err = r.GetByIndex(fi); err != nil {
				return nil, fmt.Errorf("GetByIndex(%v) err: %v", fi, err)
			}
			var v driver.Value
			if v, err = f.Valuer(c).Value(); err != nil {
				return nil, err
			}

			valuers = append(valuers, interface{}(v))
		}
	}
	return
}
