# Dagine React Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `cartl` prototype with a complete React implementation of all Dagine Dashboard routes while preserving the Vue application's contracts and user-visible behavior.

**Architecture:** Build a source-compatible React foundation first: route metadata, providers, request normalization, and layouts. Implement module-aligned services and page families on that foundation, keeping complicated standard and workflow variants in local feature components. Keep API and graph adapters independent from display components so they can be tested without a browser.

**Tech Stack:** React 19, TypeScript strict, Vite, React Router 7, Ant Design 6, antd-style, axios, ahooks, Vitest, React Testing Library, @xyflow/react, Recharts, Lucide.

---

## File structure

| Path | Responsibility |
| --- | --- |
| `src/app/*` | Providers, global feedback and React error boundary |
| `src/constant/*` | Dagine request codes and storage keys |
| `src/context/*` | Auth, application, theme, route and tab state |
| `src/utils/request/*` | Axios `BaseRequest`, response normalization and retry behavior |
| `src/types/*` | Shared source-compatible API and UI data models |
| `src/services/<module>/*` | Module-aligned API service functions ending in `Api` |
| `src/routes/*` | Full source-compatible route metadata, auth guard and router |
| `src/layouts/*` | Basic, blank and login layouts plus navigation components |
| `src/components/*` | Shared page, table, feedback, form and flow primitives |
| `src/pages/<module>/<page>/*` | Route leaf components and their colocated styles/components |
| `src/theme/*` | Ant Design theme, visual tokens and global reset |
| `src/test/*` | Test setup, fixtures and reusable render helpers |

## Task 1: Establish tooling, aliases and test harness

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.app.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/render.tsx`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: Add the test scripts and exact dev dependencies**

Add `test`, `test:watch`, and `test:coverage` scripts to `package.json`. Add exact versions of `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `vitest`, and `@vitest/coverage-v8` that are compatible with the installed Vite 8 version. Do not alter existing dependency versions.

- [ ] **Step 2: Configure Vite, TypeScript and Vitest aliases**

Set `@` to `src`, preserve the existing `/api` proxy, add a `test` section with the jsdom environment and `src/test/setup.ts`, and include the Vitest globals type in `tsconfig.app.json`.

- [ ] **Step 3: Add a failing smoke test**

Create `src/test/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('test harness', () => {
    it('runs in jsdom', () => {
        expect(document.createElement('div')).toBeInstanceOf(HTMLDivElement);
    });
});
```

- [ ] **Step 4: Run the focused test and make the configuration pass**

Run: `pnpm test -- --run src/test/smoke.test.ts`

Expected: one passing test.

## Task 2: Implement source-compatible request, auth and global feedback

**Files:**
- Create: `src/constant/auth.ts`
- Create: `src/types/api.ts`
- Create: `src/utils/storage.ts`
- Create: `src/utils/request/normalize.ts`
- Create: `src/utils/request/index.ts`
- Create: `src/context/auth-context.tsx`
- Create: `src/app/AppProviders.tsx`
- Create: `src/app/ErrorBoundary.tsx`
- Create: `src/services/auth/index.ts`
- Test: `src/utils/request/normalize.test.ts`
- Test: `src/utils/request/index.test.ts`

- [ ] **Step 1: Write failing response-normalization tests**

Cover a normal success payload and a paginated payload:

```ts
expect(normalizeResponse({ code: 0, data: { id: 1 }, message: 'ok' })).toEqual({ id: 1 });
expect(normalizeResponse({ code: 0, data: [{ id: 1 }], pagination: { total: 3 }, message: 'ok' })).toEqual({
    list: [{ id: 1 }],
    total: 3,
    pagination: { total: 3 }
});
```

- [ ] **Step 2: Implement `normalizeResponse` and its source-compatible types**

Create `BaseResponse<T>`, `PaginationData`, and `PaginatedResult<T>` in `src/types/api.ts`. `normalizeResponse` accepts `BaseResponse<T>` and preserves `data` unless `pagination` exists, in which case it returns `{ list, total, pagination }`.

- [ ] **Step 3: Write failing token-refresh tests with axios mocks**

Verify concurrent expired responses invoke refresh once; verify a successful refresh retries the original request with the updated `Authorization` header; verify refresh failure clears storage and invokes the auth-expired callback.

- [ ] **Step 4: Implement `BaseRequest`**

Implement axios interceptors with the exact source codes: success `0`, logout `8888,8889`, modal logout `7777,7778`, expired `9999,9998,3333`. Use one in-flight refresh promise. Implement `get`, `post`, `put`, `patch`, and `delete` methods; inject `Bearer <token>`; delegate success/error feedback through Ant Design `message` and `Modal`.

