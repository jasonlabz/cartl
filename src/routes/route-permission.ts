import type { AppRouteMeta } from './route-meta';

const SUPER_ROLE = 'R_SUPER';

export interface RouteTreeNode extends AppRouteMeta {
  children?: RouteTreeNode[];
}

export function canAccessRoute(route: Pick<AppRouteMeta, 'path' | 'roles' | 'title'>, roles: string[]): boolean {
  return !route.roles?.length || roles.includes(SUPER_ROLE) || route.roles.some((role) => roles.includes(role));
}

export const hasRoutePermission = canAccessRoute;

export function filterRouteTreeByRoles(routes: RouteTreeNode[], roles: string[]): RouteTreeNode[] {
  return routes.flatMap((route) => {
    const children = route.children ? filterRouteTreeByRoles(route.children, roles) : undefined;

    if (!canAccessRoute(route, roles) || (route.children && !children?.length)) {
      return [];
    }

    return [{ ...route, ...(children ? { children } : {}) }];
  });
}
