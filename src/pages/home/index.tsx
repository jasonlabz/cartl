import {
  Activity,
  AlertCircle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Database,
  FileChartColumn,
  GitBranch,
  HardDrive,
  PlayCircle,
  Server,
  ShieldCheck,
  TableProperties,
  Workflow
} from 'lucide-react';
import { Button, Card, Empty, Segmented, Space, Spin, Tag } from 'antd';
import type { LucideIcon } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useLatestRequest } from '@/hooks/useLatestRequest';
import { getDashboardStatsApi } from '@/services/workflow';
import type { DashboardStats } from '@/types/workflow';

import { useStyles } from './styles';

type HealthStatus = 'error' | 'normal' | 'unknown';

const healthSources: Array<{ icon: LucideIcon; id: number; name: string; status: HealthStatus; type: string }> = [
  { icon: Database, id: 1, name: 'MySQL 主库', status: 'normal', type: 'MySQL' },
  { icon: Server, id: 2, name: 'PostgreSQL', status: 'normal', type: 'PG' },
  { icon: HardDrive, id: 3, name: 'Oracle 数仓', status: 'error', type: 'Oracle' },
  { icon: Database, id: 4, name: 'Hive 集群', status: 'unknown', type: 'Hive' },
  { icon: Activity, id: 5, name: 'Kafka 消息', status: 'normal', type: 'Kafka' },
  { icon: HardDrive, id: 6, name: 'Redis 缓存', status: 'normal', type: 'Redis' },
  { icon: Cloud, id: 7, name: 'MinIO 存储', status: 'normal', type: 'S3' },
  { icon: GitBranch, id: 8, name: 'HTTP 接口', status: 'unknown', type: 'HTTP' },
  { icon: Database, id: 9, name: 'MongoDB', status: 'normal', type: 'Mongo' },
  { icon: TableProperties, id: 10, name: 'ClickHouse', status: 'normal', type: 'CH' },
  { icon: BarChart3, id: 11, name: 'Elasticsearch', status: 'error', type: 'ES' },
  { icon: Database, id: 12, name: 'GreenPlum', status: 'normal', type: 'GP' }
];

const trendData = Array.from({ length: 30 }, (_, index) => ({
  date: `${String(Math.floor(index / 3) + 1).padStart(2, '0')}-${String((index % 3) * 3 + 1).padStart(2, '0')}`,
  failed: [4, 2, 3, 5, 2, 3, 1][index % 7],
  running: [5, 4, 7, 4, 6, 3, 5][index % 7],
  success: 45 + ((index * 17) % 54)
}));

const growthData = Array.from({ length: 12 }, (_, index) => ({ month: `${index + 1}月`, value: 0.6 + index * 0.055 + (index % 3) * 0.025 }));

const recentTasks = [
  { id: 1, name: '客户数据同步', status: 'success', time: '2 分钟前' },
  { id: 2, name: '订单清洗任务', status: 'success', time: '8 分钟前' },
  { id: 3, name: '日志归档任务', status: 'running', time: '12 分钟前' },
  { id: 4, name: '产品快照生成', status: 'failed', time: '15 分钟前' },
  { id: 5, name: '报表数据导出', status: 'success', time: '1 小时前' }
] as const;

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function taskStatusLabel(status: (typeof recentTasks)[number]['status']) {
  return status === 'success' ? '成功' : status === 'running' ? '运行中' : '失败';
}

