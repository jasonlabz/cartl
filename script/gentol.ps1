#!/usr/bin/env pwsh

param()

# 配置参数
$GENTOL_CMD = if ($env:GENTOL_CMD) { $env:GENTOL_CMD } else { "gentol" }
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ConfFile = Join-Path $ProjectRoot "conf" "application.yaml"

$OUTPUT_DIR = if ($env:OUTPUT_DIR) { $env:OUTPUT_DIR } else { "." }
$TEMPLATE_DIR = if ($env:TEMPLATE_DIR) { $env:TEMPLATE_DIR } else { "./template" }
$DSN = ""
# TODO: 数据库类型  "mysql|postgres|sqlserver|oracle|sqlite|dm"
$DB_TYPE = "postgres"
# TODO: 数据库host
$DB_HOST = "****************"
# TODO: 数据库port
$DB_PORT = "8530"
# TODO: 数据库 用户
$DB_USER = "postgres"
# TODO: 数据库 密码
$DB_PASS = "****************"
# TODO: 数据库 库名
$DB_NAME = "database"
# TODO: 数据库 模式
$DB_SCHEMA = ""
# TODO: 需要生成的表结构，不配置则为全部
$TABLES = if ($env:TABLES) { $env:TABLES } else { "" }

# 生成配置
$MODEL_DIR = if ($env:MODEL_DIR) { $env:MODEL_DIR } else { "dal/db/model" }
$DAO_DIR = if ($env:DAO_DIR) { $env:DAO_DIR } else { "dal/db/dao" }

# 功能开关
$ONLY_MODEL = if ($env:ONLY_MODEL) { [bool]::Parse($env:ONLY_MODEL) } else { $false }
$USE_SQL_NULLABLE = if ($env:USE_SQL_NULLABLE) { [bool]::Parse($env:USE_SQL_NULLABLE) } else { $false }
$RUN_GOFMT = if ($env:RUN_GOFMT) { [bool]::Parse($env:RUN_GOFMT) } else { $true }
$GEN_HOOK = if ($env:GEN_HOOK) { [bool]::Parse($env:GEN_HOOK) } else { $true }
# 从 application.yaml 读取 datasource 下的单个字段值
function Read-YamlValue {
    param([string]$Key)

    if (-not (Test-Path $ConfFile)) {
        return ""
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

# 从 application.yaml 读取数据库配置（优先于脚本内硬编码值）
function Load-YamlConfig {
    if (-not (Test-Path $ConfFile)) {
        return $false
    }

    $yamlDbType = Read-YamlValue "db_type"
    $yamlDbHost = Read-YamlConnValue "host"
    $yamlDbPort = Read-YamlConnValue "port"
    $yamlDbUser = Read-YamlConnValue "username"
    if (-not $yamlDbUser) { $yamlDbUser = Read-YamlConnValue "user" }
    $yamlDbPass = Read-YamlConnValue "password"
    $yamlDbName = Read-YamlConnValue "database"

    if ($yamlDbType) { $script:DB_TYPE = $yamlDbType }
    if ($yamlDbHost) { $script:DB_HOST = $yamlDbHost }
    if ($yamlDbPort) { $script:DB_PORT = $yamlDbPort }
    if ($yamlDbUser) { $script:DB_USER = $yamlDbUser }
    if ($yamlDbPass) { $script:DB_PASS = $yamlDbPass }
    if ($yamlDbName) { $script:DB_NAME = $yamlDbName }

    Write-InfoLog "已从 application.yaml 读取数据库配置"
    return $true
}
# 日志函数
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

# 构建 DSN（如果未直接提供）
function Build-Dsn {
    if ($DSN -ne "") {
        return
    }

    switch ($DB_TYPE) {
        "mysql" {
            $script:DSN = "${DB_USER}:${DB_PASS}@tcp(${DB_HOST}:${DB_PORT})/${DB_NAME}?parseTime=True&loc=Local"
        }
        "postgres" {
            $script:DSN = "user=$DB_USER password=$DB_PASS host=$DB_HOST port=$DB_PORT dbname=$DB_NAME sslmode=disable TimeZone=Asia/Shanghai"
        }
        "sqlserver" {
            $script:DSN = "user id=$DB_USER;password=$DB_PASS;server=$DB_HOST;port=$DB_PORT;database=$DB_NAME;encrypt=disable"
        }
        "oracle" {
            $script:DSN = "${DB_USER}/${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
        }
        "sqlite" {
            $script:DSN = $DB_NAME
        }
        "dm" {
            $script:DSN = "dm://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}?schema=$DB_SCHEMA"
        }
        default {
            Write-ErrorLog "Unsupported database type: $DB_TYPE"
        }
    }
}

# 构建命令参数
function Build-Args {
    $argsList = @(
        "--db_type=$DB_TYPE"
        "--dsn=`"$DSN`""
		"--model=$MODEL_DIR"
		"--dao=$DAO_DIR"
	)

    if ($TABLES -ne "") {
        $argsList += "--table=$TABLES"
    }

    if ($DB_SCHEMA -ne "") {
        $argsList += "--schema=$DB_SCHEMA"
    }

    if ($ONLY_MODEL) {
        $argsList += "--only_model"
    }

    if ($USE_SQL_NULLABLE) {
        $argsList += "--use_sql_nullable"
    }

    if ($RUN_GOFMT) {
        $argsList += "--rungofmt"
    }

    if ($GEN_HOOK) {
        $argsList += "--gen_hook"
    }

    return $argsList
}

# 检查依赖
function Check-Gentol {
    if (Get-Command $GENTOL_CMD -ErrorAction SilentlyContinue) {
        return
    }

    Write-InfoLog "Installing gentol..."
    go install github.com/jasonlabz/gentol@master

    # 重新检查安装是否成功
    if (-not (Get-Command $GENTOL_CMD -ErrorAction SilentlyContinue)) {
        # 尝试在Go的bin目录中查找
        $goBinPath = Join-Path $env:GOPATH "bin" "gentol.exe"
        if (Test-Path $goBinPath) {
            $script:GENTOL_CMD = $goBinPath
        } else {
            # 如果Go在默认位置，尝试使用完整路径
            if ($env:GOPATH) {
                $goBinPath = Join-Path $env:GOPATH "bin" "gentol"
                if (Test-Path $goBinPath) {
                    $script:GENTOL_CMD = $goBinPath
                }
            }
        }
    }
}

# 主流程
function Main {
    Write-InfoLog "Starting code generation with gentol..."

    Check-Gentol
    $yamlLoaded = Load-YamlConfig
    if (-not $yamlLoaded) {
        Write-InfoLog "未找到 application.yaml，使用脚本内配置"
    }
    Build-Dsn

    $args = Build-Args
    $command = "$GENTOL_CMD $args"

    Write-InfoLog "Running: $command (in $ProjectRoot)"

    try {
        # gentol 需要在项目根目录执行（输出路径相对于 CWD）
        Push-Location $ProjectRoot
        try {
            Invoke-Expression $command
            $exitCode = $LASTEXITCODE
        }
        finally {
            Pop-Location
        }
        if ($exitCode -ne 0) {
            Write-ErrorLog "Code generation failed with exit code: $exitCode"
        }
    }
    catch {
        Write-ErrorLog "Code generation failed: $_"
    }

    Write-InfoLog "Code generation completed!"
}

# 设置错误处理
$ErrorActionPreference = "Stop"

# 执行主函数
Main