import { Alert, Spin } from 'antd';
import { createBrowserRouter, matchPath, Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/context/auth-context';
import { BasicLayout } from '@/layouts/BasicLayout';
import { BlankLayout } from '@/layouts/BlankLayout';
import { LoginLayout } from '@/layouts/LoginLayout';
import { LoginPage } from '@/pages/auth/login';
import { DataCatalogPage } from '@/pages/data-view/catalog';
import { DataComparePage } from '@/pages/data-view/compare';
import { DataLineagePage } from '@/pages/data-view/lineage';
import { DataProfilingPage } from '@/pages/data-view/profiling';
import { HomePage } from '@/pages/home';
import { QualityPlansPage } from '@/pages/quality/plans';
import { QualityReportsPage } from '@/pages/quality/reports';
import { QualityRulesPage } from '@/pages/quality/rules';
import { QualityTicketsPage } from '@/pages/quality/tickets';
import { ConsolePage } from '@/pages/shared/page';
import { MetadataDetailPage } from '@/pages/standards/metadata/detail';
import { MetadataPage } from '@/pages/standards/metadata';
import { MetadataVersionsPage } from '@/pages/standards/metadata/versions';
import { OrganizationPage } from '@/pages/standards/org';
import { ValueDomainDetailPage } from '@/pages/standards/value-domain/detail';
import { ValueDomainPage } from '@/pages/standards/value-domain';
import { ValueDomainVersionsPage } from '@/pages/standards/value-domain/versions';
import { IframePage } from '@/pages/system/iframe';
import { SystemErrorPage } from '@/pages/system/error';
import { WorkflowTaskDetailPage } from '@/pages/workflow/tasks/detail';
import { WorkflowTasksPage } from '@/pages/workflow/tasks';
import { WorkflowAssetRepoDetailPage, WorkflowAssetRepoPage, WorkflowDataSourceDetailPage, WorkflowDataSourcePage } from '@/pages/workflow/resource-page';

import { routeMeta } from './route-meta';
import { canAccessRoute } from './route-permission';

function RequireAuth() {
  const { initialized, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!initialized) {
    return <Spin fullscreen size="large" />;
  }

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/login?redirect=${encodeURIComponent(redirect)}`} />;
  }

  const route = routeMeta.find((item) => matchPath({ end: true, path: item.path }, location.pathname));
  if (route && !canAccessRoute(route, user?.roles ?? [])) {
    return <Navigate replace to="/403" />;
  }

  return <Outlet />;
}

function WorkflowPendingPage() {
  const location = useLocation();

  return (
    <ConsolePage description="该路由已保留在导航与认证体系中，正在按原 Vue 页面迁移。" title="工作流模块">
      <Alert
        description={`该工作流页面尚未接入 React 实现：${location.pathname}`}
        message="工作流模块迁移中"
        showIcon
        type="info"
      />
    </ConsolePage>
  );
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate replace to="/home" /> },
  {
    element: <LoginLayout />,
    children: [{ path: '/login/:module?', element: <LoginPage /> }]
  },
  {
    element: <BlankLayout />,
    children: [
      { path: '/403', element: <SystemErrorPage status="403" /> },
      { path: '/404', element: <SystemErrorPage status="404" /> },
      { path: '/500', element: <SystemErrorPage status="500" /> }
    ]
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <BasicLayout />,
        children: [
          { path: '/home', element: <HomePage /> },
          { path: '/standards/org', element: <OrganizationPage /> },
          { path: '/standards/value-domain', element: <ValueDomainPage /> },
          { path: '/standards/value-domain/:domainId', element: <ValueDomainDetailPage /> },
          { path: '/standards/value-domain/:domainId/versions', element: <ValueDomainVersionsPage /> },
          { path: '/standards/metadata', element: <MetadataPage /> },
          { path: '/standards/metadata/:standardId', element: <MetadataDetailPage /> },
          { path: '/standards/metadata/:standardId/versions', element: <MetadataVersionsPage /> },
          { path: '/quality/rules', element: <QualityRulesPage /> },
          { path: '/quality/plans', element: <QualityPlansPage /> },
          { path: '/quality/reports', element: <QualityReportsPage /> },
          { path: '/quality/tickets', element: <QualityTicketsPage /> },
          { path: '/data-view/catalog', element: <DataCatalogPage /> },
          { path: '/data-view/profiling', element: <DataProfilingPage /> },
          { path: '/data-view/lineage', element: <DataLineagePage /> },
          { path: '/data-view/compare', element: <DataComparePage /> },
          { path: '/iframe-page/:url', element: <IframePage /> },
          { path: '/workflow/data-source', element: <WorkflowDataSourcePage /> },
          { path: '/workflow/data-source/:id', element: <WorkflowDataSourceDetailPage /> },
          { path: '/workflow/asset-repo', element: <WorkflowAssetRepoPage /> },
          { path: '/workflow/asset-repo/:id', element: <WorkflowAssetRepoDetailPage /> },
          { path: '/workflow/tasks', element: <WorkflowTasksPage /> },
          { path: '/workflow/tasks/:id', element: <WorkflowTaskDetailPage /> },
          { path: '/workflow/*', element: <WorkflowPendingPage /> }
        ]
      }
    ]
  },
  { path: '*', element: <Navigate replace to="/404" /> }
]);
