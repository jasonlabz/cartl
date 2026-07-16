# Dagine Dashboard React Migration Design

## Status

Approved by the user on 2026-07-17. The implementation proceeds without further design confirmations. No commit is authorized by this specification.

## Goal

Rebuild every public and authenticated route in `dagine-dashboard/web` as a React 19 application in `cartl`. The Vue project stays unchanged. The React application preserves route paths, API contracts, permissions, visible interactions, and the source application's visual hierarchy, layout, feedback, and responsive behavior.

## Scope

- System: login variants, register, password reset, 403, 404, 500, iframe page, auth guard, user menu, search, tabs, theme, and layout.
- Standards: organization, value domains and versions, metadata standards and versions, all detail layouts.
- Workflow: data sources, asset repository, operators, flows, flow designer and workbench, tasks, scheduler.
- Quality: rules, plans, reports, tickets.
- Data view: catalog, profiling, lineage, comparison.
- The source API paths, HTTP methods, request fields, response fields, pagination, authorization, token refresh, and error semantics are unchanged.

## Non-Goals

- No changes to `dagine-dashboard/web`, backend services, database schema, or API contracts.
- No Vue or Naive UI compatibility wrapper in the React application.
- No production cutover, commit, or remote push in this task.

## Architecture

The React project uses the structure required by `fullstack-flow:fe-conventions`:

```text
src/
  app/          providers, feedback, error boundary
  components/   shared UI and page primitives
  constant/     source-compatible request and auth constants
  context/      auth, app, theme, route and tab state
  hooks/        request and page-state hooks
  layouts/      BasicLayout, BlankLayout, LoginLayout and subcomponents
  pages/        auth, standards, workflow, quality and data-view pages
  routes/       route metadata, auth guard and router definition
  services/     source-compatible HTTP services by business module
  theme/        Ant Design theme and visual tokens
  types/        shared data, API and route types
  utils/        BaseRequest, response and flow adapters
```

Menu keys, React Router paths, page directories, and service directories share the same business path. Detail and version routes are siblings of their list route and do not create menu entries.

Ant Design is the control baseline; `@xyflow/react`, Recharts, and Lucide are retained. Page and component styles use `antd-style` files colocated with the component; styles do not continue to accumulate in the legacy `src/styles.css` file.

## Routing And Authorization

The router preserves all source URL paths. `RequireAuth` redirects unauthenticated users to `/login` with the original target in `redirect`. Route metadata carries roles, menu visibility, active menu, title, and tab-caching information. Menu and button visibility are derived from the same role metadata. Public login and error routes use `LoginLayout` or `BlankLayout`; all business routes use `BasicLayout`.

## Request And Data Model

`BaseRequest` wraps axios and is the only HTTP client used by pages. Services are grouped under `src/services` and use the `xxxApi` naming convention. The source JSON format is project truth:

- a response has `code`, `data`, optional `pagination`, and `message`;
- code `0` is successful;
- `8888,8889` clear auth and redirect to login;
- `7777,7778` show one logout dialog, then clear auth;
- `9999,9998,3333` share a single refresh request and retry the original request;
- paginated responses normalize to `{ list, total, pagination }` at the request boundary.

Tokens remain stored under the existing Dagine storage prefix. Shared DTOs live in `src/types`; services do not import shared business types from each other.

## Page Patterns

- Table pages use `tableParams`; search, filter, sort, and pagination update that one object and trigger the latest request only.
- Card pages use `listParams`, an independent Ant Design `Pagination`, responsive `Row` / `Col`, and a flex-safe `Spin` container.
- Forms use `Form.useForm()`. Modal forms reset their form and edit state, and use `destroyOnHidden`.
- Detail pages split complex data-type variants into page-local components rather than one monolith.
- Page requests use an abort signal or monotonically increasing request sequence so stale results cannot overwrite current state.

## Workflow Model

The persisted `FlowDocument` and `WorkbenchState` remain independent from React Flow state. A `flow-adapter` converts between API payloads and React Flow nodes and edges. Node insertion, connection, deletion, undo/redo, import/export, schema workbench configuration, revision checks, and save/reset requests use the source payload semantics.

## Visual Fidelity

The Vue implementation is the visual source of truth, including information density, spacing, state colors, menus, cards, tables, drawers, modals, and restrained transitions. The current `cartl` prototype styling is not a visual baseline. The responsive targets are 1440, 1280, 768, and 390 pixels. The application must not produce overlapping text, clipped controls, or inaccessible interactions at those viewports.

## Verification

- Unit: response normalizer, auth refresh/redirect handling, route filtering, pagination updates, flow adapter, workbench payload builder.
- Component: filtering and pagination, form validation and reset, loading/empty/error feedback, modal/drawer lifecycle, essential flow interactions.
- Browser: all routes, login redirect, route parameters, API success/failure paths, form and destructive-action feedback.
- Visual: source Vue on port 9527 and React on port 5173 with equivalent data and permissions. Every route is compared at desktop width; shell/auth pages are compared at every target width; representative table, detail, drawer, workflow, and mobile action flows are compared at the remaining widths.
- Delivery commands: `pnpm typecheck`, tests, `pnpm build`, and browser verification.

## Risks

The largest risk is the flow designer and transform workbench state model. It is isolated behind adapters and receives dedicated data-replay and interaction tests. Authenticated visual comparison requires a shared test account and permissions; public login and errors can be compared without credentials.
