package database

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"strconv"

	"github.com/jasonlabz/cartl/element"
	"github.com/pingcap/errors"
)

// 写入数据库模式
const (
	WriteModeInsert = "insert"
)

// FetchHandler 获取记录句柄
type FetchHandler interface {
	OnRecord(element.Record) error
	CreateRecord() (element.Record, error)
}

// BaseFetchHandler 基础获取记录句柄
type BaseFetchHandler struct {
	onRecord     func(element.Record) error
	createRecord func() (element.Record, error)
}

// NewBaseFetchHandler 创建基础获取记录句柄
func NewBaseFetchHandler(createRecord func() (element.Record, error),
	onRecord func(element.Record) error) *BaseFetchHandler {
	return &BaseFetchHandler{
		onRecord:     onRecord,
		createRecord: createRecord,
	}
}

// OnRecord 处理记录r
func (b *BaseFetchHandler) OnRecord(r element.Record) error {
	return b.onRecord(r)
}

// CreateRecord 创建记录
func (b *BaseFetchHandler) CreateRecord() (element.Record, error) {
	return b.createRecord()
}

// DB 用户维护数据库连接池
type DB struct {
	Source

	db *sql.DB
}

// NewDB 从数据源source中获取数据库连接池
func NewDB(source Source) (d *DB, err error) {
	var c *Config
	c, err = NewConfig(source.Config())
	if err != nil {
		return nil, errors.Wrapf(err, "NewConfig(%v) fail", source.Config())
	}

	d = &DB{
		Source: source,
	}
	if _, ok := d.Source.(WithConnector); ok {
		var conn driver.Connector
		conn, err = d.Source.(WithConnector).Connector()
		if err != nil {
			return nil, errors.Wrapf(err, "Connector(%v) fail", d.Source.DriverName())
		}
		d.db = sql.OpenDB(conn)
	} else {
		d.db, err = sql.Open(d.Source.DriverName(), d.Source.ConnectName())
		if err != nil {
			return nil, errors.Wrapf(err, "Open(%v) fail", d.Source.DriverName())
		}
	}

	d.db.SetMaxOpenConns(c.Pool.GetMaxOpenConns())
	d.db.SetMaxIdleConns(c.Pool.GetMaxIdleConns())
	if c.Pool.ConnMaxIdleTime != 0 {
		d.db.SetConnMaxIdleTime(c.Pool.ConnMaxIdleTime)
	}
	if c.Pool.ConnMaxLifetime != 0 {
		d.db.SetConnMaxLifetime(c.Pool.ConnMaxLifetime)
	}

	return
}

// FetchTable 通过上下文ctx和基础表数据t，获取对应的表并会返回错误
func (d *DB) FetchTable(ctx context.Context, t *BaseTable) (Table, error) {
	return d.FetchTableWithParam(ctx, NewTableQueryParam(d.Table(t)))
}

// FetchTableWithParam 通过上下文ctx和sql参数param，获取对应的表并会返回错误
func (d *DB) FetchTableWithParam(ctx context.Context, param Parameter) (Table, error) {
	table := param.Table()
	if fetcher, ok := table.(FieldsFetcher); ok {
		if err := fetcher.FetchFields(ctx, d); err != nil {
			return nil, err
		}
		return table, nil
	}
	query, agrs, err := getQueryAndAgrs(param, nil)
	if err != nil {
		return nil, err
	}
	rows, err := d.QueryContext(ctx, query, agrs...)
	if err != nil {
		return nil, errors.Wrapf(err, "QueryContext(%v) fail", query)
	}
	defer rows.Close()

	return fetchTableByRows(rows, table)
}

// FetchRecord 通过上下文ctx，sql参数param以及记录处理函数onRecord
// 获取多行记录返回错误
func (d *DB) FetchRecord(ctx context.Context, param Parameter, handler FetchHandler) (err error) {
	var query string
	var agrs []interface{}

	if query, agrs, err = getQueryAndAgrs(param, nil); err != nil {
		return
	}

	var rows *sql.Rows
	if rows, err = d.QueryContext(ctx, query, agrs...); err != nil {
		return errors.Wrapf(err, "QueryContext(%v) fail", query)
	}
	defer rows.Close()
	table := param.Table()
	if len(table.Fields()) == 0 {
		table, err = fetchTableByRows(rows, table)
		if err != nil {
			return errors.Wrapf(err, "fetchTableByRows fail")
		}
		param.SetTable(table)
	}

	return readRowsToRecord(rows, param, handler)
}

