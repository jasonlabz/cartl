import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BadgeCheck,
  BookOpenCheck,
  Boxes,
  CalendarClock,
  ChartNoAxesCombined,
  CircleGauge,
  Database,
  FileChartColumn,
  GitBranch,
  Library,
  Network,
  ScanSearch,
  ShieldCheck,
  SlidersHorizontal,
  SquareFunction,
  TableProperties,
  TicketCheck,
  Workflow
} from 'lucide-react';

export type NavigationItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const navigationGroups: NavigationGroup[] = [
  {
    label: '工作台',
    items: [{ label: '治理概览', path: '/home', icon: CircleGauge }]
  },
  {
    label: '标准管理',
    items: [
      { label: '组织机构', path: '/standards/org', icon: Network },
      { label: '值域标准', path: '/standards/value-domain', icon: Library },
      { label: '元数据标准', path: '/standards/metadata', icon: BookOpenCheck }
    ]
  },
  {
    label: '数据工坊',
    items: [
      { label: '数据源', path: '/workflow/data-source', icon: Database },
      { label: '资产仓库', path: '/workflow/asset-repo', icon: Boxes },
      { label: '算子库', path: '/workflow/operators', icon: SquareFunction },
      { label: '数据流', path: '/workflow/flow-designer', icon: Workflow },
      { label: '运行任务', path: '/workflow/tasks', icon: Activity },
      { label: '调度中心', path: '/workflow/scheduler', icon: CalendarClock }
    ]
  },
  {
    label: '质量中心',
    items: [
      { label: '质量规则', path: '/quality/rules', icon: ShieldCheck },
      { label: '质检方案', path: '/quality/plans', icon: SlidersHorizontal },
      { label: '质量报告', path: '/quality/reports', icon: FileChartColumn },
      { label: '问题工单', path: '/quality/tickets', icon: TicketCheck }
    ]
  },
  {
    label: '数据洞察',
    items: [
      { label: '资产目录', path: '/data-view/catalog', icon: TableProperties },
      { label: '数据探查', path: '/data-view/profiling', icon: ScanSearch },
      { label: '数据血缘', path: '/data-view/lineage', icon: GitBranch },
      { label: '版本对比', path: '/data-view/compare', icon: ChartNoAxesCombined }
    ]
  }
];

export const flatNavigation = navigationGroups.flatMap(group => group.items);

export const titleByPath = Object.fromEntries(flatNavigation.map(item => [item.path, item.label]));

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type DataSourceItem = {
  id: number;
  name: string;
  type: string;
  owner: string;
  status: string;
  tone: StatusTone;
  host: string;
  assets: number;
  updatedAt: string;
};

export const dataSources: DataSourceItem[] = [
  { id: 1, name: '生产订单主库', type: 'PostgreSQL', owner: '交易平台组', status: '健康', tone: 'success', host: '10.20.4.18:5432', assets: 168, updatedAt: '2 分钟前' },
  { id: 2, name: '用户行为仓库', type: 'ClickHouse', owner: '增长数据组', status: '健康', tone: 'success', host: '10.20.8.42:9000', assets: 86, updatedAt: '6 分钟前' },
  { id: 3, name: '实时事件总线', type: 'Kafka', owner: '实时计算组', status: '检查中', tone: 'warning', host: 'kafka-prod.internal', assets: 42, updatedAt: '11 分钟前' },
  { id: 4, name: '财务分析库', type: 'MySQL', owner: '财务数据组', status: '连接异常', tone: 'danger', host: '10.20.6.12:3306', assets: 37, updatedAt: '23 分钟前' },
  { id: 5, name: '对象归档仓库', type: 'S3', owner: '基础架构组', status: '健康', tone: 'success', host: 'archive-prod', assets: 214, updatedAt: '1 小时前' },
  { id: 6, name: '营销标签服务', type: 'Redis', owner: '用户运营组', status: '健康', tone: 'success', host: 'redis-tags.internal', assets: 19, updatedAt: '2 小时前' }
];

export type FlowRow = {
  id: number;
  name: string;
  description: string;
  status: string;
  tone: StatusTone;
  nodes: number;
  runs: string;
  owner: string;
  updatedAt: string;
};

export const flows: FlowRow[] = [
  { id: 101, name: '订单实时入仓', description: 'PostgreSQL CDC 清洗后写入数仓明细层', status: '已发布', tone: 'success', nodes: 8, runs: '今日 1,248 次', owner: 'Lucas', updatedAt: '刚刚' },
  { id: 102, name: '客户主数据标准化', description: '客户数据去重、字段标准化与质量校验', status: '草稿', tone: 'neutral', nodes: 12, runs: '尚未运行', owner: '王悦', updatedAt: '18 分钟前' },
  { id: 103, name: '营销行为聚合', description: '事件流按用户和渠道进行小时级聚合', status: '运行中', tone: 'info', nodes: 7, runs: '今日 438 次', owner: '陈哲', updatedAt: '31 分钟前' },
  { id: 104, name: '财务日报同步', description: '核心财务指标同步到分析集市', status: '待修复', tone: 'danger', nodes: 6, runs: '失败 2 次', owner: 'Lin', updatedAt: '1 小时前' }
];

export type QualityRow = {
  name: string;
  dimension: string;
  target: string;
  score: string;
  status: string;
  tone: StatusTone;
  updatedAt: string;
};

export const qualityRules: QualityRow[] = [
  { name: '订单主键唯一性', dimension: '唯一性', target: 'dwd_order.order_id', score: '99.99%', status: '启用', tone: 'success', updatedAt: '5 分钟前' },
  { name: '客户手机号完整率', dimension: '完整性', target: 'dim_customer.mobile', score: '98.72%', status: '启用', tone: 'success', updatedAt: '12 分钟前' },
  { name: '交易金额非负', dimension: '有效性', target: 'dwd_payment.amount', score: '100%', status: '启用', tone: 'success', updatedAt: '26 分钟前' },
  { name: '渠道代码标准值域', dimension: '规范性', target: 'dwd_order.channel', score: '96.48%', status: '告警', tone: 'warning', updatedAt: '41 分钟前' },
  { name: '财务日期及时性', dimension: '及时性', target: 'ads_finance.stat_date', score: '91.30%', status: '需处理', tone: 'danger', updatedAt: '1 小时前' }
];

export const activityFeed = [
  { icon: BadgeCheck, title: '订单实时入仓发布成功', detail: '版本 v2.8 · Lucas', time: '2 分钟前', tone: 'success' as StatusTone },
  { icon: ShieldCheck, title: '客户数据质检完成', detail: '通过 46 / 48 项检查', time: '12 分钟前', tone: 'info' as StatusTone },
  { icon: Database, title: '财务分析库连接异常', detail: '重试 3 次后仍未恢复', time: '23 分钟前', tone: 'danger' as StatusTone },
  { icon: Boxes, title: '新增 18 个数据资产', detail: '来自用户行为仓库', time: '1 小时前', tone: 'neutral' as StatusTone }
];

export const chartData = [
  { day: '07-11', success: 96, failed: 6 },
  { day: '07-12', success: 112, failed: 4 },
  { day: '07-13', success: 88, failed: 7 },
  { day: '07-14', success: 132, failed: 3 },
  { day: '07-15', success: 124, failed: 5 },
  { day: '07-16', success: 148, failed: 2 },
  { day: '今天', success: 138, failed: 4 }
];
