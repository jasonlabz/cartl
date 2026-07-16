import { describe, expect, it } from 'vitest';

import { canAccessRoute, filterRouteTreeByRoles } from './route-permission';

describe('route permissions', () => {
  it('allows an unprotected route for every signed-in user', () => {
    expect(canAccessRoute({ path: '/home', title: 'Home' }, ['R_USER'])).toBe(true);
  });

  it('hides a role-protected route from a user without that role', () => {
    expect(canAccessRoute({ path: '/admin', roles: ['R_ADMIN'], title: 'Admin' }, ['R_USER'])).toBe(false);
  });

  it('keeps every route for a static super role', () => {
    expect(canAccessRoute({ path: '/admin', roles: ['R_ADMIN'], title: 'Admin' }, ['R_SUPER'])).toBe(true);
  });

  it('retains a menu group when at least one child is available', () => {
    const routes = [{ children: [{ path: '/open', title: 'Open' }, { path: '/restricted', roles: ['R_ADMIN'], title: 'Restricted' }], path: '/group', title: 'Group' }];

    expect(filterRouteTreeByRoles(routes, ['R_USER'])).toEqual([{ children: [{ path: '/open', title: 'Open' }], path: '/group', title: 'Group' }]);
  });
});
