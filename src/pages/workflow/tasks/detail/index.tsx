import { Button, Card, Descriptions, Empty, Input, Popconfirm, Select, Space, Spin, Table, Tabs, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AsyncState } from '@/components/AsyncState';
import { getTaskExecutionDetailApi, getTaskExecutionLogsApi, getTaskExecutionPreviewApi, getTaskExecutionSnapshotApi, getTaskExecutionStagesApi, cancelTaskExecutionApi, retryTaskExecutionApi } from '@/services/workflow';
import type { TaskExecution, TaskLogEntry, TaskSnapshot, TaskStageDetail, WorkflowTablePreview } from '@/types/workflow';

const statuses: Record<TaskExecution['status'], { color: string; label: string }> = {
  cancelled: { color: 'warning', label: '已取消' }, failed: { color: 'error', label: '失败' }, pending: { color: 'default', label: '待执行' }, running: { color: 'processing', label: '运行中' }, success: { color: 'success', label: '成功' }
};

function formatDuration(value: number | null) {
  if (!value) return '-';
  const seconds = Math.floor(value / 1000);
  return seconds < 60 ? `${seconds}秒` : `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
}

export function WorkflowTaskDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const taskId = Number(id);
  const [task, setTask] = useState<TaskExecution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [tab, setTab] = useState('logs');
  const [logs, setLogs] = useState<TaskLogEntry[]>([]);
  const [logLevel, setLogLevel] = useState<TaskLogEntry['level']>();
  const [logKeyword, setLogKeyword] = useState('');
  const [stages, setStages] = useState<TaskStageDetail[]>([]);
  const [preview, setPreview] = useState<WorkflowTablePreview | null>(null);
  const [snapshot, setSnapshot] = useState<TaskSnapshot | null>(null);
  const sequence = useRef(0);

  const loadTask = useCallback(async () => {
    if (!Number.isSafeInteger(taskId)) return;
    const current = ++sequence.current;
    setLoading(true);
    setError(undefined);
    try {
      const nextTask = await getTaskExecutionDetailApi(taskId);
      if (current === sequence.current) setTask(nextTask);
    } catch (requestError) {
      if (current === sequence.current) setError(requestError);
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, [taskId]);

  const loadLogs = useCallback(async () => {
    const nextLogs = await getTaskExecutionLogsApi(taskId, { keyword: logKeyword || undefined, level: logLevel });
    setLogs(nextLogs);
  }, [logKeyword, logLevel, taskId]);

  const loadStages = useCallback(async () => setStages(await getTaskExecutionStagesApi(taskId)), [taskId]);
  const loadPreview = useCallback(async () => setPreview(await getTaskExecutionPreviewApi(taskId)), [taskId]);
  const loadSnapshot = useCallback(async () => setSnapshot(await getTaskExecutionSnapshotApi(taskId)), [taskId]);

  useEffect(() => { void loadTask(); return () => { sequence.current += 1; }; }, [loadTask]);
  useEffect(() => { if (tab === 'logs') void loadLogs(); }, [loadLogs, tab]);
  useEffect(() => {
    const poll = () => {
      if (document.visibilityState !== 'visible' || task?.status !== 'running') return;
      void loadTask();
      if (tab === 'logs') void loadLogs();
      if (tab === 'stages') void loadStages();
    };
    const timer = window.setInterval(poll, 5000);
    document.addEventListener('visibilitychange', poll);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', poll); };
  }, [loadLogs, loadStages, loadTask, tab, task?.status]);

  const stageColumns: TableColumnsType<TaskStageDetail> = [{ dataIndex: 'node_name', title: '节点名称' }, { dataIndex: 'status', render: (value: TaskExecution['status']) => <Tag color={statuses[value].color}>{statuses[value].label}</Tag>, title: '状态' }, { dataIndex: 'processed_rows', title: '处理行数' }, { dataIndex: 'throughput_rows_per_sec', title: '吞吐量（行/秒）' }, { dataIndex: 'duration_ms', render: formatDuration, title: '耗时' }];
  const previewColumns = useMemo<TableColumnsType<Record<string, unknown>>>(() => (preview?.columns ?? []).map((column) => { const name = typeof column === 'string' ? column : column.name; return { dataIndex: name, key: name, title: name, width: 150 }; }), [preview]);

  async function cancelTask() {
    await cancelTaskExecutionApi(taskId);
    message.success('任务已取消');
    await loadTask();
  }

  async function retryTask(useSnapshot = false) {
    await retryTaskExecutionApi(taskId, { use_snapshot: useSnapshot });
    message.success('重跑已提交');
    await loadTask();
  }

  if (!Number.isSafeInteger(taskId)) return <Empty description="无效的任务 ID" />;

  return <main className="console-page" style={{ margin: '0 auto', maxWidth: 1480, padding: '32px 42px 48px', width: '100%' }}>
    <AsyncState error={error} loading={loading} onRetry={() => void loadTask()}>
      {task ? <>
        <Card className="console-page-card" style={{ marginBottom: 16 }}><Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}><Space><Button icon={<ArrowLeft size={15} />} type="text" onClick={() => navigate('/workflow/tasks')}>返回列表</Button><div><strong style={{ fontSize: 18 }}>任务 #{task.id}</strong><Space size={8} style={{ marginLeft: 12 }}><Tag color={statuses[task.status].color}>{statuses[task.status].label}</Tag><span className="console-page-muted">{task.flow_name}</span></Space></div></Space><Space>{task.status === 'running' || task.status === 'pending' ? <Popconfirm okText="取消任务" title="确认取消此任务？" onConfirm={() => void cancelTask()}><Button danger>取消任务</Button></Popconfirm> : null}{task.status === 'failed' || task.status === 'success' || task.status === 'cancelled' ? <Button onClick={() => void retryTask()}>重跑</Button> : null}</Space></Space></Card>
        <Card className="console-page-card"><Tabs activeKey={tab} onChange={(key) => { setTab(key); if (key === 'stages' && !stages.length) void loadStages(); if (key === 'preview' && !preview) void loadPreview(); if (key === 'snapshot' && !snapshot) void loadSnapshot(); }} items={[{ key: 'logs', label: '执行日志', children: <><Space style={{ marginBottom: 12 }}><Select allowClear options={['INFO', 'WARN', 'ERROR'].map((value) => ({ label: value, value }))} placeholder="日志级别" style={{ width: 120 }} value={logLevel} onChange={setLogLevel} /><Input allowClear placeholder="搜索日志关键字" style={{ width: 240 }} value={logKeyword} onChange={(event) => setLogKeyword(event.target.value)} onPressEnter={() => void loadLogs()} /><Button icon={<RefreshCw size={14} />} onClick={() => void loadLogs()} /></Space>{logs.length ? <pre className="console-page-code">{logs.map((log) => `${log.timestamp}  ${log.level.padEnd(5)}  ${log.message}`).join('\n')}</pre> : <Empty description="暂无日志数据" />}</> }, { key: 'stages', label: '阶段详情', children: <Table columns={stageColumns} dataSource={stages} pagination={false} rowKey="node_id" /> }, { key: 'preview', label: '数据预览', children: task.status === 'success' && preview ? <><p className="console-page-muted">显示前 {preview.rows.length} 条数据（共 {preview.total} 条）</p><Table columns={previewColumns} dataSource={preview.rows} pagination={false} rowKey={(_, index) => String(index)} scroll={{ x: 'max-content' }} /></> : <Empty description="数据预览仅对成功任务可用" /> }, { key: 'errors', label: '错误记录', children: task.status === 'failed' ? <><Descriptions bordered column={2} size="small"><Descriptions.Item label="错误信息" span={2}>{task.error_message || '未知错误'}</Descriptions.Item><Descriptions.Item label="数据流">{task.flow_name}</Descriptions.Item><Descriptions.Item label="触发方式">{task.trigger_type === 'scheduled' ? '定时' : '手动'}</Descriptions.Item><Descriptions.Item label="开始时间">{task.start_time || '-'}</Descriptions.Item><Descriptions.Item label="结束时间">{task.end_time || '-'}</Descriptions.Item><Descriptions.Item label="运行耗时">{formatDuration(task.duration_ms)}</Descriptions.Item></Descriptions><Space style={{ marginTop: 16 }}><Button onClick={() => void retryTask()}>重跑（使用最新配置）</Button><Button onClick={() => void retryTask(true)}>重跑（使用快照配置）</Button></Space></> : <Empty description="错误记录仅对失败任务显示" /> }, { key: 'snapshot', label: '配置快照', children: snapshot ? <><p className="console-page-muted">快照时间：{snapshot.snapshot_at}</p><pre className="console-page-code">{JSON.stringify(snapshot.config_json, null, 2)}</pre></> : <Spin /> }]} /></Card>
      </> : null}
    </AsyncState>
  </main>;
}
