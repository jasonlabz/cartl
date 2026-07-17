import { Bell, ChevronRight, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Search, Sparkles, SunMedium, UserRound } from 'lucide-react';
import { Button, Dropdown, Input, Layout, Menu, theme } from 'antd';
import type { MenuProps } from 'antd';
import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/auth-context';
import { routeMeta } from '@/routes/route-meta';
import { canAccessRoute } from '@/routes/route-permission';

import { useStyles } from './styles';

const { Content, Header, Sider } = Layout;

const groupLabels = {
  'data-view': '数据洞察',
  quality: '质量中心',
  standards: '标准管理',
  workflow: '数据工坊'
} as const;

export function BasicLayout() {
  const { token } = theme.useToken();
  const { cx, styles } = useStyles();
  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  const menuItems = useMemo<MenuProps['items']>(() => {
    const visible = routeMeta.filter((route) => route.group && !route.hideInMenu && canAccessRoute(route, user?.roles ?? []));

    return [
      { icon: <LayoutDashboard size={16} />, key: '/home', label: '治理概览' },
      ...(Object.keys(groupLabels) as Array<keyof typeof groupLabels>).map((group) => ({
        children: visible
          .filter((route) => route.group === group)
          .map((route) => ({ key: route.path, label: route.title })),
        key: group,
        label: groupLabels[group],
        type: 'group' as const
      }))
    ];
  }, [user?.roles]);

  const selectedKey = routeMeta.find((route) => {
    const pattern = `^${route.path.replace(/:[^/]+/g, '[^/]+')}$`;
    return new RegExp(pattern).test(location.pathname);
  })?.activeMenu ?? location.pathname;
  const currentTitle = routeMeta.find((route) => route.path === selectedKey)?.title ?? '治理概览';

  return (
    <Layout className={cx('basic-layout', styles.layout)}>
      <Sider breakpoint="lg" className="basic-layout-sider" collapsed={collapsed} collapsedWidth={64} theme="light" width={236}>
        <div className="basic-layout-logo">
          <span className="basic-layout-logo-mark"><Sparkles size={18} /></span>
          {!collapsed ? (
            <span className="basic-layout-logo-copy">
              <span className="basic-layout-logo-name">dagine</span>
              <span className="basic-layout-logo-caption">DATA GOVERNANCE</span>
            </span>
          ) : null}
        </div>
        <Menu
          className="basic-layout-menu"
          items={menuItems}
          mode="inline"
          onClick={({ key }) => navigate(key)}
          selectedKeys={[selectedKey]}
          style={{ background: token.colorBgContainer }}
        />
      </Sider>
      <Layout>
        <Header className="basic-layout-header">
          <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
            <Button aria-label={collapsed ? '展开导航' : '收起导航'} icon={collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />} type="text" onClick={() => setCollapsed((value) => !value)} />
            <span className="basic-layout-breadcrumb">数据治理空间 <ChevronRight size={13} style={{ margin: '0 7px -2px' }} /> <strong>{currentTitle}</strong></span>
          </div>
          <div className="basic-layout-header-actions">
            <Input
              className="basic-layout-search"
              prefix={<Search size={15} />}
              placeholder="搜索资产、流程或规则"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onPressEnter={() => {
                const matching = routeMeta.find((route) => route.title.includes(search.trim()) && !route.hideInMenu);
                if (matching) navigate(matching.path);
              }}
              style={{ width: 240 }}
            />
            <Button aria-label="消息通知" icon={<Bell size={17} />} type="text" />
            <Button aria-label="主题设置" icon={<SunMedium size={17} />} type="text" />
            <Dropdown menu={{ items: [{ key: 'logout', label: '退出登录', onClick: logout }] }} trigger={['click']}>
              <Button icon={<UserRound size={17} />} type="text">{user?.userName || '当前用户'}</Button>
            </Dropdown>
          </div>
        </Header>
        <Content className="basic-layout-content"><Outlet /></Content>
      </Layout>
    </Layout>
  );
}
