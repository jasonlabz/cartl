package bootstrap

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gorm.io/gorm"

	"github.com/jasonlabz/potato/gormx"

	"github.com/jasonlabz/cartl/global/resource"
)

// ── 常量 ──

const migrationTableSQL = `CREATE TABLE IF NOT EXISTS schema_migrations (
	version VARCHAR(255) PRIMARY KEY,
	applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`

const (
	baselinePrefix = "00000000_000" // 基线文件名前缀，有且仅有一个
	versionPrefix  = "-- @version " // 推荐版本声明，也支持 --@version
	versionPrefix2 = "--@version "
)

// ── 数据结构 ──

// migFile 迁移文件元信息。
// version 优先取头部 -- @version，缺失则从文件名前缀 YYYYMMDD_NNN 解析。
// baseline 由文件名是否以 00000000_000 开头决定。
type migFile struct {
	name     string
	version  string
	baseline bool
}

// ── 公开入口 ──

// ensureDB 检查目标数据库是否存在，不存在则创建。
// 通过 gormx.InitConfig 临时连接管理库，用完 Close，不污染全局连接池。
func ensureDB(ctx context.Context) {
	cfg := GetConfig().DataSource
	if !cfg.Enable {
		return
	}

	if !isAutoCreateSupported(cfg.DBType) {
		resource.Logger.Warnf(ctx,
			"[ensureDB] 数据库类型 %s 不支持自动创建，请手动创建 %s 库后重启",
			cfg.DBType, cfg.Database)
		return
	}

	adminCfg := toGormxConfig(cfg)
	adminDB, err := gormx.InitConfig(adminCfg)
	if err != nil {
		resource.Logger.Errorf(ctx, "[ensureDB] 连接服务器失败: %v", err)
		return
	}
	defer gormx.Close(adminCfg.DBName)

	if dbExists(adminDB, cfg.DBType, cfg.Database) {
		return
	}

	if err := adminDB.Exec(createDBSQL(cfg.DBType, cfg.Database)).Error; err != nil {
		resource.Logger.Errorf(ctx, "[ensureDB] 创建数据库失败: %v", err)
		return
	}
	resource.Logger.Infof(ctx, "[ensureDB] 数据库 %s 已创建", cfg.Database)
}

// runMigrations 执行表结构迁移（仅 DDL，不含种子数据）。
//
// 版本号优先取头部 -- @version，缺失则从文件名前缀 YYYYMMDD_NNN 解析。
// 基线由文件名是否以 00000000_000 开头判定，有且仅有一个。
//
// 策略：
//   - 新库 → 执行基线 → 跳过版本 ≤ 基线版本的增量 → 执行剩余增量
//   - 已有库 → 只执行版本 > 最新已应用版本的增量
func runMigrations(ctx context.Context) {
	cfg := GetConfig().DataSource
	if !cfg.Enable {
		return
	}

	db := gormx.DefaultMaster()
	if err := db.Exec(migrationTableSQL).Error; err != nil {
		resource.Logger.Errorf(ctx, "[migrate] 创建追踪表失败: %v", err)
		return
	}

	files := loadMigrations(ctx, "conf/migrations")
	if len(files) == 0 {
		return
	}

	// 拆分基线 / 增量
	var baseline *migFile
	var incs []*migFile
	for i := range files {
		if files[i].baseline {
			baseline = &files[i]
		} else {
			incs = append(incs, &files[i])
		}
	}

	latest := latestVersion(db)

	if latest == "" {
		if baseline == nil {
			resource.Logger.Error(ctx, "[migrate] 缺少基线文件（文件名需以 00000000_000 开头）")
			return
		}
		resource.Logger.Infof(ctx, "[migrate] 执行基线 %s (版本 %s)", baseline.name, baseline.version)
		if err := execFile(db, baseline); err != nil {
			resource.Logger.Errorf(ctx, "[migrate] 基线失败: %v", err)
			return
		}
		latest = baseline.version
	}

	for _, mf := range incs {
		if mf.version <= latest {
			continue
		}
		done, err := isApplied(db, mf.version)
		if err != nil {
			resource.Logger.Errorf(ctx, "[migrate] 查询状态失败 %s: %v", mf.name, err)
			return
		}
		if done {
			continue
		}
		resource.Logger.Infof(ctx, "[migrate] 执行 %s (版本 %s)", mf.name, mf.version)
		if err := execFile(db, mf); err != nil {
			resource.Logger.Errorf(ctx, "[migrate] 迁移失败 %s: %v", mf.name, err)
			return
		}
	}
}

