@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

REM ==========================================
REM  Docker 镜像构建脚本 (Windows)
REM  用法:
REM    docker-build.bat                    默认构建
REM    docker-build.bat -t v1.0.0          指定标签
REM    docker-build.bat --no-cache         不使用缓存
REM    docker-build.bat --push             构建并推送
REM ==========================================

set IMAGE_NAME=cartl
set IMAGE_TAG=latest
set REGISTRY=
set PUSH=false
set NO_CACHE=
set PLATFORM=

:parse_args
if "%~1"=="" goto end_parse
if /i "%~1"=="-t" (
    set IMAGE_TAG=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="--tag" (
    set IMAGE_TAG=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-r" (
    set REGISTRY=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="--registry" (
    set REGISTRY=%~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-p" (
    set PUSH=true
    shift
    goto parse_args
)
if /i "%~1"=="--push" (
    set PUSH=true
    shift
    goto parse_args
)
if /i "%~1"=="--no-cache" (
    set NO_CACHE=--no-cache
    shift
    goto parse_args
)
if /i "%~1"=="--platform" (
    set PLATFORM=--platform %~2
    shift
    shift
    goto parse_args
)
if /i "%~1"=="-h" goto show_help
if /i "%~1"=="--help" goto show_help
echo 未知参数: %~1
exit /b 1

:show_help
echo 用法: %~nx0 [选项]
echo.
echo 选项:
echo   -t, --tag TAG        镜像标签 (默认: latest)
echo   -r, --registry URL   Docker 镜像仓库地址
echo   -p, --push           构建后推送到仓库
echo   --no-cache           不使用构建缓存
echo   --platform PLATFORM  多平台构建 (如 linux/amd64,linux/arm64)
echo   -h, --help           显示帮助
exit /b 0

:end_parse

REM 拼接完整镜像名
set FULL_IMAGE=%IMAGE_NAME%:%IMAGE_TAG%
if not "%REGISTRY%"=="" (
    set FULL_IMAGE=%REGISTRY%/%FULL_IMAGE%
)

echo =========================================
echo  构建镜像: %FULL_IMAGE%
echo =========================================

REM 构建镜像
docker build %NO_CACHE% %PLATFORM% -t %FULL_IMAGE% -f Dockerfile .
if errorlevel 1 (
    echo 构建失败！
    exit /b 1
)

echo.
echo 构建完成: %FULL_IMAGE%

REM 推送镜像
if /i "%PUSH%"=="true" (
    if "%REGISTRY%"=="" (
        echo 错误: 推送镜像需要指定 --registry
        exit /b 1
    )
    echo 推送镜像: %FULL_IMAGE%
    docker push %FULL_IMAGE%
    if errorlevel 1 (
        echo 推送失败！
        exit /b 1
    )
    echo 推送完成
)

echo.
echo 运行示例:
echo   docker run -d -p 8080:8080 %FULL_IMAGE%
echo.
echo 访问地址:
echo   Web:    http://localhost:8080/server/
echo   Health: http://localhost:8080/health-check

endlocal
