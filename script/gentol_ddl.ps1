#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$false)]
    [string]$SqlFile
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ConfFile = Join-Path $ProjectRoot "conf" "application.yaml"

$GENTOL_CMD = if ($env:GENTOL_CMD) { $env:GENTOL_CMD } else { "gentol" }

function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message"
}

function Write-InfoLog {
    param([string]$Message)
    Write-Log "INFO: $Message"
}

function Write-ErrorLog {
    param([string]$Message)
    Write-Log "ERROR: $Message"
    exit 1
}

# 从 application.yaml 读取 datasource 下的单个字段值
function Read-YamlValue {
    param([string]$Key)

    if (-not (Test-Path $ConfFile)) {
        Write-ErrorLog "配置文件不存在: $ConfFile"
    }

    $inDatasource = $false
    foreach ($line in Get-Content $ConfFile) {
        if ($line -match '^datasource:') {
            $inDatasource = $true
            continue
        }
        if ($inDatasource -and $line -match '^[a-z]') {
            break
        }
        if ($inDatasource -and $line -match "^\s+${Key}:\s*`"?([^`"]*)`"?") {
            return $Matches[1]
        }
    }
    return ""
}

# 读取嵌套连接块（masters/replicas）中首个 item 的字段值
function Read-YamlSubValue {
    param([string]$Section, [string]$Key)

    if (-not (Test-Path $ConfFile)) { return "" }

    $inSection = $false
    foreach ($line in Get-Content $ConfFile) {
        if ($line -match "^  ${Section}:") {
            $inSection = $true
            continue
        }
        if ($inSection -and $line -match '^[a-z]') {
            break
        }
        if ($inSection -and $line -match "^\s+-*\s*${Key}:\s*`"?([^`"]*)`"?") {
            return $Matches[1]
        }
    }
    return ""
}

# 读取连接字段：top-level → masters[0] → replicas[0] 依次回退
function Read-YamlConnValue {
    param([string]$Key)

    $val = Read-YamlValue $Key
    if ($val) { return $val }
    $val = Read-YamlSubValue "masters" $Key
    if ($val) { return $val }
    return Read-YamlSubValue "replicas" $Key
}

# 读取数据库配置
function Read-Config {
    $script:DB_TYPE = Read-YamlValue "db_type"
    $script:DB_HOST = Read-YamlConnValue "host"
    $script:DB_PORT = Read-YamlConnValue "port"
    $script:DB_USER = Read-YamlConnValue "username"
    if (-not $script:DB_USER) { $script:DB_USER = Read-YamlConnValue "user" }
    $script:DB_PASS = Read-YamlConnValue "password"
    $script:DB_NAME = Read-YamlConnValue "database"

    if (-not $DB_TYPE -or -not $DB_HOST -or -not $DB_PORT -or -not $DB_USER -or -not $DB_NAME) {
        Write-ErrorLog "数据库配置不完整，请检查 $ConfFile 中 datasource 段"
    }

    Write-InfoLog "读取数据库配置: ${DB_TYPE}://${DB_HOST}:${DB_PORT}/${DB_NAME}"
}

# 检查依赖
function Check-Gentol {
    if (Get-Command $GENTOL_CMD -ErrorAction SilentlyContinue) {
        return
    }

    Write-InfoLog "安装 gentol..."
    go install github.com/jasonlabz/gentol@master

    if (-not (Get-Command $GENTOL_CMD -ErrorAction SilentlyContinue)) {
        $goBin = Join-Path $env:GOPATH "bin" "gentol.exe"
        if (Test-Path $goBin) {
            $script:GENTOL_CMD = $goBin
        } else {
            Write-ErrorLog "未找到 gentol，请确认已安装 Go 并设置了 GOPATH"
        }
    }
}

# 主流程
function Main {
    if (-not $SqlFile) {
        Write-Host "用法: $($MyInvocation.MyCommand.Name) <sql文件路径>"
        Write-Host ""
        Write-Host "从 conf/application.yaml 读取数据库连接信息，执行 DDL 文件（仅允许 CREATE/ALTER/DROP/TRUNCATE/RENAME/COMMENT）"
        Write-Host ""
        Write-Host "示例:"
        Write-Host "  $($MyInvocation.MyCommand.Name) ./migrations/001_init.sql"
        Write-Host "  $($MyInvocation.MyCommand.Name) /path/to/schema.sql"
        exit 1
    }

    $sqlFile = $SqlFile

    if (-not (Test-Path $sqlFile)) {
        Write-ErrorLog "SQL文件不存在: $sqlFile"
    }

    Read-Config
    Check-Gentol

    Write-InfoLog "执行 DDL: $sqlFile"
    Write-InfoLog "目标: ${DB_TYPE}://${DB_HOST}:${DB_PORT}/${DB_NAME}"

    $args = @(
        "ddl", $sqlFile,
        "--db_type=$DB_TYPE",
        "--host=$DB_HOST",
        "--port=$DB_PORT",
        "--username=$DB_USER",
        "--password=$DB_PASS",
        "--database=$DB_NAME"
    )

    & $GENTOL_CMD $args
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorLog "DDL 执行失败，退出码: $LASTEXITCODE"
    }

    Write-InfoLog "DDL 执行完成!"
}

Main
