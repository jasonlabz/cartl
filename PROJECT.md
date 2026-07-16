# Cartl / Dagine React Console

Dagine Dashboard 的独立 React 重构项目。原 Vue 工程保持不变，本项目重新实现控制台信息架构、页面和工作流画布。

## 技术栈

- React 19 + TypeScript
- Vite
- React Router
- XYFlow / React Flow
- Recharts
- Lucide Icons

## 开发

```shell
pnpm install
pnpm dev
```

默认地址为 `http://localhost:5173`。

接口默认通过 Vite 将 `/api` 代理到 `http://127.0.0.1:8080`，可通过 `VITE_API_TARGET` 修改后端地址。
