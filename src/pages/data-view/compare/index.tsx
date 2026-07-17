import { Button, Card, Form, Input, Select, Statistic, Table } from 'antd';
import { Play } from 'lucide-react';
import { useState } from 'react';

import { ConsolePage } from '@/pages/shared/page';
import { executeDataCompareApi } from '@/services/data-view';
import type { CompareConfig, CompareResult } from '@/types/data-view';

type CompareForm = { left_datasource: number; left_table: string; right_datasource: number; right_table: string; key_columns: string };

export function DataComparePage() {
  const [form] = Form.useForm<CompareForm>();
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function compare(values: CompareForm) {
    const keys = values.key_columns.split(',').map((value) => value.trim()).filter(Boolean);
    const data: CompareConfig = { left: { datasource_id: values.left_datasource, key_columns: keys, table_name: values.left_table }, right: { datasource_id: values.right_datasource, key_columns: keys, table_name: values.right_table } };
    setLoading(true);
    try { setResult(await executeDataCompareApi(data)); } finally { setLoading(false); }
  }

  return (
    <ConsolePage description="对比两个数据源表的结构和记录差异。" title="版本对比">
      <Card title="对比配置" style={{ marginBottom: 16 }}><Form form={form} layout="vertical" onFinish={compare}><div className="console-page-detail-grid"><Card size="small" title="左侧数据"><Form.Item label="数据源 ID" name="left_datasource" rules={[{ required: true }]}><Input type="number" /></Form.Item><Form.Item label="表名" name="left_table" rules={[{ required: true }]}><Input /></Form.Item></Card><Card size="small" title="右侧数据"><Form.Item label="数据源 ID" name="right_datasource" rules={[{ required: true }]}><Input type="number" /></Form.Item><Form.Item label="表名" name="right_table" rules={[{ required: true }]}><Input /></Form.Item></Card></div><Form.Item label="主键列（逗号分隔）" name="key_columns" rules={[{ required: true }]} style={{ marginTop: 16 }}><Input placeholder="例如 id, order_id" /></Form.Item><Button htmlType="submit" icon={<Play size={15} />} loading={loading} type="primary">执行对比</Button></Form></Card>
      {result ? <><div className="console-page-summary"><Card><Statistic title="左侧总数" value={result.left_total} /></Card><Card><Statistic title="右侧总数" value={result.right_total} /></Card><Card><Statistic title="匹配记录" value={result.match_count} /></Card><Card><Statistic title="差异记录" value={result.different + result.left_only + result.right_only} /></Card></div><Card title="差异明细"><Table columns={[{ dataIndex: 'type', title: '差异类型' }, { dataIndex: 'key_values', title: '主键值', render: (value) => JSON.stringify(value) }, { dataIndex: 'diff_fields', title: '差异字段', render: (value?: string[]) => value?.join(', ') ?? '-' }]} dataSource={result.differences} pagination={{ showSizeChanger: true }} rowKey={(_, index) => String(index)} /></Card></> : null}
    </ConsolePage>
  );
}