export function HomePage() {
  const { cx, styles } = useStyles();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const [trendDays, setTrendDays] = useState<7 | 30>(30);
  const [healthFilter, setHealthFilter] = useState<'all' | HealthStatus>('all');
  const [healthExpanded, setHealthExpanded] = useState(false);
  const { data: stats, error, loading, run } = useLatestRequest<DashboardStats>();

  const loadStats = useCallback(() => run(getDashboardStatsApi), [run]);

  useEffect(() => {
    void loadStats();
    const timer = window.setInterval(() => void loadStats(), 60_000);
    const clockTimer = window.setInterval(() => setNow(new Date()), 60_000);
    const handleShortcut = (event: KeyboardEvent) => {
      const tagName = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea') return;
      const shortcut = event.key.toUpperCase();
      const route = shortcut === 'N' ? '/workflow/flow-designer' : shortcut === 'R' ? '/workflow/data-source' : shortcut === 'Q' ? '/quality/plans' : shortcut === 'V' ? '/quality/reports' : null;
      if (route) navigate(route);
    };

    window.addEventListener('keydown', handleShortcut);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(clockTimer);
      window.removeEventListener('keydown', handleShortcut);
    };
  }, [loadStats, navigate]);

  const taskStats = stats?.task_stats ?? { created: 0, failed: 0, finished: 0, running: 0 };
  const jobStats = stats?.job_stats ?? { created: 0, failed: 0, finished: 0, running: 0 };
  const scheduler = stats?.scheduler;
  const totalJobs = jobStats.created + jobStats.running + jobStats.finished + jobStats.failed;
  const pendingCount = taskStats.failed + 2 + 4 + 7;
  const healthCounts = useMemo(() => healthSources.reduce<Record<HealthStatus, number>>((counts, source) => ({ ...counts, [source.status]: counts[source.status] + 1 }), { error: 0, normal: 0, unknown: 0 }), []);
  const matchingSources = healthSources.filter((source) => healthFilter === 'all' || source.status === healthFilter);
  const visibleSources = healthExpanded ? matchingSources : matchingSources.slice(0, 8);
  const trendRows = trendDays === 7 ? trendData.slice(-7) : trendData;
  const statCards: Array<{ color: string; icon: LucideIcon; label: string; path: string; subLabel: string; subTone: 'default' | 'error' | 'success' | 'processing'; value: number }> = [
    { color: '#4b75ff', icon: Database, label: '数据源', path: '/workflow/data-source', subLabel: '2 异常', subTone: 'error', value: healthSources.length },
    { color: '#8b6ccf', icon: Workflow, label: '数据流', path: '/workflow/flow-designer', subLabel: `${jobStats.running} 运行中`, subTone: 'processing', value: totalJobs },
    { color: '#2aa876', icon: CheckCircle2, label: '成功任务', path: '/workflow/tasks', subLabel: '近 30 天', subTone: 'success', value: taskStats.finished },
    { color: '#e7964c', icon: AlertCircle, label: '待处理', path: '/workflow/tasks', subLabel: `${taskStats.failed} 失败任务`, subTone: taskStats.failed ? 'error' : 'default', value: pendingCount },
    { color: '#1eaaa2', icon: CalendarClock, label: '调度', path: '/workflow/scheduler', subLabel: `队列 ${scheduler?.queue_pending ?? 0} 待执行`, subTone: 'default', value: scheduler?.pool_running ?? 0 }
  ];

  const pendingItems: Array<{ color: string; count: number; icon: LucideIcon; label: string; path: string }> = [
    { color: '#df6d67', count: taskStats.failed, icon: AlertCircle, label: '失败任务', path: '/workflow/tasks?status=failed' },
    { color: '#e7964c', count: healthCounts.error, icon: Activity, label: '连接异常', path: '/workflow/data-source?status=failed' },
    { color: '#8b6ccf', count: 7, icon: ShieldCheck, label: '质检工单', path: '/quality/tickets?status=pending' },
    { color: '#4b75ff', count: 4, icon: FileChartColumn, label: '待发布草稿', path: '/standards/value-domain?status=draft' }
  ];

  return (
    <main className={cx('home-page', styles.page)}>
      <section className="home-welcome">
        <div><span className="home-greeting">{greetingFor(now)}，</span><strong className="home-title">工作台概览</strong></div>
        <time className="home-date">{now.toLocaleDateString('zh-CN', { day: 'numeric', month: 'long', weekday: 'long', year: 'numeric' })}</time>
      </section>

      <section className="home-stat-row" aria-busy={loading}>
        {statCards.map(({ color, icon: Icon, label, path, subLabel, subTone, value }) => (
          <button className="home-stat-card" key={label} onClick={() => navigate(path)} type="button">
            <span className="home-stat-icon" style={{ background: `${color}18`, color }}><Icon size={22} /></span>
            <span className="home-stat-body"><span className="home-stat-label">{label}</span><strong className="home-stat-value">{value}</strong><Tag bordered={false} color={subTone} style={{ alignSelf: 'flex-start', fontSize: 11, marginTop: 4 }}>{subLabel}</Tag></span>
            <ChevronRight className="home-stat-arrow" size={18} />
          </button>
        ))}
      </section>

      <section className="home-main-grid">
        <div className="home-left">
          <Card className="home-panel-card" title={<div className="home-card-heading"><span className="home-card-title">近 {trendDays} 天任务执行趋势</span><Segmented options={[{ label: '30天', value: 30 }, { label: '7天', value: 7 }]} size="small" value={trendDays} onChange={(value) => setTrendDays(value as 7 | 30)} /></div>}>
            <div className="home-chart">
              <ResponsiveContainer><BarChart data={trendRows}><CartesianGrid stroke="#edf0f5" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fill: '#8996a8', fontSize: 11 }} tickLine={false} /><YAxis tick={{ fill: '#8996a8', fontSize: 11 }} tickLine={false} /><Tooltip /><Bar dataKey="success" fill="#2aa876" name="成功" stackId="tasks" /><Bar dataKey="running" fill="#4b75ff" name="运行中" stackId="tasks" /><Bar dataKey="failed" fill="#df6d67" name="失败" stackId="tasks" /></BarChart></ResponsiveContainer>
            </div>
          </Card>

          <Card className="home-panel-card" title={<div className="home-card-heading"><span className="home-card-title">数据源健康度</span><div className="home-health-actions">{(['all', 'normal', 'error', 'unknown'] as const).map((status) => <Button key={status} size="small" type={healthFilter === status ? 'primary' : 'default'} onClick={() => { setHealthFilter(status); setHealthExpanded(false); }}>{status === 'all' ? `全部 ${healthSources.length}` : `${status === 'normal' ? '正常' : status === 'error' ? '异常' : '未测'} ${healthCounts[status]}`}</Button>)}</div></div>}>
            <div className="home-health-grid">
              {visibleSources.map(({ icon: Icon, id, name, status, type }) => <button className={`home-health-item ${status}`} key={id} onClick={() => navigate('/workflow/data-source')} type="button"><span className="home-health-icon"><Icon size={16} /></span><span className="home-health-name">{name}</span><span className="home-health-status"><i className={`home-status-dot ${status}`} />{status === 'normal' ? '正常' : status === 'error' ? '异常' : '未测试'} · {type}</span></button>)}
            </div>
            {(matchingSources.length > 8 || healthExpanded) ? <div className="home-health-footer"><Space><Button size="small" type="link" onClick={() => setHealthExpanded((value) => !value)}>{healthExpanded ? '收起' : `查看更多 (${matchingSources.length - 8})`}</Button><Button size="small" type="link" onClick={() => navigate('/workflow/data-source')}>管理数据源</Button></Space></div> : null}
          </Card>

          <div className="home-governance-row">
            <Card className="home-panel-card" title={<div className="home-card-heading"><span className="home-card-title">数据增长趋势</span><span className="home-card-subtitle">1.2TB <b className="home-trend-up">↑ 18%</b></span></div>}>
              <div className="home-small-chart"><ResponsiveContainer><LineChart data={growthData}><CartesianGrid stroke="#edf0f5" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fill: '#8996a8', fontSize: 11 }} tickLine={false} /><YAxis tickFormatter={(value) => `${value}TB`} tick={{ fill: '#8996a8', fontSize: 11 }} tickLine={false} /><Tooltip /><Line dataKey="value" dot={false} stroke="#4b75ff" strokeWidth={2} type="monotone" /></LineChart></ResponsiveContainer></div>
            </Card>
            <Card className="home-panel-card" title={<div className="home-card-heading"><span className="home-card-title">质检得分分布</span><span className="home-card-subtitle">92.3分 <b className="home-trend-up">↑ 3.5%</b></span></div>}>
              <div className="home-small-chart"><ResponsiveContainer><PieChart><Pie cx="50%" cy="50%" data={[{ name: '达标', value: 920 }, { name: '未达标', value: 80 }]} dataKey="value" innerRadius="54%" outerRadius="72%" paddingAngle={2}>{['#2aa876', '#df6d67'].map((color) => <Cell fill={color} key={color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
            </Card>
          </div>
        </div>

        <aside className="home-right">
          <Card className="home-panel-card" title={<span className="home-card-title">常用入口</span>}>
            <div className="home-quick-list">
              {[{ color: '#4b75ff', icon: PlayCircle, key: 'N', label: '新建数据流', path: '/workflow/flow-designer' }, { color: '#8b6ccf', icon: Database, key: 'R', label: '注册数据源', path: '/workflow/data-source' }, { color: '#2aa876', icon: ShieldCheck, key: 'Q', label: '质检方案配置', path: '/quality/plans' }, { color: '#e7964c', icon: FileChartColumn, key: 'V', label: '查看报告', path: '/quality/reports' }].map(({ color, icon: Icon, key, label, path }) => <button className="home-quick-item" key={key} onClick={() => navigate(path)} type="button"><span className="home-quick-icon" style={{ background: `${color}18`, color }}><Icon size={16} /></span><span className="home-quick-label">{label}</span><kbd className="home-shortcut">⌘ {key}</kbd></button>)}
            </div>
          </Card>

          <Card className="home-panel-card" title={<span className="home-card-title">待处理工作项</span>}>
            <div className="home-work-list">{pendingItems.map(({ color, count, icon: Icon, label, path }) => <button className="home-work-item" disabled={!count} key={label} onClick={() => navigate(path)} type="button"><span className="home-work-icon" style={{ background: `${color}18`, color }}><Icon size={15} /></span><span className="home-work-label">{label}</span><Tag bordered={false} color={count ? 'error' : 'default'}>{count}</Tag>{count ? <ChevronRight color="#8996a8" size={14} /> : null}</button>)}</div>
          </Card>

          <Card className="home-panel-card" title={<div className="home-card-heading"><span className="home-card-title">最近运行任务</span><Button size="small" type="link" onClick={() => navigate('/workflow/tasks')}>查看全部</Button></div>}>
            <div className="home-task-list">{recentTasks.length ? recentTasks.map((task) => <button className="home-task-item" key={task.id} onClick={() => navigate('/workflow/tasks')} type="button"><i className={`home-task-dot ${task.status}`} /><span className="home-task-name">{task.name}</span><Tag bordered={false} color={task.status === 'success' ? 'success' : task.status === 'running' ? 'processing' : 'error'}>{taskStatusLabel(task.status)}</Tag><time className="home-task-time">{task.time}</time></button>) : <Empty description="暂无任务运行记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />}</div>
          </Card>
        </aside>
      </section>
      {error ? <div className="home-load-error"><Spin size="small" /> <span>统计数据加载失败，展示默认概览。</span></div> : null}
    </main>
  );
}