- [ ] **Step 5: Implement auth provider and source API methods**

Expose `login`, `logout`, `refreshUser`, `token`, `user`, and `isAuthenticated` from `AuthContext`. Implement `loginApi`, `getUserInfoApi`, and `refreshTokenApi` with the original `/auth/*` paths and payloads.

- [ ] **Step 6: Run request tests**

Run: `pnpm test -- --run src/utils/request`

Expected: normalization and refresh tests pass.

## Task 3: Build the route metadata, permission logic, layouts and system pages

**Files:**
- Create: `src/routes/route-meta.ts`
- Create: `src/routes/route-permission.ts`
- Create: `src/routes/index.tsx`
- Create: `src/layouts/BasicLayout/index.tsx`
- Create: `src/layouts/BasicLayout/styles.ts`
- Create: `src/layouts/BlankLayout/index.tsx`
- Create: `src/layouts/LoginLayout/index.tsx`
- Create: `src/layouts/components/SiderMenu.tsx`
- Create: `src/layouts/components/GlobalHeader.tsx`
- Create: `src/layouts/components/GlobalSearch.tsx`
- Create: `src/pages/auth/login/index.tsx`
- Create: `src/pages/system/error/index.tsx`
- Create: `src/pages/system/iframe/index.tsx`
- Test: `src/routes/route-permission.test.ts`
- Test: `src/routes/routes.test.tsx`

- [ ] **Step 1: Write failing route permission tests**

Assert routes with no role are visible, a role-gated route is hidden for nonmembers, and a super role retains every route.

- [ ] **Step 2: Implement route metadata and permission filtering**

Encode every source route path: `/home`; standards, workflow, quality, and data-view leaves; `/login/:module?`; `/403`, `/404`, `/500`; and `/iframe-page/:url`. Include `title`, `roles`, `hideInMenu`, and `activeMenu` metadata.

- [ ] **Step 3: Implement layouts and authenticated routing**

Use `createBrowserRouter`, `Navigate`, and `Outlet`. Redirect unauthenticated private routes to `/login?redirect=<pathname+search>`, redirect an authenticated login request to `/home`, and route unauthorized users to `/403`. Render the role-filtered menu from shared metadata.

- [ ] **Step 4: Implement login module switching and system pages**

Map `pwd-login`, `code-login`, `register`, `reset-pwd`, and `bind-wechat` to React form views under `LoginLayout`. Use Ant Design Form validation and preserve redirect after success. Render 403/404/500 and iframe states under `BlankLayout`.

- [ ] **Step 5: Run route tests**

Run: `pnpm test -- --run src/routes`

Expected: permission and guard behavior passes.

## Task 4: Migrate API types and services by business module

**Files:**
- Create: `src/types/workflow.ts`
- Create: `src/types/standards.ts`
- Create: `src/types/quality.ts`
- Create: `src/types/data-view.ts`
- Create: `src/services/workflow/index.ts`
- Create: `src/services/standards/index.ts`
- Create: `src/services/quality/index.ts`
- Create: `src/services/data-view/index.ts`
- Create: `src/services/index.ts`
- Test: `src/services/services-contract.test.ts`

- [ ] **Step 1: Write service URL and method contract tests**

Inject a mock request instance and verify representative calls: `getDataSourceListApi` sends `GET /api/v1/workflow/data-source`, `createQualityRuleApi` sends `POST /api/v1/quality/rules`, and `executeDataCompareApi` sends `POST /api/v1/data-view/compare`.

- [ ] **Step 2: Transcribe DTOs and API functions from source files**

Use `dagine-dashboard/web/src/typings/api/{workflow,standards,quality,dataview}.d.ts` as API type evidence and `dagine-dashboard/web/src/service/api/*.ts` as path/method evidence. Convert function names to `xxxApi` without changing arguments, response values, URL encoding, multipart setup, or `unwrapData` behavior.

- [ ] **Step 3: Run the service contract tests**

Run: `pnpm test -- --run src/services/services-contract.test.ts`

Expected: contract tests pass and no service imports another service for shared DTOs.

## Task 5: Create shared page primitives and visual token system

**Files:**
- Create: `src/theme/index.tsx`
- Create: `src/theme/tokens.ts`
- Create: `src/components/PageCardLayout/index.tsx`
- Create: `src/components/PageCardLayout/styles.ts`
- Create: `src/components/PageHeader/index.tsx`
- Create: `src/components/AsyncState/index.tsx`
- Create: `src/components/DataTable/index.tsx`
- Create: `src/components/ConfirmAction/index.tsx`
- Create: `src/hooks/useLatestRequest.ts`
- Test: `src/hooks/useLatestRequest.test.ts`
- Test: `src/components/AsyncState/index.test.tsx`

