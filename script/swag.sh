#!/bin/bash

set -euo pipefail

# 配置
SWAG_CMD="${SWAG_CMD:-swag}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SWAG_DIR="${SWAG_DIR:-$PROJECT_ROOT/bin}"
PROJECT_DIR="${PROJECT_DIR:-$PROJECT_ROOT}"

# 日志函数
log() { echo "[$(date '+%H:%M:%S')] $1"; }
log_info() { log "INFO: $1"; }
log_error() { log "ERROR: $1"; exit 1; }

# 检查依赖
check_swag() {
    if command -v "$SWAG_CMD" &>/dev/null; then
        return 0
    fi

    if [[ -f "$SWAG_DIR/swag" ]]; then
        SWAG_CMD="$SWAG_DIR/swag"
        return 0
    fi

    log_info "Installing swag..."
    go install github.com/swaggo/swag/cmd/swag@latest
}

# 运行命令
run_swag() {
    local command="$1"
    log_info "Running: swag $command (in $PROJECT_DIR)"

    # swag init/fmt 必须在项目根目录执行
    (cd "$PROJECT_DIR" && $SWAG_CMD $command) || log_error "swag $command failed"

    log_info "swag $command completed"
}

# 主流程
main() {
    log_info "Starting swag documentation generation..."

    check_swag || log_error "swag not found and installation failed"
    run_swag "init --parseDependency --parseDepth 2"
    run_swag "fmt"

    log_info "Documentation generation completed!"
}

main "$@"
