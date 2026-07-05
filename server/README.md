# server 目录约定

`server` 保持当前轻量分层，不做额外目录搬迁。

## 目录职责

```text
server/
  controller/                 # HTTP Controller，只处理入参、调用 service、返回响应
  routers/                    # 路由分组与中间件装配
  service/
    {module}.go               # Service 接口定义
    {module}/
      {module}_impl.go        # Service 实现
      body/
        request.go            # 请求 DTO
        response.go           # 响应 DTO
```

## 新增模块

以 `user` 模块为例：

```text
server/controller/user.go
server/service/user.go
server/service/user/user_impl.go
server/service/user/body/request.go
server/service/user/body/response.go
```

Controller 不写业务逻辑，Service 不依赖 Gin。路由统一在 `server/routers` 中注册。
