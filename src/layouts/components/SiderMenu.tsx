import {
  BarChart3,
  BookOpenCheck,
  Boxes,
  Database,
  FileChartColumn,
  GitBranch,
  Network,
  ScanSearch,
  ShieldCheck,
  TableProperties,
  TicketCheck,
  Workflow
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { filterRoutesByRoles, routeMeta } from '@/routes/route-meta';

const navigation = [
  { icon: BookOpenCheck, path: '/standards/metadata' },
  { icon: Network, path: '/standards/org' },
  { icon: Database, path: '/standards/value-domain' },
  { icon: Database, path: '/workflow/data-source' },
  { icon: Boxes, path: '/workflow/asset-repo' },
  { icon: Workflow, path: '/workflow/flow-designer' },
  { icon: ShieldCheck, path: '/quality/rules' },
  { icon: FileChartColumn, path: '/quality/reports' },
  { icon: TicketCheck, path: '/quality/tickets' },
  { icon: TableProperties, path: '/data-view/catalog' },
  { icon: ScanSearch, path: '/data-view/profiling' },
  { icon: GitBranch, path: '/data-view/lineage' },
  { icon: BarChart3, path: '/data-view/compare' }
];

export function SiderMenu({ roles = [] }: { roles?: string[] }) {
  const visibleRoutes = filterRoutesByRoles(routeMeta, roles).filter((route) => !route.hideInMenu);

  return (
    <nav aria-label="主导航">
      {navigation.map(({ icon: Icon, path }) => {
        const route = visibleRoutes.find((item) => item.path === path);

        if (!route) {
          return null;
        }

        return (
          <NavLink key={path} to={path}>
            <Icon aria-hidden="true" size={16} />
            <span>{route.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
