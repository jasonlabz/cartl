# ============================
# Stage 1: 构建前端
# ============================
#FROM iregistry.harbor.local/library/node:20-alpine3.22 AS frontend-builder
FROM node:20-alpine3.22 AS frontend-builder

WORKDIR /app/web
COPY web/package.json web/pnpm-lock.yaml* ./
RUN npm install -g pnpm@latest && pnpm install --frozen-lockfile || pnpm install
COPY web/ .
RUN pnpm build

# ============================
# Stage 2: 构建后端
# ============================
#FROM iregistry.harbor.local/library/golang:1.26-alpine3.23 AS backend-builder
FROM golang:1.26-alpine3.23 AS backend-builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .

RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o bin/cartl .

# ============================
# Stage 3: 运行镜像
# ============================
#FROM iregistry.harbor.local/library/debian:bullseye-slim
FROM debian:bullseye-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates tzdata && \
    ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 后端二进制
COPY --from=backend-builder /app/bin/cartl ./bin/

# 前端静态文件（从 Stage 1 构建产物复制到 webroot 目录，由 Go 路由 /server/ 提供）
COPY --from=frontend-builder /app/web/dist ./webroot/

# 配置文件
COPY --from=backend-builder /app/conf ./conf/

# 可选目录（如存在则拷入，需取消注释）
# COPY --from=backend-builder /app/data ./data/
# COPY --from=backend-builder /app/script ./script/
# COPY --from=backend-builder /app/docs ./docs/

# Go API 服务端口
EXPOSE 8080
# 前端静态文件服务端口（通过 application.server.static 配置）
EXPOSE 8081

# 环境变量说明:
#   DAGINE_DB_HOST          数据库主机 (默认取配置文件)
#   DAGINE_DB_PORT          数据库端口
#   DAGINE_DB_USERNAME      数据库用户名
#   DAGINE_DB_PASSWORD      数据库密码
#   DAGINE_DB_DATABASE      数据库名
#   DAGINE_DB_TYPE          数据库类型 (postgres)
#   DAGINE_DB_DSN           完整 DSN (优先于上述单独字段)
#   DAGINE_JWT_SECRET       JWT 签名密钥
#   DAGINE_HTTP_PORT        HTTP 监听端口
#   DAGINE_STATIC_PATH      前端静态文件目录 (默认 application)
#   DAGINE_STATIC_PORT      静态文件服务端口 (默认 8081)
#
# 前端通过以下两种方式之一提供:
#   方式1: Go 路由 /server/ 自动提供 webroot/ 目录下的静态文件（默认可用）
#   方式2: 在 application.yaml 中配置 application.server.static.path 和 port，
#          启动独立的静态文件服务

ENTRYPOINT ["./bin/cartl"]