// FetchRecordWithTx 通过上下文ctx，sql参数param以及记录处理函数onRecord
// 使用事务获取多行记录并返回错误
func (d *DB) FetchRecordWithTx(ctx context.Context, param Parameter, handler FetchHandler) (err error) {
	var query string
	var agrs []interface{}

	if query, agrs, err = getQueryAndAgrs(param, nil); err != nil {
		return
	}

	var tx *sql.Tx

	if tx, err = d.BeginTx(ctx, param.TxOptions()); err != nil {
		return errors.Wrapf(err, "BeginTx(%+v) fail", param.TxOptions())
	}

	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	var rows *sql.Rows
	if rows, err = tx.QueryContext(ctx, query, agrs...); err != nil {
		return errors.Wrapf(err, "QueryContext(%v) fail", query)
	}
	defer rows.Close()
	table := param.Table()
	if len(table.Fields()) == 0 {
		table, err = fetchTableByRows(rows, table)
		if err != nil {
			return errors.Wrapf(err, "fetchTableByRows fail")
		}
		param.SetTable(table)
	}
	return readRowsToRecord(rows, param, handler)
}

// BatchExec 批量执行sql并处理多行记录
func (d *DB) BatchExec(ctx context.Context, opts *ParameterOptions) (err error) {
	var param Parameter
	if param, err = execParam(opts); err != nil {
		return
	}
	return d.batchExec(ctx, param, opts.Records)
}

// BatchExecStmt 批量prepare/exec执行sql并处理多行记录
func (d *DB) BatchExecStmt(ctx context.Context, opts *ParameterOptions) (err error) {
	var param Parameter
	if param, err = execParam(opts); err != nil {
		return
	}
	return d.batchExecStmt(ctx, param, opts.Records)
}

// BatchExecWithTx 批量事务执行sql并处理多行记录
func (d *DB) BatchExecWithTx(ctx context.Context, opts *ParameterOptions) (err error) {
	var param Parameter
	if param, err = execParam(opts); err != nil {
		return
	}
	return d.batchExecWithTx(ctx, param, opts.Records)
}

// BatchExecStmtWithTx 批量事务prepare/exec执行sql并处理多行记录
func (d *DB) BatchExecStmtWithTx(ctx context.Context, opts *ParameterOptions) (err error) {
	var param Parameter
	if param, err = execParam(opts); err != nil {
		return
	}
	return d.batchExecStmtWithTx(ctx, param, opts.Records)
}

// BeginTx 获取事务
func (d *DB) BeginTx(ctx context.Context, opts *sql.TxOptions) (*sql.Tx, error) {
	return d.db.BeginTx(ctx, opts)
}

// PingContext 通过query查询多行数据
func (d *DB) PingContext(ctx context.Context) error {
	return d.db.PingContext(ctx)
}

// QueryContext 通过query查询多行数据
func (d *DB) QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error) {
	return d.db.QueryContext(ctx, query, args...)
}

// ExecContext 执行query并获取结果
func (d *DB) ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error) {
	return d.db.ExecContext(ctx, query, args...)
}

// Close 关闭数据连接池
func (d *DB) Close() (err error) {
	if d.db != nil {
		return d.db.Close()
	}
	return
}

func (d *DB) batchExec(ctx context.Context, param Parameter, records []element.Record) (err error) {
	var query string
	var agrs []interface{}

	if query, agrs, err = getQueryAndAgrs(param, records); err != nil {
		return
	}

	if _, err = d.ExecContext(ctx, query, agrs...); err != nil {
		return errors.Wrapf(err, "ExecContext(%v) fail", query)
	}
	return nil
}

func (d *DB) batchExecStmt(ctx context.Context, param Parameter, records []element.Record) (err error) {
	var query string
	if query, err = param.Query(records); err != nil {
		return errors.Wrapf(err, "param.Query() fail")
	}

	var stmt *sql.Stmt
	if stmt, err = d.db.PrepareContext(ctx, query); err != nil {
		return errors.Wrapf(err, "tx.PrepareContext(%v) fail", query)
	}
	defer func() {
		stmt.Close()
	}()

	for _, r := range records {
		var valuers []interface{}
		if valuers, err = param.Agrs([]element.Record{
			r,
		}); err != nil {
			return errors.Wrapf(err, "param.Args() fail")
		}
		if _, err = stmt.ExecContext(ctx, valuers...); err != nil {
			return errors.Wrapf(err, "stmt.ExecContext(%v) fail", query)
		}
	}
	if _, err = stmt.ExecContext(ctx); err != nil {
		return errors.Wrapf(err, "stmt.ExecContext fail")
	}
	return
}

