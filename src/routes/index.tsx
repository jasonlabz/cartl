import { Navigate, Outlet, createBrowserRouter, useLocation } from 'react-router-dom';

import App from '@/App';
import { useAuth } from '@/context/auth-context';

import { IframePage, PlaceholderPage, SystemErrorPage } from './route-components';
import { routeMeta } from './route-meta';
import { canAccessRoute } from './route-permission';

function RequireAuth() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/login?redirect=${encodeURIComponent(redirect)}`} />;
  }

  const route = routeMeta.find((item) => item.path === location.pathname);
  if (route && !canAccessRoute(route, user?.roles ?? [])) {
    return <Navigate replace to="/403" />;
  }

  return <Outlet />;
}

const protectedRoutes = routeMeta.map((route) => ({
  element: <PlaceholderPage title={route.title} />,
  path: route.path
}));

export const router = createBrowserRouter([
  { path: '/', element: <Navigate replace to="/home" /> },
  { path: '/login', element: <PlaceholderPage title="登录" /> },
  { path: '/login/:module', element: <PlaceholderPage title="登录" /> },
  { path: '/403', element: <SystemErrorPage status="403" /> },
  { path: '/404', element: <SystemErrorPage status="404" /> },
  { path: '/500', element: <SystemErrorPage status="500" /> },
  { path: '/iframe-page/:url', element: <IframePage /> },
  {
    element: <RequireAuth />,
    children: [{ element: <App />, children: protectedRoutes }]
  },
  { path: '*', element: <Navigate replace to="/404" /> }
]);
