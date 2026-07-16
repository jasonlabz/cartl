import { useCallback, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeProps
} from '@xyflow/react';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Activity,
  Database,
  Bell,
  Library,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Command,
  Copy,
  Download,
  Ellipsis,
  FilePlus2,
  Filter,
  GitBranch,
  LayoutDashboard,
  Maximize2,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelRightClose,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Trash2,
  TicketCheck,
  Upload,
  UserRound,
  WandSparkles,
  Workflow,
  X,
  Zap
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  activityFeed,
  chartData,
  dataSources,
  flatNavigation,
  flows,
  navigationGroups,
  qualityRules,
  titleByPath,
  type DataSourceItem,
  type NavigationItem,
  type QualityRow,
  type StatusTone
} from './data';

type FlowNodeData = {
  label: string;
  operator: string;
  type: 'source' | 'transform' | 'sink';
  status?: string;
  fields?: string;
};

const toneLabels: Record<StatusTone, string> = {
  success: '正常',
  warning: '注意',
  danger: '异常',
  info: '进行中',
  neutral: '草稿'
};

const toneClass = (tone: StatusTone) => `tone-${tone}`;

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><Sparkles size={17} strokeWidth={2.5} /></div>
      <div>
        <div className="brand-name">dagine</div>
        <div className="brand-caption">DATA GOVERNANCE</div>
      </div>
    </div>
  );
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dark, setDark] = useState(false);

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'sidebar-collapsed'} ${dark ? 'theme-dark' : ''}`}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(value => !value)} />
      <div className="app-main">
        <Topbar
          onMenu={() => setSidebarOpen(value => !value)}
          onSearch={() => setSearchOpen(true)}
          dark={dark}
          onDarkMode={() => setDark(value => !value)}
        />
        <main className="page-area"><AppRoutes /></main>
      </div>
      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-top"><Brand /><button className="icon-button sidebar-toggle" onClick={onToggle} title="收起导航"><PanelLeftClose size={17} /></button></div>
      <button className="workspace-switcher">
        <span className="workspace-avatar">D</span>
        <span className="workspace-copy"><strong>数据治理空间</strong><small>生产环境</small></span>
        <ChevronDown size={15} />
      </button>
      <div className="sidebar-scroll">
        {navigationGroups.map(group => (
          <nav className="nav-group" key={group.label}>
            <div className="nav-label">{group.label}</div>
            {group.items.map(item => <NavItem key={item.path} item={item} />)}
          </nav>
        ))}
      </div>
      <div className="sidebar-bottom">
        <button className="sidebar-utility"><CircleHelp size={17} /><span>帮助中心</span><ArrowRight size={14} /></button>
        <button className="sidebar-utility"><Settings2 size={17} /><span>系统设置</span><ArrowRight size={14} /></button>
        <div className="profile-row"><div className="profile-avatar">L</div><div><strong>Lucas</strong><small>平台管理员</small></div><MoreHorizontal size={17} /></div>
      </div>
    </aside>
  );
}

function NavItem({ item }: { item: NavigationItem }) {
  const { pathname } = useLocation();
  const active = pathname === item.path || (item.path !== '/home' && pathname.startsWith(`${item.path}/`));
  const Icon = item.icon;
  return <NavLink className={`nav-item ${active ? 'active' : ''}`} to={item.path}><Icon size={17} /><span>{item.label}</span>{active && <span className="active-dot" />}</NavLink>;
}

function Topbar({ onMenu, onSearch, dark, onDarkMode }: { onMenu: () => void; onSearch: () => void; dark: boolean; onDarkMode: () => void }) {
  const { pathname } = useLocation();
  const current = titleByPath[pathname] || (pathname.includes('/flow-designer/') ? '数据流设计器' : '治理概览');
  return (
    <header className="topbar">
      <div className="topbar-left"><button className="icon-button mobile-menu" onClick={onMenu} title="打开导航"><Menu size={19} /></button><div className="breadcrumb"><span>数据治理空间</span><ChevronRight size={14} /><strong>{current}</strong></div></div>
      <div className="topbar-actions">
        <button className="global-search" onClick={onSearch}><Search size={16} /><span>搜索资产、流程或规则</span><kbd><Command size={12} /> K</kbd></button>
        <button className="icon-button" title="刷新页面" onClick={() => window.location.reload()}><RefreshCw size={17} /></button>
        <button className="icon-button notification-button" title="消息通知"><Bell size={17} /><i /></button>
        <button className="icon-button" title={dark ? '切换明亮模式' : '切换暗色模式'} onClick={onDarkMode}><SunMedium size={17} /></button>
        <div className="topbar-divider" />
        <button className="topbar-user"><span className="profile-avatar small">L</span><span>Lucas</span><ChevronDown size={14} /></button>
      </div>
    </header>
  );
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const results = flatNavigation.filter(item => item.label.includes(query));
  return <div className="overlay" onMouseDown={onClose}><div className="command-palette" onMouseDown={event => event.stopPropagation()}><div className="command-input"><Search size={18} /><input autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索页面和数据资产..." /><kbd>ESC</kbd></div><div className="command-results">{results.map(item => { const Icon = item.icon; return <Link key={item.path} to={item.path} onClick={onClose}><Icon size={17} /><span>{item.label}</span><ArrowRight size={14} /></Link>; })}</div></div></div>;
}

function AppRoutes() {
  const { pathname } = useLocation();
  if (pathname === '/' || pathname === '/home') return <Dashboard />;
  if (pathname === '/workflow/flow-designer' || pathname.startsWith('/workflow/flow-designer/')) return pathname !== '/workflow/flow-designer' ? <FlowDesigner /> : <FlowList />;
  return <ResourcePage path={pathname} />;
}

function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow || 'DAGINE CONSOLE'}</div><h1>{title}</h1>{description && <p>{description}</p>}</div><div className="page-actions">{actions}</div></div>;
}

function Button({ children, variant = 'secondary', icon, onClick, className = '' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'quiet'; icon?: React.ReactNode; onClick?: () => void; className?: string }) {
  return <button className={`button button-${variant} ${className}`} onClick={onClick}>{icon}{children}</button>;
}

function StatusBadge({ tone, label }: { tone: StatusTone; label?: string }) {
  return <span className={`status-badge ${toneClass(tone)}`}><i />{label || toneLabels[tone]}</span>;
}

function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState('近 7 天');
  return <div className="dashboard-page fade-in">
    <PageHeader
      eyebrow="THURSDAY, JULY 17, 2026"
      title="下午好，Lucas"
      description="这是今天的数据治理状态。所有关键链路都在你的掌控之中。"
      actions={<><Button variant="secondary" icon={<Download size={16} />}>导出报告</Button><Button variant="primary" icon={<Plus size={17} />} onClick={() => navigate('/workflow/flow-designer')}>新建数据流</Button></>}
    />
    <div className="dashboard-alert"><div className="alert-icon"><Zap size={16} /></div><div><strong>治理运行状态良好</strong><span>过去 24 小时完成 1,248 次任务，整体成功率 98.7%</span></div><a href="/workflow/tasks">查看运行明细 <ArrowRight size={14} /></a></div>
    <div className="metric-grid">
      <MetricCard label="数据资产" value="2,486" change="+12.4%" detail="较上月" icon={<Database size={19} />} tone="blue" />
      <MetricCard label="运行任务" value="1,248" change="+8.2%" detail="今日累计" icon={<Activity size={19} />} tone="teal" />
      <MetricCard label="质量得分" value="98.7" suffix="%" change="+2.1%" detail="较上周" icon={<ShieldCheck size={19} />} tone="green" />
      <MetricCard label="待处理问题" value="12" change="-18.6%" detail="较上周" icon={<TicketCheck size={19} />} tone="orange" inverse />
    </div>
    <div className="dashboard-grid-main">
      <section className="surface chart-surface"><div className="surface-header"><div><h2>任务执行趋势</h2><p>各数据流近期开启的执行情况</p></div><div className="segmented">{['近 7 天', '近 30 天'].map(item => <button className={range === item ? 'selected' : ''} key={item} onClick={() => setRange(item)}>{item}</button>)}</div></div><div className="chart-legend"><span><i className="legend-dot blue" />成功任务</span><span><i className="legend-dot orange" />失败任务</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 18, right: 10, left: -20, bottom: 0 }}><defs><linearGradient id="successFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4b75ff" stopOpacity={0.2} /><stop offset="100%" stopColor="#4b75ff" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e8edf4" strokeDasharray="3 3" /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#92a0b3', fontSize: 11 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#92a0b3', fontSize: 11 }} /><Tooltip content={<ChartTooltip />} /><Area type="monotone" dataKey="success" stroke="#4b75ff" strokeWidth={2.5} fill="url(#successFill)" /><Area type="monotone" dataKey="failed" stroke="#f0a15a" strokeWidth={2} fill="none" /></AreaChart></ResponsiveContainer></div></section>
      <section className="surface activity-surface"><div className="surface-header"><div><h2>最新动态</h2><p>治理空间的实时活动</p></div><button className="icon-button" title="更多"><Ellipsis size={18} /></button></div><div className="activity-list">{activityFeed.map(item => { const Icon = item.icon; return <div className="activity-item" key={item.title}><div className={`activity-icon ${toneClass(item.tone)}`}><Icon size={16} /></div><div className="activity-copy"><strong>{item.title}</strong><span>{item.detail}</span></div><time>{item.time}</time></div>; })}</div><a className="surface-link" href="/workflow/tasks">查看全部活动 <ArrowRight size={14} /></a></section>
    </div>
    <div className="dashboard-grid-bottom"><section className="surface source-surface"><div className="surface-header"><div><h2>数据源健康度</h2><p>6 个活跃连接 · 最后同步刚刚</p></div><a className="surface-link" href="/workflow/data-source">管理数据源 <ArrowRight size={14} /></a></div><div className="source-table"><div className="table-head"><span>数据源</span><span>类型</span><span>负责人</span><span>状态</span><span>资产数</span></div>{dataSources.slice(0, 4).map(source => <DataSourceRow source={source} key={source.id} />)}</div></section><section className="surface quality-surface"><div className="surface-header"><div><h2>质量概览</h2><p>本周规则执行摘要</p></div><a className="surface-link" href="/quality/reports">详细报告 <ArrowRight size={14} /></a></div><div className="quality-score"><div className="score-ring"><span>98.7<small>%</small></span></div><div><strong>整体质量得分</strong><span className="score-up"><ArrowDownToLine size={14} /> 2.1% 环比提升</span></div></div><div className="quality-bars"><ProgressBar label="完整性" value={99} color="blue" /><ProgressBar label="唯一性" value={98} color="green" /><ProgressBar label="规范性" value={96} color="orange" /></div></section></div>
  </div>;
}

function MetricCard({ label, value, suffix, change, detail, icon, tone, inverse }: { label: string; value: string; suffix?: string; change: string; detail: string; icon: React.ReactNode; tone: string; inverse?: boolean }) {
  return <div className={`metric-card metric-${tone}`}><div className="metric-top"><span>{label}</span><div className="metric-icon">{icon}</div></div><div className="metric-value">{value}<small>{suffix}</small></div><div className={`metric-change ${inverse ? 'change-inverse' : ''}`}><ArrowDownToLine size={14} />{change}<span>{detail}</span></div></div>;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><strong>{label}</strong>{payload.map(item => <span key={item.name}><i style={{ background: item.color }} />{item.name === 'success' ? '成功任务' : '失败任务'} <b>{item.value}</b></span>)}</div>;
}

function DataSourceRow({ source }: { source: DataSourceItem }) {
  return <div className="source-row"><div className="source-name"><span className="source-symbol">{source.type.slice(0, 1)}</span><div><strong>{source.name}</strong><small>{source.host}</small></div></div><span className="type-text">{source.type}</span><span className="owner-text">{source.owner}</span><StatusBadge tone={source.tone} label={source.status} /><strong className="assets-count">{source.assets}</strong></div>;
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="progress-row"><span>{label}</span><div className="progress-track"><i className={`progress-${color}`} style={{ width: `${value}%` }} /></div><strong>{value}%</strong></div>;
}

function FlowList() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const filtered = flows.filter(flow => `${flow.name}${flow.description}`.includes(query));
  return <div className="content-page fade-in"><PageHeader eyebrow="DATA WORKSHOP / FLOW" title="数据流" description="把数据接入、转换和治理规则编排成可观察的执行链路。" actions={<><Button variant="secondary" icon={<Upload size={16} />}>导入流程</Button><Button variant="primary" icon={<Plus size={17} />} onClick={() => navigate('/workflow/flow-designer/101')}>新建数据流</Button></>} /><div className="toolbar"><div className="filter-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索数据流名称或描述" /></div><div className="toolbar-right"><Button variant="quiet" icon={<Filter size={16} />}>筛选</Button><Button variant="quiet" icon={<Download size={16} />}>导出</Button></div></div><section className="surface table-surface"><div className="table-meta"><span>全部数据流 <b>{filtered.length}</b></span><span className="meta-note">最后同步：刚刚</span></div><table className="data-table"><thead><tr><th>数据流</th><th>状态</th><th>节点</th><th>今日运行</th><th>负责人</th><th>最近更新</th><th /></tr></thead><tbody>{filtered.map(flow => <tr key={flow.id}><td><Link className="table-primary" to={`/workflow/flow-designer/${flow.id}`}><span className="row-icon flow"><GitBranch size={16} /></span><span><strong>{flow.name}</strong><small>{flow.description}</small></span></Link></td><td><StatusBadge tone={flow.tone} label={flow.status} /></td><td><span className="number-chip">{flow.nodes} <small>个</small></span></td><td className="muted-cell">{flow.runs}</td><td className="muted-cell">{flow.owner}</td><td className="muted-cell">{flow.updatedAt}</td><td><button className="icon-button" title="更多操作"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></section></div>;
}

function ResourcePage({ path }: { path: string }) {
  const config = resourceConfig(path);
  const [query, setQuery] = useState('');
  const rows = config.kind === 'sources' ? dataSources : config.kind === 'quality' ? qualityRules : buildResourceRows(config.kind);
  const filtered = rows.filter(row => JSON.stringify(row).includes(query));
  return <div className="content-page fade-in"><PageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} actions={<><Button variant="secondary" icon={<Download size={16} />}>导出</Button><Button variant="primary" icon={<Plus size={17} />}>新建{config.title.replace('管理', '')}</Button></>} /><div className="toolbar"><div className="filter-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`搜索${config.title}...`} /></div><div className="toolbar-right"><Button variant="quiet" icon={<Filter size={16} />}>筛选</Button><Button variant="quiet" icon={<RefreshCw size={16} />}>刷新</Button></div></div><section className="surface table-surface"><div className="table-meta"><span>{config.title} <b>{filtered.length}</b></span><span className="meta-note">数据来自治理平台 API · 当前为预览数据</span></div>{config.kind === 'sources' ? <div className="source-table resource-source"><div className="table-head"><span>数据源</span><span>类型</span><span>负责人</span><span>状态</span><span>资产数</span></div>{filtered.map(row => <DataSourceRow source={row as DataSourceItem} key={(row as DataSourceItem).id} />)}</div> : config.kind === 'quality' ? <QualityTable rows={filtered as QualityRow[]} /> : <GenericTable rows={filtered as Array<Record<string, string>>} kind={config.kind} />}</section></div>;
}

function QualityTable({ rows }: { rows: QualityRow[] }) {
  return <table className="data-table"><thead><tr><th>规则名称</th><th>质量维度</th><th>校验对象</th><th>得分</th><th>状态</th><th>最近更新</th><th /></tr></thead><tbody>{rows.map(row => <tr key={row.name}><td><span className="table-primary"><span className="row-icon quality"><ShieldCheck size={16} /></span><span><strong>{row.name}</strong><small>自动校验规则</small></span></span></td><td>{row.dimension}</td><td className="muted-cell">{row.target}</td><td><strong className={row.tone === 'danger' ? 'text-danger' : ''}>{row.score}</strong></td><td><StatusBadge tone={row.tone} label={row.status} /></td><td className="muted-cell">{row.updatedAt}</td><td><button className="icon-button" title="更多操作"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table>;
}

function GenericTable({ rows, kind }: { rows: Array<Record<string, string>>; kind: string }) {
  const headers = kind === 'org' ? ['机构名称', '机构编码', '层级', '负责人', '状态', '最近更新'] : kind === 'metadata' ? ['标准名称', '版本', '表数量', '维护人', '状态', '最近更新'] : kind === 'tasks' ? ['任务名称', '所属数据流', '开始时间', '耗时', '状态', '触发方式'] : ['名称', '类型', '归属团队', '关联资产', '状态', '最近更新'];
  return <table className="data-table"><thead><tr>{headers.map(header => <th key={header}>{header}</th>)}<th /></tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{headers.map((header, cellIndex) => <td key={header} className={cellIndex > 1 ? 'muted-cell' : ''}>{cellIndex === headers.length - 2 ? <StatusBadge tone={row.tone as StatusTone} label={row.status} /> : cellIndex === 0 ? <span className="table-primary"><span className="row-icon generic"><Library size={16} /></span><strong>{row.name}</strong></span> : row[header] || Object.values(row)[cellIndex] || '-'}</td>)}<td><button className="icon-button" title="更多操作"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table>;
}

type ResourceKind = 'sources' | 'quality' | 'org' | 'metadata' | 'tasks' | 'generic';
function resourceConfig(path: string): { title: string; eyebrow: string; description: string; kind: ResourceKind } {
  if (path.includes('data-source')) return { title: '数据源', eyebrow: 'DATA WORKSHOP / SOURCES', description: '管理平台连接、采集能力与数据资产发现。', kind: 'sources' };
  if (path.includes('asset-repo')) return { title: '资产仓库', eyebrow: 'DATA WORKSHOP / ASSETS', description: '统一查看接入的数据资产与目录结构。', kind: 'generic' };
  if (path.includes('operators')) return { title: '算子库', eyebrow: 'DATA WORKSHOP / OPERATORS', description: '管理可复用的数据转换与处理能力。', kind: 'generic' };
  if (path.includes('tasks')) return { title: '运行任务', eyebrow: 'DATA WORKSHOP / RUNS', description: '跟踪数据流执行状态、耗时和运行日志。', kind: 'tasks' };
  if (path.includes('scheduler')) return { title: '调度中心', eyebrow: 'DATA WORKSHOP / SCHEDULER', description: '编排任务触发策略，让数据链路稳定运行。', kind: 'tasks' };
  if (path.includes('quality')) return { title: path.includes('plans') ? '质检方案' : path.includes('reports') ? '质量报告' : path.includes('tickets') ? '问题工单' : '质量规则', eyebrow: 'QUALITY CENTER', description: '建立可衡量、可追踪、可闭环的数据质量体系。', kind: 'quality' };
  if (path.includes('org')) return { title: '组织机构', eyebrow: 'STANDARD MANAGEMENT / ORG', description: '维护治理责任边界与组织层级。', kind: 'org' };
  if (path.includes('metadata')) return { title: '元数据标准', eyebrow: 'STANDARD MANAGEMENT / METADATA', description: '定义统一的数据结构、字段语义与发布版本。', kind: 'metadata' };
  if (path.includes('value-domain')) return { title: '值域标准', eyebrow: 'STANDARD MANAGEMENT / VALUE DOMAIN', description: '沉淀可复用的枚举与业务代码规范。', kind: 'generic' };
  if (path.includes('profiling')) return { title: '数据探查', eyebrow: 'DATA INSIGHT / PROFILING', description: '从数据目录进入字段画像、样本和分布分析。', kind: 'generic' };
  if (path.includes('lineage')) return { title: '数据血缘', eyebrow: 'DATA INSIGHT / LINEAGE', description: '从来源到消费端追踪数据影响范围。', kind: 'generic' };
  return { title: '资产目录', eyebrow: 'DATA INSIGHT / CATALOG', description: '发现、理解和使用治理空间中的数据资产。', kind: 'generic' };
}

function buildResourceRows(kind: ResourceKind): Array<Record<string, string>> {
  if (kind === 'org') return [{ name: '数据平台中心', 机构名称: '数据平台中心', 机构编码: 'DPC-001', 层级: '一级组织', 负责人: 'Lucas', status: '启用', tone: 'success', 最近更新: '今天 09:32' }, { name: '交易数据组', 机构名称: '交易数据组', 机构编码: 'DPC-101', 层级: '二级组织', 负责人: '王悦', status: '启用', tone: 'success', 最近更新: '昨天 16:20' }, { name: '质量治理组', 机构名称: '质量治理组', 机构编码: 'DPC-102', 层级: '二级组织', 负责人: '陈哲', status: '启用', tone: 'success', 最近更新: '07-15' }];
  if (kind === 'metadata') return [{ name: '客户主数据标准', 标准名称: '客户主数据标准', 版本: 'v2.4', 表数量: '24 张', 维护人: '王悦', status: '已发布', tone: 'success', 最近更新: '今天 08:42' }, { name: '订单交易标准', 标准名称: '订单交易标准', 版本: 'v1.8', 表数量: '18 张', 维护人: 'Lucas', status: '已发布', tone: 'success', 最近更新: '昨天 14:18' }, { name: '营销事件模型', 标准名称: '营销事件模型', 版本: 'v0.9', 表数量: '12 张', 维护人: '陈哲', status: '草稿', tone: 'neutral', 最近更新: '07-15' }];
  if (kind === 'tasks') return [{ name: '订单实时入仓 / #1248', 任务名称: '订单实时入仓 / #1248', 所属数据流: '订单实时入仓', 开始时间: '今天 14:32:18', 耗时: '03:42', status: '成功', tone: 'success', 触发方式: '定时' }, { name: '营销行为聚合 / #438', 任务名称: '营销行为聚合 / #438', 所属数据流: '营销行为聚合', 开始时间: '今天 14:28:06', 耗时: '08:17', status: '运行中', tone: 'info', 触发方式: '事件' }, { name: '财务日报同步 / #076', 任务名称: '财务日报同步 / #076', 所属数据流: '财务日报同步', 开始时间: '今天 13:58:42', 耗时: '01:12', status: '失败', tone: 'danger', 触发方式: '定时' }];
  return [{ name: '客户信息清洗', 类型: '转换算子', 归属团队: '数据平台组', 关联资产: '28', status: '已启用', tone: 'success', 最近更新: '今天 10:22' }, { name: '订单金额校验', 类型: '质量算子', 归属团队: '质量治理组', 关联资产: '16', status: '已启用', tone: 'success', 最近更新: '昨天 18:06' }, { name: 'JSON 路由分发', 类型: '路由算子', 归属团队: '实时计算组', 关联资产: '9', status: '草稿', tone: 'neutral', 最近更新: '07-15' }, { name: '敏感字段脱敏', 类型: '安全算子', 归属团队: '基础架构组', 关联资产: '42', status: '已启用', tone: 'success', 最近更新: '07-14' }];
}

const initialFlowNodes: Node<FlowNodeData>[] = [
  { id: 'source-orders', type: 'dataNode', position: { x: 60, y: 180 }, data: { label: '生产订单主库', operator: 'PostgreSQL CDC', type: 'source', status: 'connected', fields: 'order_id, user_id, amount' } },
  { id: 'transform-clean', type: 'dataNode', position: { x: 340, y: 100 }, data: { label: '字段标准化', operator: 'Normalize', type: 'transform', status: 'ready', fields: '12 个字段' } },
  { id: 'transform-quality', type: 'dataNode', position: { x: 340, y: 280 }, data: { label: '质量校验', operator: 'Quality Gate', type: 'transform', status: 'ready', fields: '6 条规则' } },
  { id: 'sink-warehouse', type: 'dataNode', position: { x: 650, y: 100 }, data: { label: '订单明细层', operator: 'ClickHouse', type: 'sink', status: 'ready', fields: 'dwd_order' } },
  { id: 'sink-event', type: 'dataNode', position: { x: 650, y: 300 }, data: { label: '异常事件流', operator: 'Kafka Topic', type: 'sink', status: 'ready', fields: 'quality.alerts' } }
];

const initialFlowEdges: Edge[] = [
  { id: 'edge-source-clean', source: 'source-orders', target: 'transform-clean', animated: true },
  { id: 'edge-source-quality', source: 'source-orders', target: 'transform-quality', animated: true },
  { id: 'edge-clean-warehouse', source: 'transform-clean', target: 'sink-warehouse', animated: true },
  { id: 'edge-quality-event', source: 'transform-quality', target: 'sink-event', animated: true }
];

function DataNode({ data, selected }: NodeProps<Node<FlowNodeData>>) {
  return <div className={`flow-node node-${data.type} ${selected ? 'selected' : ''}`}><Handle type="target" position={Position.Left} className="flow-handle" /><div className="flow-node-top"><div className="node-type-icon">{data.type === 'source' ? <Database size={15} /> : data.type === 'transform' ? <WandSparkles size={15} /> : <ArrowDownToLine size={15} />}</div><span>{data.type === 'source' ? '数据源' : data.type === 'transform' ? '转换节点' : '数据输出'}</span><button className="node-menu" title="节点操作"><MoreHorizontal size={14} /></button></div><strong>{data.label}</strong><span className="node-operator">{data.operator}</span><div className="node-footer"><span className="node-status"><i />{data.status === 'connected' ? '连接正常' : '配置完成'}</span><span>{data.fields}</span></div><Handle type="source" position={Position.Right} className="flow-handle" /></div>;
}

const nodeTypes = { dataNode: DataNode };

function FlowDesigner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowEdges);
  const [selectedNode, setSelectedNode] = useState<Node<FlowNodeData> | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [saved, setSaved] = useState(true);
  const [toast, setToast] = useState('');

  const onConnect = useCallback((connection: Connection) => {
    setEdges(current => addEdge({ ...connection, animated: true }, current));
    setSaved(false);
  }, [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => setSelectedNode(node), []);
  const addNode = (type: FlowNodeData['type'], label: string, operator: string) => {
    const id = `${type}-${Date.now()}`;
    const node: Node<FlowNodeData> = { id, type: 'dataNode', position: { x: 220 + nodes.length * 24, y: 150 + (nodes.length % 3) * 120 }, data: { label, operator, type, status: 'ready', fields: '待配置' } };
    setNodes(current => [...current, node]);
    setSelectedNode(node);
    setSaved(false);
  };
  const updateSelected = (key: keyof FlowNodeData, value: string) => {
    if (!selectedNode) return;
    setNodes(current => current.map(node => node.id === selectedNode.id ? { ...node, data: { ...node.data, [key]: value } } : node));
    setSelectedNode(current => current ? { ...current, data: { ...current.data, [key]: value } } : current);
    setSaved(false);
  };
  const handleSave = () => { setSaved(true); setToast('数据流已保存为草稿'); window.setTimeout(() => setToast(''), 2400); };

  return <ReactFlowProvider><div className="designer-page fade-in"><div className="designer-header"><div className="designer-title"><a className="back-link" href="/workflow/flow-designer"><ArrowLeft size={16} /></a><div><div className="eyebrow">DATA WORKSHOP / FLOW DESIGNER</div><h1>订单实时入仓 <span className="draft-pill"><i />草稿</span></h1></div></div><div className="designer-actions"><span className="saved-state">{saved ? <><Check size={14} />已保存</> : <><Clock3 size={14} />有未保存更改</>}</span><Button variant="quiet" icon={<Copy size={16} />}>复制</Button><Button variant="secondary" icon={<Play size={16} />}>试运行</Button><Button variant="primary" icon={<Check size={16} />} onClick={handleSave}>保存流程</Button><button className="icon-button" title="更多操作"><MoreHorizontal size={18} /></button></div></div><div className="designer-body">{leftOpen && <aside className="designer-panel palette-panel"><div className="panel-heading"><div><strong>节点库</strong><span>拖拽到画布中</span></div><button className="icon-button" title="收起节点库" onClick={() => setLeftOpen(false)}><PanelLeftClose size={16} /></button></div><div className="palette-search"><Search size={15} /><input placeholder="搜索节点" /></div><div className="palette-section"><span className="palette-label">输入</span><PaletteItem icon={<Database size={16} />} color="blue" title="数据源" detail="PostgreSQL、MySQL、Kafka" onClick={() => addNode('source', '新的数据源', 'Select Source')} /></div><div className="palette-section"><span className="palette-label">处理</span><PaletteItem icon={<WandSparkles size={16} />} color="purple" title="字段标准化" detail="清洗与统一字段" onClick={() => addNode('transform', '字段标准化', 'Normalize')} /><PaletteItem icon={<ShieldCheck size={16} />} color="green" title="质量校验" detail="完整性、唯一性校验" onClick={() => addNode('transform', '质量校验', 'Quality Gate')} /><PaletteItem icon={<GitBranch size={16} />} color="orange" title="条件路由" detail="按条件分发数据" onClick={() => addNode('transform', '条件路由', 'Router')} /></div><div className="palette-section"><span className="palette-label">输出</span><PaletteItem icon={<ArrowDownToLine size={16} />} color="teal" title="数据输出" detail="写入表、消息或 API" onClick={() => addNode('sink', '新的数据输出', 'Select Target')} /></div><div className="template-card"><div className="template-icon"><Sparkles size={16} /></div><strong>使用智能模板</strong><span>从常见数据场景快速开始</span><button onClick={() => { setToast('模板库即将打开'); window.setTimeout(() => setToast(''), 2000); }}>浏览模板 <ArrowRight size={14} /></button></div></aside>}{!leftOpen && <button className="panel-reopen left-reopen" title="打开节点库" onClick={() => setLeftOpen(true)}><PanelLeftClose size={16} /></button>}<section className="designer-canvas"><div className="canvas-toolbar"><div className="canvas-breadcrumb"><span>订单实时入仓</span><ChevronRight size={14} /><span>流程画布</span></div><div className="canvas-tools"><span className="zoom-readout">100%</span><button className="icon-button" title="适应画布"><Maximize2 size={16} /></button><button className="icon-button" title="撤销"><ArrowLeft size={16} /></button><button className="icon-button" title="重做"><ArrowRight size={16} /></button></div></div><ReactFlow nodes={nodes} edges={edges} onNodesChange={changes => { onNodesChange(changes); setSaved(false); }} onEdgesChange={changes => { onEdgesChange(changes); setSaved(false); }} onConnect={onConnect} onNodeClick={onNodeClick} nodeTypes={nodeTypes} fitView minZoom={0.45} maxZoom={1.5} defaultEdgeOptions={{ style: { stroke: '#90a0b7', strokeWidth: 2 }, type: 'smoothstep' }}><Background color="#d9e0ea" gap={22} size={1} /><Controls showInteractive={false} position="bottom-right" /><MiniMap pannable zoomable nodeColor={node => node.data?.type === 'source' ? '#4b75ff' : node.data?.type === 'sink' ? '#f0a15a' : '#a27af4'} position="bottom-left" /></ReactFlow><div className="canvas-hint"><span><span className="shortcut-key">⌘</span> 拖拽节点移动</span><span><span className="shortcut-key">⌘</span> + 滚轮缩放</span></div></section>{rightOpen && <aside className="designer-panel property-panel"><div className="panel-heading"><div><strong>{selectedNode ? '节点配置' : '流程概览'}</strong><span>{selectedNode ? '编辑当前节点参数' : '选择节点查看配置'}</span></div><button className="icon-button" title="收起配置面板" onClick={() => setRightOpen(false)}><PanelRightClose size={16} /></button></div>{selectedNode ? <NodeInspector node={selectedNode} onChange={updateSelected} onDelete={() => { setNodes(current => current.filter(node => node.id !== selectedNode.id)); setEdges(current => current.filter(edge => edge.source !== selectedNode.id && edge.target !== selectedNode.id)); setSelectedNode(null); setSaved(false); }} /> : <FlowOverview nodes={nodes} edges={edges} />}</aside>}{!rightOpen && <button className="panel-reopen right-reopen" title="打开配置面板" onClick={() => setRightOpen(true)}><PanelRightClose size={16} /></button>}</div>{toast && <div className="toast"><Check size={16} />{toast}</div>}</div></ReactFlowProvider>;
}

function PaletteItem({ icon, color, title, detail, onClick }: { icon: React.ReactNode; color: string; title: string; detail: string; onClick: () => void }) {
  return <button className="palette-item" onClick={onClick}><span className={`palette-icon ${color}`}>{icon}</span><span><strong>{title}</strong><small>{detail}</small></span><Plus size={15} /></button>;
}

function NodeInspector({ node, onChange, onDelete }: { node: Node<FlowNodeData>; onChange: (key: keyof FlowNodeData, value: string) => void; onDelete: () => void }) {
  return <div className="inspector"><div className="inspector-type"><span className={`palette-icon ${node.data.type === 'source' ? 'blue' : node.data.type === 'sink' ? 'orange' : 'purple'}`}>{node.data.type === 'source' ? <Database size={17} /> : node.data.type === 'sink' ? <ArrowDownToLine size={17} /> : <WandSparkles size={17} />}</span><div><strong>{node.data.label}</strong><span>{node.data.operator}</span></div><StatusBadge tone="success" label="已配置" /></div><div className="form-section"><label>节点名称</label><input value={node.data.label} onChange={event => onChange('label', event.target.value)} /><label>执行算子</label><div className="select-input">{node.data.operator}<ChevronDown size={15} /></div></div><div className="form-section"><div className="form-label-row"><label>配置摘要</label><button className="text-button">打开高级配置</button></div><div className="config-card"><div><span>字段映射</span><strong>{node.data.fields}</strong></div><ChevronRight size={15} /></div><div className="config-card"><div><span>错误策略</span><strong>记录并继续</strong></div><ChevronRight size={15} /></div></div><div className="inspector-footer"><button className="danger-button" onClick={onDelete}><Trash2 size={15} />删除节点</button><span>更新于刚刚</span></div></div>;
}

function FlowOverview({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  return <div className="flow-overview"><div className="overview-intro"><div className="overview-orb"><Workflow size={21} /></div><strong>订单实时入仓</strong><span>将生产订单数据标准化后写入订单明细层。</span></div><div className="overview-stats"><div><strong>{nodes.length}</strong><span>流程节点</span></div><div><strong>{edges.length}</strong><span>数据连线</span></div><div><strong>98.7%</strong><span>近 7 天成功率</span></div></div><div className="overview-section"><span>执行设置</span><div className="overview-row"><span>运行模式</span><strong>实时触发</strong></div><div className="overview-row"><span>失败策略</span><strong>自动重试 3 次</strong></div><div className="overview-row"><span>最近运行</span><strong>2 分钟前</strong></div></div><div className="overview-section"><span>协作成员</span><div className="collab-row"><div className="avatar-stack"><i>L</i><i>W</i><i>C</i></div><span>3 位成员正在协作</span></div></div></div>;
}

export default App;
