import { Button, Card, Form, Input, Progress, Spin, Statistic, Table } from 'antd';
import { Play, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { ConsolePage } from '@/pages/shared/page';
import { getTableProfileApi, getTableProfileTaskApi, startTableProfileApi } from '@/services/data-view';
import type { TableProfile } from '@/types/data-view';

type ProfileForm = { datasource_id: number; schema?: string; table: string };

export function DataProfilingPage() {
  const [form] = Form.useForm<ProfileForm>();
  const [profile, setProfile] = useState<TableProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<number | null>(null);
  const pollingTimerRef = useRef<number | null>(null);

  function stopPolling() {
    if (pollingTimerRef.current !== null) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }

  useEffect(() => stopPolling, []);

  async function queryProfile(values: ProfileForm) {
    setLoading(true);
    try { setProfile(await getTableProfileApi(values)); } catch { setProfile(null); } finally { setLoading(false); }
  }

  async function startProfile() {
    const values = await form.validateFields();
    stopPolling();
    setLoading(true);
    try {
      const task = await startTableProfileApi(values);
      setTaskId(task.task_id);
      pollingTimerRef.current = window.setInterval(() => {
        void getTableProfileTaskApi(task.task_id).then((state) => {
          if (state.result) setProfile(state.result);
          if (state.status === 'completed' || state.status === 'failed') {
            stopPolling();
            setLoading(false);
          }
        }).catch(() => {
          stopPolling();
          setLoading(false);
        });
      }, 1000);
    } catch { setLoading(false); }
  }

  return (
    <ConsolePage description="按数据源和表执行数据探查，查看字段分布与完整性指标。" title="数据探查">
      <Card style={{ marginBottom: 16 }}><Form form={form} layout="inline" onFinish={queryProfile}>
        <Form.Item name="datasource_id" rules={[{ required: true, message: '请输入数据源 ID' }]}><Input placeholder="数据源 ID" type="number" /></Form.Item>
        <Form.Item name="schema"><Input placeholder="Schema（可选）" /></Form.Item>
        <Form.Item name="table" rules={[{ required: true, message: '请输入表名' }]}><Input placeholder="表名" /></Form.Item>
        <Button htmlType="submit" icon={<RefreshCw size={15} />} loading={loading}>查询</Button>
        <Button icon={<Play size={15} />} loading={loading} type="primary" onClick={() => void startProfile()}>执行探查</Button>
      </Form></Card>
      {loading && !profile ? <Spin /> : null}
      {taskId ? <p className="console-page-muted">探查任务 #{taskId} 正在执行。</p> : null}
      {profile ? <>
        <div className="console-page-summary"><Card><Statistic title="数据行数" value={profile.row_count} /></Card><Card><Statistic title="字段数量" value={profile.column_count} /></Card><Card><Statistic title="存储大小" value={profile.size_bytes} suffix="B" /></Card><Card><Statistic title="完整性" value={profile.completeness * 100} precision={2} suffix="%" /></Card></div>
        <Card title={`${profile.table_name} · 字段统计`}><Table columns={[{ dataIndex: 'name', title: '字段名' }, { dataIndex: 'type', title: '类型' }, { dataIndex: 'null_rate', title: '空值率', render: (value: number) => <Progress percent={Number((value * 100).toFixed(2))} size="small" /> }, { dataIndex: 'distinct_count', title: '去重值数' }, { dataIndex: 'min_value', title: '最小值' }, { dataIndex: 'max_value', title: '最大值' }]} dataSource={profile.fields} pagination={false} rowKey="name" /></Card>
      </> : null}
    </ConsolePage>
  );
}
