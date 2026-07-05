#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONF_FILE="$PROJECT_ROOT/conf/application.yaml"

GENTOL_CMD="${GENTOL_CMD:-gentol}"

log() { echo "[$(date '+%H:%M:%S')] $1"; }
log_info() { log "INFO: $1"; }
log_error() { log "ERROR: $1"; exit 1; }

# 从 application.yaml 读取 datasource 下的单个字段值
yaml_val() {
    sed -n '/^datasource:/,/^[a-z]/p' "$CONF_FILE" | \
        sed -n "s/^  ${1}: *\"\?\([^\"]*\)\"\?/\1/p" | head -1
}

# 读取嵌套连接块（masters/replicas）中首个 item 的字段值
yaml_sub_val() {
    local section="$1"
    local key="$2"
    sed -n "/^  ${section}:/,/^[a-z]/p" "$CONF_FILE" 2>/dev/null | \
        sed -n "s/^[[:space:]]*-* *${key}: *\"\?\([^\"]*\)\"\?/\1/p" | head -1
}

# 读取连接字段：top-level → masters[0] → replicas[0] 依次回退
yaml_conn_val() {
    local key="$1"
    local val
    val=$(yaml_val "$key")
    [[ -n "$val" ]] && echo "$val" && return
    val=$(yaml_sub_val "masters" "$key")
    [[ -n "$val" ]] && echo "$val" && return
    yaml_sub_val "replicas" "$key"
}

# 读取数据库配置
read_config() {
    if [[ ! -f "$CONF_FILE" ]]; then
        log_error "配置文件不存在: $CONF_FILE"
    fi

    DB_TYPE=$(yaml_val "db_type")
    DB_HOST=$(yaml_conn_val "host")
    DB_PORT=$(yaml_conn_val "port")
    DB_USER=$(yaml_conn_val "username")
    [[ -z "$DB_USER" ]] && DB_USER=$(yaml_conn_val "user")
    DB_PASS=$(yaml_conn_val "password")
    DB_NAME=$(yaml_conn_val "database")

    if [[ -z "$DB_TYPE" || -z "$DB_HOST" || -z "$DB_PORT" || -z "$DB_USER" || -z "$DB_NAME" ]]; then
        log_error "数据库配置不完整，请检查 $CONF_FILE 中 datasource 段"
    fi

    log_info "读取数据库配置: $DB_TYPE://$DB_HOST:$DB_PORT/$DB_NAME"
}

# 检查依赖
check_gentol() {
    if command -v "$GENTOL_CMD" &>/dev/null; then
        return 0
    fi
    log_info "安装 gentol..."
    go install github.com/jasonlabz/gentol@master
}

# 用法
usage() {
    echo "用法: $0 <sql文件路径>"
    echo ""
    echo "从 conf/application.yaml 读取数据库连接信息，执行 DDL 文件（仅允许 CREATE/ALTER/DROP/TRUNCATE/RENAME/COMMENT）"
    echo ""
    echo "示例:"
    echo "  $0 ./migrations/001_init.sql"
    echo "  $0 /path/to/schema.sql"
    exit 1
}

main() {
    if [[ $# -lt 1 ]]; then
        usage
    fi

    local sql_file="$1"

    if [[ ! -f "$sql_file" ]]; then
        log_error "SQL文件不存在: $sql_file"
    fi

    read_config
    check_gentol

    log_info "执行 DDL: $sql_file"
    log_info "目标: $DB_TYPE://$DB_HOST:$DB_PORT/$DB_NAME"

    $GENTOL_CMD ddl "$sql_file" \
        --db_type="$DB_TYPE" \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --password="$DB_PASS" \
        --database="$DB_NAME"

    log_info "DDL 执行完成!"
}

main "$@"