// runSeed 在所有 DDL 迁移完成后执行种子数据。
//
// 种子数据不记录版本号，每次启动都执行。
// INSERT 必须使用 ON CONFLICT ... DO NOTHING 保证幂等。
// 执行失败不阻塞启动。
func runSeed(ctx context.Context) {
	cfg := GetConfig().DataSource
	if !cfg.Enable {
		return
	}

	names := listSQLFiles("conf/seed")
	if len(names) == 0 {
		return
	}

	db := gormx.DefaultMaster()
	for _, name := range names {
		path := filepath.Join("conf", "seed", name)
		content, err := os.ReadFile(path)
		if err != nil {
			resource.Logger.Errorf(ctx, "[seed] 读取 %s 失败: %v", name, err)
			continue
		}
		if err := db.Exec(string(content)).Error; err != nil {
			resource.Logger.Warnf(ctx, "[seed] %s 执行失败(已跳过): %v", name, err)
			continue
		}
		resource.Logger.Infof(ctx, "[seed] %s 已执行", name)
	}
}

// ── 文件加载与解析 ──

// loadMigrations 扫描目录、解析版本号、按版本排序。
// 版本号优先取头部 -- @version，缺失从文件名前缀 YYYYMMDD_NNN 解析。
// 两种方式都拿不到则跳过并告警。
func loadMigrations(ctx context.Context, dir string) []migFile {
	names := listSQLFiles(dir)
	files := make([]migFile, 0, len(names))

	for _, name := range names {
		ver := resolveVersion(filepath.Join(dir, name), name)
		if ver == "" {
			resource.Logger.Warnf(ctx, "[migrate] 跳过 %s: 无法解析版本号", name)
			continue
		}
		files = append(files, migFile{
			name:     name,
			version:  ver,
			baseline: strings.HasPrefix(name, baselinePrefix),
		})
	}

	sort.Slice(files, func(i, j int) bool {
		return files[i].version < files[j].version
	})
	return files
}

// resolveVersion 从文件中解析版本号。
// 优先读取头部 -- @version / --@version，缺失则从文件名前缀 YYYYMMDD_NNN 提取。
func resolveVersion(path, name string) string {
	if v := parseHeaderVersion(path); v != "" {
		return v
	}
	return extractNameVersion(name)
}

// parseHeaderVersion 读取 SQL 文件前若干行，查找 -- @version xxx 或 --@version xxx。
func parseHeaderVersion(path string) string {
	f, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer f.Close()

	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if v, ok := cutVersion(line, versionPrefix); ok {
			return strings.TrimSpace(v)
		}
		if v, ok := cutVersion(line, versionPrefix2); ok {
			return strings.TrimSpace(v)
		}
		// 遇到非注释非空行说明头部结束
		if line != "" && !strings.HasPrefix(line, "--") {
			break
		}
	}
	return ""
}

func cutVersion(line, prefix string) (string, bool) {
	if strings.HasPrefix(line, prefix) {
		return line[len(prefix):], true
	}
	return "", false
}

// extractNameVersion 从文件名前缀提取版本号 YYYYMMDD_NNN。
// 例如 "20240701_001_add_email.sql" → "20240701_001"。
func extractNameVersion(name string) string {
	base := strings.TrimSuffix(name, ".sql")
	parts := strings.SplitN(base, "_", 3)
	if len(parts) >= 2 && len(parts[0]) == 8 {
		return parts[0] + "_" + parts[1]
	}
	return ""
}

// listSQLFiles 返回目录下所有 .sql 文件名（不含路径），按名称排序。
func listSQLFiles(dir string) []string {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}
	var names []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			names = append(names, e.Name())
		}
	}
	sort.Strings(names)
	return names
}