- [ ] **Step 1: Write failing stale-request and state-view tests**

Test that a slower old request cannot replace a newer result, and that `AsyncState` renders loading, error, empty, and content states.

- [ ] **Step 2: Implement `useLatestRequest` and shared state components**

`useLatestRequest` increments a request counter before every invocation and only commits result/loading updates from the latest sequence. `AsyncState` provides Ant Design `Spin`, `Result`, and `Empty`. `DataTable` sets controlled pagination, loading, empty text, and scroll behavior.

- [ ] **Step 3: Add theme tokens and shell responsive styles**

Use `ConfigProvider` and antd-style to centralize source-derived colors, typography, elevation, widths, and breakpoints. Preserve dense desktop layout and make the header, sider, table container, and drawers usable at 768 and 390 pixels.

- [ ] **Step 4: Run shared component tests**

Run: `pnpm test -- --run src/hooks/useLatestRequest.test.ts src/components/AsyncState/index.test.tsx`

Expected: both tests pass.

## Task 6: Implement standards pages and detail layout variants

**Files:**
- Create: `src/pages/standards/org/index.tsx`
- Create: `src/pages/standards/value-domain/index.tsx`
- Create: `src/pages/standards/value-domain/detail/index.tsx`
- Create: `src/pages/standards/value-domain/versions/index.tsx`
- Create: `src/pages/standards/metadata/index.tsx`
- Create: `src/pages/standards/metadata/detail/index.tsx`
- Create: `src/pages/standards/metadata/versions/index.tsx`
- Create: `src/pages/standards/metadata/detail/components/*`
- Test: `src/pages/standards/**/*.test.tsx`

- [ ] **Step 1: Write failing organization CRUD form tests**

Cover opening create/edit, required name validation, reset on close, and a successful save refreshing `tableParams`.

- [ ] **Step 2: Implement organization, value-domain and metadata table/list pages**

Use `tableParams` or `listParams` according to the source page presentation. Preserve source search fields, pagination, action availability, publish/revise flows, import/export behavior, and user feedback.

- [ ] **Step 3: Implement value-domain and metadata details/version routes**

Build detail pages from source API data. Move each of the source metadata type layouts (relational, graph, time-series, unstructured, API, semi-structured, message stream, metric label, vector, key-value, and LLM corpus) into a dedicated React component. Use forms for editable fields and local component state only for UI-only expansion/selection.

- [ ] **Step 4: Run standards focused tests**

Run: `pnpm test -- --run src/pages/standards`

Expected: list state, form reset, and representative detail layouts pass.

## Task 7: Implement quality and data-view pages

**Files:**
- Create: `src/pages/quality/rules/index.tsx`
- Create: `src/pages/quality/plans/index.tsx`
- Create: `src/pages/quality/reports/index.tsx`
- Create: `src/pages/quality/tickets/index.tsx`
- Create: `src/pages/data-view/catalog/index.tsx`
- Create: `src/pages/data-view/profiling/index.tsx`
- Create: `src/pages/data-view/lineage/index.tsx`
- Create: `src/pages/data-view/compare/index.tsx`
- Test: `src/pages/quality/**/*.test.tsx`
- Test: `src/pages/data-view/**/*.test.tsx`

- [ ] **Step 1: Write failing list parameter and drawer tests**

Test quality rule filtering resets page to one, catalog details load only when a row is selected, and tag editing does not update the displayed data until the request succeeds.

- [ ] **Step 2: Implement quality routes**

Use Ant Design Table, Form, Modal, Drawer, Popconfirm, and Pagination to preserve rule test, plan trial/run/publish/revise, report detail, and ticket action behavior.

- [ ] **Step 3: Implement data-view routes**

Implement catalog drawer/details/tags, profiling source and field detail, lineage graph search and node details, and comparison form/results/difference filter. Retain original API request parameters and result labels.

- [ ] **Step 4: Run quality and data-view tests**

Run: `pnpm test -- --run src/pages/quality src/pages/data-view`

Expected: page behavior tests pass.

## Task 8: Implement workflow resource, home, task and scheduler pages

**Files:**
- Create: `src/pages/home/index.tsx`
- Create: `src/pages/workflow/data-source/index.tsx`
- Create: `src/pages/workflow/data-source/detail/index.tsx`
- Create: `src/pages/workflow/asset-repo/index.tsx`
- Create: `src/pages/workflow/asset-repo/detail/index.tsx`
- Create: `src/pages/workflow/operators/index.tsx`
- Create: `src/pages/workflow/tasks/index.tsx`
- Create: `src/pages/workflow/tasks/detail/index.tsx`
- Create: `src/pages/workflow/scheduler/index.tsx`
- Test: `src/pages/workflow/{data-source,asset-repo,operators,tasks,scheduler}/**/*.test.tsx`

