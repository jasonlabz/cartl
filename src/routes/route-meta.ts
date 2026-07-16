export interface AppRouteMeta {
  activeMenu?: string;
  group?: 'standards' | 'workflow' | 'quality' | 'data-view';
  hideInMenu?: boolean;
  path: string;
  roles?: string[];
  title: string;
}

export const routeMeta: AppRouteMeta[] = [
  { path: '/home', title: '治理概览' },
  { group: 'standards', path: '/standards/org', title: '组织机构' },
  { group: 'standards', path: '/standards/value-domain', title: '值域标准' },
  {
    activeMenu: '/standards/value-domain',
    group: 'standards',
    hideInMenu: true,
    path: '/standards/value-domain/:domainId',
    title: '值域标准详情'
  },
  {
    activeMenu: '/standards/value-domain',
    group: 'standards',
    hideInMenu: true,
    path: '/standards/value-domain/:domainId/versions',
    title: '值域标准版本'
  },
  { group: 'standards', path: '/standards/metadata', title: '元数据标准' },
  {
    activeMenu: '/standards/metadata',
    group: 'standards',
    hideInMenu: true,
    path: '/standards/metadata/:standardId',
    title: '元数据标准详情'
  },
  {
    activeMenu: '/standards/metadata',
    group: 'standards',
    hideInMenu: true,
    path: '/standards/metadata/:standardId/versions',
    title: '元数据标准版本'
  },
  { group: 'workflow', path: '/workflow/data-source', title: '数据源管理' },
  {
    activeMenu: '/workflow/data-source',
    group: 'workflow',
    hideInMenu: true,
    path: '/workflow/data-source/:id',
    title: '数据源详情'
  },
  { group: 'workflow', path: '/workflow/asset-repo', title: '资产仓库' },
  {
    activeMenu: '/workflow/asset-repo',
    group: 'workflow',
    hideInMenu: true,
    path: '/workflow/asset-repo/:id',
    title: '资产仓库详情'
  },
  { group: 'workflow', path: '/workflow/operators', title: '算子库' },
  { group: 'workflow', path: '/workflow/flow-designer', title: '数据流设计' },
  {
    activeMenu: '/workflow/flow-designer',
    group: 'workflow',
    hideInMenu: true,
    path: '/workflow/flow-designer/:id',
    title: '数据流工作台'
  },
  { group: 'workflow', path: '/workflow/tasks', title: '运行任务' },
  {
    activeMenu: '/workflow/tasks',
    group: 'workflow',
    hideInMenu: true,
    path: '/workflow/tasks/:id',
    title: '任务详情'
  },
  { group: 'workflow', path: '/workflow/scheduler', title: '调度中心' },
  { group: 'quality', path: '/quality/rules', title: '质量规则' },
  { group: 'quality', path: '/quality/plans', title: '质检方案' },
  { group: 'quality', path: '/quality/reports', title: '质量报告' },
  { group: 'quality', path: '/quality/tickets', title: '问题工单' },
  { group: 'data-view', path: '/data-view/catalog', title: '资产目录' },
  { group: 'data-view', path: '/data-view/profiling', title: '数据探查' },
  { group: 'data-view', path: '/data-view/lineage', title: '数据血缘' },
  { group: 'data-view', path: '/data-view/compare', title: '版本对比' }
];

export function filterRoutesByRoles<T extends { roles?: string[] }>(routes: T[], roles: string[]): T[] {
  return routes.filter((route) => !route.roles?.length || route.roles.some((role) => roles.includes(role)));
}