// ── 迁移执行 ──

// execFile 在事务中执行迁移文件并记录版本号。
func execFile(db *gorm.DB, mf *migFile) error {
	path := filepath.Join("conf", "migrations", mf.name)
	content, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("读取文件: %w", err)
	}

	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(string(content)).Error; err != nil {
			return fmt.Errorf("执行SQL: %w", err)
		}
		if err := tx.Exec(
			`INSERT INTO schema_migrations (version) VALUES (?)`, mf.version,
		).Error; err != nil {
			return fmt.Errorf("记录版本: %w", err)
		}
		return nil
	})
}

// ── schema_migrations 查询 ──

func latestVersion(db *gorm.DB) string {
	var v string
	if err := db.Raw(
		`SELECT COALESCE(MAX(version), '') FROM schema_migrations`,
	).Scan(&v).Error; err != nil {
		return ""
	}
	return v
}

func isApplied(db *gorm.DB, version string) (bool, error) {
	var n int64
	err := db.Raw(
		`SELECT COUNT(1) FROM schema_migrations WHERE version = ?`, version,
	).Scan(&n).Error
	return n > 0, err
}

// ── ensureDB 辅助 ──

// toGormxConfig 将 DataSource 转为 gormx.Config，数据库名替换为管理库名。
// DBName 使用固定值避免与业务连接冲突，用完即 Close。
func toGormxConfig(cfg DataSource) *gormx.Config {
	args := make([]gormx.ARG, len(cfg.Args))
	for i, a := range cfg.Args {
		args[i] = gormx.ARG{Name: a.Name, Value: a.Value}
	}
	return &gormx.Config{
		DBName: "__ensure_db__",
		Connection: gormx.Connection{
			DBType:   gormx.DatabaseType(cfg.DBType),
			Host:     cfg.Host,
			Port:     cfg.Port,
			Username: cfg.Username,
			Password: cfg.Password,
			Database: adminDatabase(cfg.DBType),
			Args:     args,
		},
	}
}

// isAutoCreateSupported 判断数据库类型是否支持自动创建。
func isAutoCreateSupported(dbType string) bool {
	switch dbType {
	case string(gormx.DatabaseTypePostgres),
		string(gormx.DatabaseTypeMySQL),
		string(gormx.DatabaseTypeSqlserver):
		return true
	}
	return false
}

// adminDatabase 返回连接服务器时使用的管理库名。
// PostgreSQL 连 postgres，SQL Server 连 master，MySQL 不指定库。
func adminDatabase(dbType string) string {
	switch dbType {
	case string(gormx.DatabaseTypePostgres):
		return "postgres"
	case string(gormx.DatabaseTypeSqlserver):
		return "master"
	}
	return ""
}

// dbExists 通过 GORM 查询目标数据库是否存在。
func dbExists(db *gorm.DB, dbType, dbName string) bool {
	q := dbExistsQuery(dbType)
	if q == "" {
		return false
	}
	var n int
	if err := db.Raw(q, dbName).Scan(&n).Error; err != nil {
		return false
	}
	return n > 0
}

func dbExistsQuery(dbType string) string {
	switch dbType {
	case string(gormx.DatabaseTypePostgres):
		return `SELECT 1 FROM pg_database WHERE datname = ?`
	case string(gormx.DatabaseTypeMySQL):
		return `SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`
	case string(gormx.DatabaseTypeSqlserver):
		return `SELECT 1 FROM sys.databases WHERE name = ?`
	}
	return ""
}

func createDBSQL(dbType, dbName string) string {
	switch dbType {
	case string(gormx.DatabaseTypePostgres):
		return fmt.Sprintf(`CREATE DATABASE "%s"`, dbName)
	case string(gormx.DatabaseTypeMySQL):
		return fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s` DEFAULT CHARACTER SET utf8mb4", dbName)
	case string(gormx.DatabaseTypeSqlserver):
		return fmt.Sprintf("CREATE DATABASE [%s]", dbName)
	}
	return ""
}
