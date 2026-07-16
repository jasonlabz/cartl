import { describe, expect, it } from 'vitest';

import { filterRoutesByRoles, routeMeta } from './route-meta';

describe('route metadata', () => {
  it('contains every source business route exactly once', () => {
    const paths = routeMeta.map((route) => route.path);

    expect(paths).toContain('/home');
    expect(paths).toContain('/standards/metadata/:standardId/versions');
    expect(paths).toContain('/workflow/flow-designer/:id');
    expect(paths).toContain('/data-view/compare');
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('filters role-protected routes while retaining public routes', () => {
    const routes = [
      { path: '/public', title: 'Public' },
      { path: '/restricted', roles: ['R_ADMIN'], title: 'Restricted' }
    ];

    expect(filterRoutesByRoles(routes, ['R_USER'])).toEqual([{ path: '/public', title: 'Public' }]);
    expect(filterRoutesByRoles(routes, ['R_ADMIN'])).toEqual(routes);
  });
});
