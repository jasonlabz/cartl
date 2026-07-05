#!/usr/bin/env pwsh

param()

# 配置
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$SWAG_CMD = if ($env:SWAG_CMD) { $env:SWAG_CMD } else { "swag" }
$SWAG_DIR = if ($env:SWAG_DIR) { $env:SWAG_DIR } else { Join-Path $ProjectRoot "bin" }
$PROJECT_DIR = if ($env:PROJECT_DIR) { $env:PROJECT_DIR } else { $ProjectRoot }

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

# 检查依赖
function Check-Swag {
    # 首先检查是否在PATH中
    if (Get-Command $SWAG_CMD -ErrorAction SilentlyContinue) {
        return $true
    }

    # 检查指定目录下的swag可执行文件
    $swagPath = Join-Path $SWAG_DIR "swag.exe"
    if (Test-Path $swagPath) {
        $script:SWAG_CMD = $swagPath
        return $true
    }

    # 检查Linux/Mac格式的可执行文件（在PowerShell Core跨平台环境中）
    $swagPathUnix = Join-Path $SWAG_DIR "swag"
    if (Test-Path $swagPathUnix) {
        $script:SWAG_CMD = $swagPathUnix
        return $true
    }

    Write-InfoLog "Installing swag..."
    try {
        go install github.com/swaggo/swag/cmd/swag@latest

        # 安装后重新检查
        if (Get-Command $SWAG_CMD -ErrorAction SilentlyContinue) {
            return $true
        }

        # 检查Go的bin目录
        if ($env:GOPATH) {
            $goBinSwag = Join-Path $env:GOPATH "bin" "swag.exe"
            if (Test-Path $goBinSwag) {
                $script:SWAG_CMD = $goBinSwag
                return $true
            }

            $goBinSwagUnix = Join-Path $env:GOPATH "bin" "swag"
            if (Test-Path $goBinSwagUnix) {
                $script:SWAG_CMD = $goBinSwagUnix
                return $true
            }
        }

        return $false
    }
    catch {
        Write-Host "Failed to install swag: $_" -ForegroundColor Red
        return $false
    }
}

# 运行命令
function Run-Swag {
    param([string]$Command)

    Write-InfoLog "Running: swag $Command (in $PROJECT_DIR)"

    try {
        # 分割命令参数
        $arguments = $Command -split ' '
        # swag init/fmt 必须在项目根目录执行
        Push-Location $PROJECT_DIR
        try {
            & $SWAG_CMD @arguments
            $exitCode = $LASTEXITCODE
        }
        finally {
            Pop-Location
        }

        if ($exitCode -ne 0) {
            Write-ErrorLog "swag $Command failed with exit code: $exitCode"
        }
    }
    catch {
        Write-ErrorLog "swag $Command failed: $_"
    }

    Write-InfoLog "swag $Command completed"
}

# 主流程
function Main {
    Write-InfoLog "Starting swag documentation generation..."

    if (-not (Check-Swag)) {
        Write-ErrorLog "swag not found and installation failed"
    }

    Run-Swag "init --parseDependency --parseDepth 2"
    Run-Swag "fmt"

    Write-InfoLog "Documentation generation completed!"
}

# 设置错误处理
$ErrorActionPreference = "Stop"

# 执行主函数
Main