import { Button, Card, DatePicker, Dropdown, Input, Popconfirm, Select, Space, Statistic, Tag, message } from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import { AlertCircle, CheckCircle2, Clock3, Copy, MoreHorizontal, RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AsyncState } from '@/components/AsyncState';
import { DataTable } from '@/components/DataTable';
import { ConsolePage } from '@/pages/shared/page';
import { cancelTaskExecutionApi, getDataFlowListApi, getTaskExecutionListApi, getTaskExecutionStatsApi, retryTaskExecutionApi } from '@/services/workflow';
import type { TaskExecution } from '@/types/workflow';

type TaskParams = {
  end_time?: string;
  flow_id?: number;
  keyword: string;
  page: number;
  page_size: number;
  start_time?: string;
  status?: TaskExecution['status'];
  trigger_type?: TaskExecution['trigger_type'];
};

const statusInfo: Record<TaskExecution['status'], { color: string; label: string }> = {
  cancelled: { color: 'warning', label: '已取消' },
  failed: { color: 'error', label: '失败' },
  pending: { color: 'default', label: '待执行' },
  running: { color: 'processing', label: '运行中' },
  success: { color: 'success', label: '成功' }
};

function formatDuration(value: number | null) {
  if (!value) return '-';
  const seconds = Math.floor(value / 1000);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分${seconds % 60}秒`;
  return `${Math.floor(minutes / 60)}时${minutes % 60}分`;
}

export function WorkflowTasksPage() {
  const navigate = useNavigate();
  const [tableParams, setTableParams] = useState<TaskParams>({ keyword: '', page: 1, page_size: 20 });
  const [rows, setRows] = useState<TaskExecution[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ failed: 0, running: 0, success: 0, total: 0 });
  const [flowOptions, setFlowOptions] = useState<Array<{ label: string; value: number }>>([]);
  const [selectedIds, setSelectedIds] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const sequence = useRef(0);

  const loadData = useCallback(async (params: TaskParams) => {
    const current = ++sequence.current;
    setLoading(true);
    setError(undefined);
    try {
      const [page, taskStats] = await Promise.all([getTaskExecutionListApi(params), getTaskExecutionStatsApi()]);
      if (current === sequence.current) {
        setRows(page.list);
        setTotal(page.total);
        setStats(taskStats);
      }
    } catch (requestError) {
      if (current === sequence.current) setError(requestError);
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(tableParams);
    return () => { sequence.current += 1; };
  }, [loadData, tableParams]);

  useEffect(() => {
    void getDataFlowListApi({ page: 1, page_size: 200, status: 'published' }).then((page) => setFlowOptions(page.list.map((flow) => ({ label: flow.name, value: flow.id }))));
  }, []);

  useEffect(() => {
    const poll = () => {
      if (document.visibilityState === 'visible') void loadData(tableParams);
    };
    const timer = window.setInterval(poll, 5000);
    document.addEventListener('visibilitychange', poll);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [loadData, tableParams]);

  async function refreshAfterAction() {
    setSelectedIds([]);
    await loadData(tableParams);
  }

  async function retryTasks(ids: React.Key[], useSnapshot = false) {
    await Promise.all(ids.map((id) => retryTaskExecutionApi(Number(id), { use_snapshot: useSnapshot })));
    message.success(`已提交 ${ids.length} 个任务重跑`);
    await refreshAfterAction();
  }

  async function cancelTasks(ids: React.Key[]) {
    await Promise.all(ids.map((id) => cancelTaskExecutionApi(Number(id))));
    message.success(`已取消 ${ids.length} 个任务`);
    await refreshAfterAction();
  }

  const columns: TableColumnsType<TaskExecution> = [
    {
      dataIndex: 'id',
      render: (id: number) => <Space size={4}><span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>TSK-{String(id).padStart(5, '0')}</span><Button aria-label={`复制任务 ${id}`} icon={<Copy size={13} />} size="small" type="text" onClick={(event) => { event.stopPropagation(); void navigator.clipboard?.writeText(String(id)); message.success('任务 ID 已复制'); }} /></Space>,
      title: '任务 ID',
      width: 150
    },
    { dataIndex: 'flow_name', render: (name: string, row) => <Button type="link" onClick={(event) => { event.stopPropagation(); navigate(`/workflow/flow-designer/${row.flow_id}`); }}>{name}</Button>, title: '数据流', width: 180 },
    { dataIndex: 'trigger_type', render: (value: TaskExecution['trigger_type']) => <Tag>{value === 'scheduled' ? '定时' : '手动'}</Tag>, title: '触发方式', width: 100 },
    { dataIndex: 'status', render: (value: TaskExecution['status']) => <Tag color={statusInfo[value].color}>{statusInfo[value].label}</Tag>, title: '状态', width: 110 },
    { dataIndex: 'start_time', render: (value: string | null) => value || '-', title: '开始时间', width: 175 },
    { dataIndex: 'duration_ms', render: formatDuration, title: '耗时', width: 100 },
    {
      fixed: 'right',
      key: 'actions',
      render: (_, row) => {
        const retryMenu: MenuProps = { items: [{ key: 'latest', label: '重跑（使用最新配置）' }, { key: 'snapshot', label: '重跑（使用实例快照配置）' }], onClick: ({ key, domEvent }) => { domEvent.stopPropagation(); void retryTasks([row.id], key === 'snapshot'); } };
        return <Space size={0} onClick={(event) => event.stopPropagation()}><Button type="link" onClick={() => navigate(`/workflow/tasks/${row.id}`)}>查看</Button>{row.status === 'running' || row.status === 'pending' ? <Popconfirm description="取消后正在处理的数据将停止执行。" okText="取消任务" title="确认取消此任务？" onConfirm={() => void cancelTasks([row.id])}><Button danger type="link">取消</Button></Popconfirm> : <Dropdown menu={retryMenu}><Button icon={<MoreHorizontal size={15} />} type="link">重跑</Button></Dropdown>}</Space>;
      },
      title: '操作',
      width: 170
    }
  ];

  return (
    <ConsolePage description="监控任务执行状态，查看异常并按实例重跑或取消。" title="运行任务">
      <div className="console-page-summary">
        {[{ color: '#6366f1', icon: Clock3, key: 'total', label: '总任务数', value: stats.total }, { color: '#4b75ff', icon: RefreshCw, key: 'running', label: '运行中', value: stats.running }, { color: '#2aa876', icon: CheckCircle2, key: 'success', label: '成功', value: stats.success }, { color: '#df6d67', icon: AlertCircle, key: 'failed', label: '失败', value: stats.failed }].map(({ color, icon: Icon, key, label, value }) => <Card hoverable key={key} onClick={() => setTableParams((previous) => ({ ...previous, page: 1, status: key === 'total' ? undefined : key as TaskExecution['status'] }))}><Space><Icon color={color} size={22} /><Statistic title={label} value={value} /></Space></Card>)}
      </div>
      <Card className="console-page-card">
        <div className="console-page-toolbar">
          <Input allowClear placeholder="搜索任务 ID" prefix={<Search size={15} />} style={{ width: 180 }} onPressEnter={(event) => setTableParams((previous) => ({ ...previous, keyword: event.currentTarget.value.trim(), page: 1 }))} />
          <Select allowClear options={flowOptions} placeholder="数据流" style={{ width: 180 }} value={tableParams.flow_id} onChange={(flow_id) => setTableParams((previous) => ({ ...previous, flow_id, page: 1 }))} />
          <Select allowClear options={[{ label: '手动', value: 'manual' }, { label: '定时', value: 'scheduled' }]} placeholder="触发方式" style={{ width: 120 }} value={tableParams.trigger_type} onChange={(trigger_type) => setTableParams((previous) => ({ ...previous, page: 1, trigger_type }))} />
          <Select allowClear options={Object.entries(statusInfo).map(([value, info]) => ({ label: info.label, value }))} placeholder="状态" style={{ width: 120 }} value={tableParams.status} onChange={(status) => setTableParams((previous) => ({ ...previous, page: 1, status }))} />
          <DatePicker.RangePicker showTime onChange={(range) => setTableParams((previous) => ({ ...previous, end_time: range?.[1]?.toISOString(), page: 1, start_time: range?.[0]?.toISOString() }))} />
          <Button type="primary" onClick={() => setTableParams((previous) => ({ ...previous, page: 1 }))}>查询</Button>
          <Button onClick={() => setTableParams({ keyword: '', page: 1, page_size: 20 })}>重置</Button>
          <span className="console-page-toolbar-spacer" />
          <Button icon={<RefreshCw size={15} />} onClick={() => void loadData(tableParams)}>刷新</Button>
        </div>
        {selectedIds.length ? <Space style={{ background: '#f4f7ff', borderRadius: 6, marginBottom: 12, padding: '8px 12px' }}><span>已选 {selectedIds.length} 项</span><Button size="small" onClick={() => void retryTasks(selectedIds)}>批量重跑</Button><Popconfirm okText="批量取消" title={`确认取消 ${selectedIds.length} 个任务？`} onConfirm={() => void cancelTasks(selectedIds)}><Button danger size="small">批量取消</Button></Popconfirm></Space> : null}
        <AsyncState error={error} loading={loading} onRetry={() => void loadData(tableParams)}><DataTable columns={columns} dataSource={rows} pagination={{ current: tableParams.page, onChange: (page, page_size) => setTableParams((previous) => ({ ...previous, page, page_size })), pageSize: tableParams.page_size, total }} rowKey="id" rowSelection={{ onChange: setSelectedIds, selectedRowKeys: selectedIds }} onRow={(row) => ({ onClick: () => navigate(`/workflow/tasks/${row.id}`), style: { cursor: 'pointer' } })} /></AsyncState>
      </Card>
    </ConsolePage>
  );
}