- [ ] **Step 1: Write failing data-source form and pagination tests**

Test type selection updates visible config fields, testing a connection preserves form fields, edit loads the source detail before form binding, and save resets `listParams` to refresh results.

- [ ] **Step 2: Implement home and workflow resource pages**

Use `getDashboardStatsApi` and source data to render source-compatible metrics, trend chart, health table, and quality summary. Implement data-source, asset repository, operator, task, task-detail, and scheduler behavior with controlled tables, cards, forms, drawers, and polling only where source behavior requires it.

- [ ] **Step 3: Run workflow page tests**

Run: `pnpm test -- --run src/pages/workflow`

Expected: page tests pass.

## Task 9: Implement flow list, React Flow adapter and Transform Workbench

**Files:**
- Create: `src/pages/workflow/flow-designer/index.tsx`
- Create: `src/pages/workflow/flow-designer/detail/index.tsx`
- Create: `src/pages/workflow/flow-designer/components/*`
- Create: `src/pages/workflow/flow-designer/flow-adapter.ts`
- Create: `src/pages/workflow/flow-designer/workbench-adapter.ts`
- Test: `src/pages/workflow/flow-designer/flow-adapter.test.ts`
- Test: `src/pages/workflow/flow-designer/workbench-adapter.test.ts`
- Test: `src/pages/workflow/flow-designer/detail.test.tsx`

- [ ] **Step 1: Write failing flow adapter tests**

Test a persisted source-transform-sink document converts to React Flow nodes/edges and back without loss of IDs, operator name, parameters, position, or edge handles. Test invalid self-connections and duplicate edges are rejected.

- [ ] **Step 2: Implement flow and workbench adapters**

Keep API document state distinct from React Flow display state. Convert source positions, node types, parameter payloads, connection handles, revision values, and workbench target data in dedicated functions.

- [ ] **Step 3: Implement flow list and designer workspace**

Build flow creation/listing, palette, React Flow canvas, custom nodes, controls, minimap, selected-node property panel, undo/redo, auto-layout, JSON import/export, templates, delete/reset, workbench panels, save, reload, and source-compatible revision feedback.

- [ ] **Step 4: Run flow tests**

Run: `pnpm test -- --run src/pages/workflow/flow-designer`

Expected: adapter and essential designer interactions pass.

## Task 10: Remove prototype boundaries and run full regression

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Delete: `src/data.ts`
- Delete: `src/api.ts`
- Delete: `src/styles.css`
- Create: `docs/vibe-coding/20260717-cartl-home-visual-refresh/实现声明.md`
- Create: `docs/vibe-coding/20260717-cartl-home-visual-refresh/代码评审.md`
- Create: `docs/vibe-coding/20260717-cartl-home-visual-refresh/验证报告.md`

- [ ] **Step 1: Replace prototype entry points**

Render `AppProviders` and `RouterProvider` from `main.tsx` and `App.tsx`. Remove the prototype's hard-coded data and monolithic stylesheet only after all replacement imports compile.

- [ ] **Step 2: Add a full route smoke test**

Render the router with all public route paths and each private route under an authenticated fixture. Assert no route renders 404 accidentally and every expected menu path exists once.

- [ ] **Step 3: Run all automated checks**

Run: `pnpm typecheck && pnpm test -- --run && pnpm build`

Expected: all commands exit successfully.

- [ ] **Step 4: Run browser visual and interaction regression**

Start both applications, compare source and React at 1440, 1280, 768, and 390 per the approved design. Exercise login redirect, menus, representative list/form/drawer flows, source-compatible errors, and the flow designer. Record every command, result, unavailable credential, and remaining visual delta in `验证报告.md`.

- [ ] **Step 5: Perform read-only code review and archive evidence**

Review the actual diff against the approved design and `fe-conventions`, record blocking/non-blocking findings in `代码评审.md`, fix every blocking issue, then record the changed-file list and test evidence in `实现声明.md`.

## Plan self-review

The tasks cover all approved route families, system/auth behavior, request compatibility, role filtering, visual tokens, responsive behavior, API service migration, form/list states, detailed standards variants, workflow canvas/workbench, automated tests, browser checks, review, and archive artifacts. API type names and service suffixes are consistent with the design. No task requires Vue, backend, database, source-contract, commit, or deployment changes.
