package mysql

import (
	"database/sql/driver"

	"github.com/go-sql-driver/mysql"
	"github.com/jasonlabz/cartl/storage/database"
)

func init() {
	var d Dialect
	database.RegisterDialect(d.Name(), d)
}

// Dialect mysql数据库方言
type Dialect struct{}

// Source 生产数据源
func (d Dialect) Source(bs *database.BaseSource) (database.Source, error) {
	return NewSource(bs)
}

// Name 数据库方言的注册名
func (d Dialect) Name() string {
	return "mysql"
}

// Source mysql数据源
type Source struct {
	*database.BaseSource //基础数据源

	dsn       string
	mysqlConf *mysql.Config
}

// NewSource 生成mysql数据源，在配置文件错误时会报错
func NewSource(bs *database.BaseSource) (s database.Source, err error) {
	source := &Source{
		BaseSource: bs,
	}
	var c *Config
	if c, err = NewConfig(source.Config()); err != nil {
		return
	}

	if source.mysqlConf, err = c.FetchMysqlConfig(); err != nil {
		return
	}
	source.dsn = source.mysqlConf.FormatDSN()
	return source, nil
}

// DriverName github.com/go-sql-driver/mysql的驱动名
func (s *Source) DriverName() string {
	return "mysql"
}

// ConnectName github.com/go-sql-driver/mysql的数据源连接信息
func (s *Source) ConnectName() string {
	return s.dsn
}

// Key 数据源的关键字，用于DBWrapper的复用
func (s *Source) Key() string {
	return s.dsn
}

// Table 生成mysql的表
func (s *Source) Table(b *database.BaseTable) database.Table {
	return NewTable(b)
}

// Connector github.com/go-sql-driver/mysql的数据源连接器
func (s *Source) Connector() (driver.Connector, error) {
	return mysql.NewConnector(s.mysqlConf)
}

// Quoted mysql引用函数
func Quoted(s string) string {
	return "`" + s + "`"
}
