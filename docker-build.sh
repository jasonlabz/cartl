#!/bin/bash
# Docker 镜像构建脚本
# 用法:
#   ./docker-build.sh              # 默认构建
#   ./docker-build.sh -t v1.0.0    # 指定标签
#   ./docker-build.sh --no-cache   # 不使用缓存
#   ./docker-build.sh --push       # 构建并推送

set -e

# ========== 配置 ==========
IMAGE_NAME="cartl"
IMAGE_TAG=""
REGISTRY=""
PUSH=false
NO_CACHE=""
PLATFORM=""

# ========== 参数解析 ==========
while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--tag)
      IMAGE_TAG="$2"; shift 2 ;;
    -r|--registry)
      REGISTRY="$2"; shift 2 ;;
    -p|--push)
      PUSH=true; shift ;;
    --no-cache)
      NO_CACHE="--no-cache"; shift ;;
    --platform)
      PLATFORM="--platform $2"; shift 2 ;;
    -h|--help)
      echo "用法: $0 [选项]"
      echo ""
      echo "选项:"
      echo "  -t, --tag TAG        镜像标签 (默认: latest)"
      echo "  -r, --registry URL   Docker 镜像仓库地址"
      echo "  -p, --push           构建后推送到仓库"
      echo "  --no-cache           不使用构建缓存"
      echo "  --platform PLATFORM  多平台构建 (如 linux/amd64,linux/arm64)"
      echo "  -h, --help           显示帮助"
      exit 0 ;;
    *)
      echo "未知参数: $1"; exit 1 ;;
  esac
done

# 默认标签
[ -z "$IMAGE_TAG" ] && IMAGE_TAG="latest"

# 拼接完整镜像名
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"
if [ -n "$REGISTRY" ]; then
  FULL_IMAGE="${REGISTRY}/${FULL_IMAGE}"
fi

echo "========================================="
echo " 构建镜像: ${FULL_IMAGE}"
echo "========================================="

# ========== 构建镜像 ==========
BUILD_CMD="docker build ${NO_CACHE} ${PLATFORM} -t ${FULL_IMAGE} -f Dockerfile ."

echo "执行: ${BUILD_CMD}"
echo ""
eval ${BUILD_CMD}

echo ""
echo "构建完成: ${FULL_IMAGE}"

# ========== 推送镜像 ==========
if [ "$PUSH" = true ]; then
  if [ -z "$REGISTRY" ]; then
    echo "错误: 推送镜像需要指定 --registry"
    exit 1
  fi
  echo "推送镜像: ${FULL_IMAGE}"
  docker push "${FULL_IMAGE}"
  echo "推送完成"
fi

echo ""
echo "运行示例:"
echo "  docker run -d -p 8080:8080 ${FULL_IMAGE}"
echo ""
echo "访问地址:"
echo "  Web:    http://localhost:8080/server/"
echo "  Health: http://localhost:8080/health-check"