func (d *DB) batchExecWithTx(ctx context.Context, param Parameter, records []element.Record) (err error) {
	var query string
	var agrs []interface{}

	if query, agrs, err = getQueryAndAgrs(param, records); err != nil {
		return
	}

	var tx *sql.Tx
	if tx, err = d.db.BeginTx(ctx, param.TxOptions()); err != nil {
		return errors.Wrapf(err, "BeginTx(%+v) fail", param.TxOptions())
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	if _, err = tx.ExecContext(ctx, query, agrs...); err != nil {
		return errors.Wrapf(err, "ExecContext(%v) fail", query)
	}
	return nil
}

func (d *DB) batchExecStmtWithTx(ctx context.Context, param Parameter, records []element.Record) (err error) {
	var query string
	if query, err = param.Query(records); err != nil {
		return errors.Wrapf(err, "param.Query() fail")
	}

	var tx *sql.Tx
	if tx, err = d.db.BeginTx(ctx, param.TxOptions()); err != nil {
		return errors.Wrapf(err, "BeginTx(%+v) fail", param.TxOptions())
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	var stmt *sql.Stmt
	if stmt, err = tx.PrepareContext(ctx, query); err != nil {
		return errors.Wrapf(err, "tx.PrepareContext(%v) fail", query)
	}
	defer func() {
		stmt.Close()
	}()

	for _, r := range records {
		var valuers []interface{}
		if valuers, err = param.Agrs([]element.Record{
			r,
		}); err != nil {
			return errors.Wrapf(err, "param.Args() fail")
		}
		if _, err = stmt.ExecContext(ctx, valuers...); err != nil {
			return errors.Wrapf(err, "stmt.ExecContext(%v) fail", query)
		}
	}
	if _, err = stmt.ExecContext(ctx); err != nil {
		return errors.Wrapf(err, "stmt.ExecContext fail")
	}
	return
}

func execParam(opts *ParameterOptions) (param Parameter, err error) {
	execParams, ok := opts.Table.(ExecParameter)
	if !ok {
		if opts.Mode != WriteModeInsert {
			return nil, errors.Errorf("table is not ExecParameter and mode is not insert")
		}
		param = NewInsertParam(opts.Table, opts.TxOptions)
	} else {
		if param, ok = execParams.ExecParam(opts.Mode, opts.TxOptions); !ok {
			if opts.Mode != WriteModeInsert {
				return nil, errors.Errorf("ExecParam is not exist and mode is not insert")
			}
			param = NewInsertParam(opts.Table, opts.TxOptions)
		}
	}
	return
}

func getQueryAndAgrs(param Parameter, records []element.Record) (query string, agrs []interface{}, err error) {
	if query, err = param.Query(records); err != nil {
		err = errors.Errorf("param.Query() err: %v", err)
		return
	}
	if agrs, err = param.Agrs(records); err != nil {
		query = ""
		err = errors.Errorf("param.Agrs() err: %v", err)
		return
	}
	return
}

func fetchTableByRows(rows *sql.Rows, table Table) (Table, error) {
	names, err := rows.Columns()
	if err != nil {
		return nil, errors.Wrapf(err, "rows.Columns() fail")
	}
	types, err := rows.ColumnTypes()
	if err != nil {
		return nil, errors.Wrapf(err, "rows.ColumnTypes() fail")
	}

	adder, ok := table.(FieldAdder)
	if !ok {
		return nil, errors.Errorf("Table is not FieldAdder")
	}
	nameMap := make(map[string]struct{})
	for i, v := range names {
		name := v
		if _, ok := nameMap[v]; ok {
			name = v + strconv.Itoa(i)
		}
		nameMap[name] = struct{}{}
		adder.AddField(NewBaseField(i, name, NewBaseFieldType(types[i])))
	}

	for _, v := range table.Fields() {
		if !v.Type().IsSupported() {
			return nil, errors.Errorf("table: %v filed:%v type(%v) is not supportted", table.Quoted(), v.Name(), v.Type().DatabaseTypeName())
		}
	}
	return table, nil
}

func readRowsToRecord(rows *sql.Rows, param Parameter, handler FetchHandler) (err error) {
	var scanners []interface{}
	for _, f := range param.Table().Fields() {
		scanners = append(scanners, f.Scanner())
	}

	for rows.Next() {
		if err = rows.Scan(scanners...); err != nil {
			return errors.Wrapf(err, "rows.Scan fail")
		}
		var record element.Record
		if record, err = handler.CreateRecord(); err != nil {
			return errors.Wrapf(err, "CreateRecord fail")
		}
		for _, v := range scanners {
			record.Add(v.(Scanner).Column())
		}
		if err = handler.OnRecord(record); err != nil {
			return errors.Wrapf(err, "OnRecord fail")
		}
	}

	if err = rows.Err(); err != nil {
		return errors.Wrapf(err, "rows.Err() fail")
	}
	return nil
}
