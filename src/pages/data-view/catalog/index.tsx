import { Button, Descriptions, Drawer, Form, Input, Space, Table, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { Edit3, Search, Tags } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AsyncState } from '@/components/AsyncState';
import { DataTable } from '@/components/DataTable';
import { ConsolePage } from '@/pages/shared/page';
import { getDataAssetDetailApi, getDataCatalogApi, updateDataAssetTagsApi } from '@/services/data-view';
import type { DataAsset, DataColumn, TablePreview } from '@/types/data-view';

type TableParams = { keyword: string; page: number; page_size: number; status?: string; type?: string };
type AssetDetail = DataAsset & { columns: DataColumn[]; preview: TablePreview };

export function DataCatalogPage() {
  const [tableParams, setTableParams] = useState<TableParams>({ keyword: '', page: 1, page_size: 20, status: 'active' });
  const [rows, setRows] = useState<DataAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tagEditing, setTagEditing] = useState(false);
  const [tagText, setTagText] = useState('');
  const sequence = useRef(0);

  const loadData = useCallback(async (params: TableParams) => {
    const current = ++sequence.current;
    setLoading(true);
    setError(undefined);
    try {
      const result = await getDataCatalogApi(params);
      if (current === sequence.current) { setRows(result.list); setTotal(result.total); }
    } catch (requestError) { if (current === sequence.current) setError(requestError); }
    finally { if (current === sequence.current) setLoading(false); }
  }, []);

  useEffect(() => { void loadData(tableParams); return () => { sequence.current += 1; }; }, [loadData, tableParams]);

  async function openDetail(item: DataAsset) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const nextDetail = await getDataAssetDetailApi(item.id);
      setDetail(nextDetail);
      setTagText(nextDetail.tags.join(', '));
    } finally { setDetailLoading(false); }
  }

  async function saveTags() {
    if (!detail) return;
    const tags = tagText.split(',').map((value) => value.trim()).filter(Boolean);
    await updateDataAssetTagsApi(detail.id, tags);
    setDetail((previous) => previous ? { ...previous, tags } : previous);
    setTagEditing(false);
    message.success('标签已更新');
    setTableParams((previous) => ({ ...previous }));
  }

  const columns: TableColumnsType<DataAsset> = [
    { dataIndex: 'name', title: '名称', width: 220, render: (_, item) => <Button type="link" onClick={() => void openDetail(item)}>{item.name}</Button> },
    { dataIndex: 'type', title: '类型', width: 85, render: (value: string) => <Tag>{value === 'table' ? '表' : value === 'view' ? '视图' : '文件'}</Tag> },
    { dataIndex: 'datasource_name', title: '数据源', width: 150 }, { dataIndex: 'schema_name', title: 'Schema', width: 120 }, { dataIndex: 'domain', title: '业务域', width: 120 },
    { dataIndex: 'quality_score', title: '质量分', width: 90, render: (value: number | null) => value === null ? '-' : <span style={{ color: value >= 80 ? '#2aa876' : value >= 60 ? '#e7964c' : '#df6d67', fontWeight: 650 }}>{value.toFixed(1)}</span> },
    { dataIndex: 'sensitivity', title: '敏感等级', width: 105, render: (value: string) => <Tag color={value === 'restricted' ? 'error' : value === 'confidential' ? 'warning' : value === 'internal' ? 'blue' : 'default'}>{value}</Tag> },
    { dataIndex: 'tags', title: '标签', width: 200, render: (tags: string[]) => <Space size={2} wrap>{tags?.slice(0, 3).map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space> },
    { dataIndex: 'updated_at', title: '更新时间', width: 170 }
  ];

  return (
    <ConsolePage description="浏览、检索和管理企业数据资产及其业务标签。" title="资产目录">
      <div className="console-page-toolbar">
        <Input allowClear prefix={<Search size={16} />} placeholder="搜索资产名称" style={{ width: 260 }} onPressEnter={(event) => setTableParams((previous) => ({ ...previous, keyword: event.currentTarget.value.trim(), page: 1 }))} />
        <Button onClick={() => setTableParams({ keyword: '', page: 1, page_size: 20, status: 'active' })}>重置</Button>
      </div>
      <AsyncState error={error} loading={loading} onRetry={() => void loadData(tableParams)}><DataTable columns={columns} dataSource={rows} pagination={{ current: tableParams.page, pageSize: tableParams.page_size, total, onChange: (page, page_size) => setTableParams((previous) => ({ ...previous, page, page_size })) }} rowKey="id" /></AsyncState>
      <Drawer open={Boolean(detail) || detailLoading} title={detail?.name ?? '资产详情'} width={720} onClose={() => setDetail(null)}>
        {detailLoading ? '正在加载…' : detail ? <>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="数据源">{detail.datasource_name}</Descriptions.Item><Descriptions.Item label="Schema">{detail.schema_name}</Descriptions.Item>
            <Descriptions.Item label="类型">{detail.type}</Descriptions.Item><Descriptions.Item label="负责人">{detail.owner || '-'}</Descriptions.Item>
            <Descriptions.Item label="说明" span={2}>{detail.comment || '-'}</Descriptions.Item>
          </Descriptions>
          <section style={{ marginTop: 18 }}><Space style={{ justifyContent: 'space-between', width: '100%' }}><h3>业务标签</h3><Button icon={<Edit3 size={14} />} type="link" onClick={() => setTagEditing((value) => !value)}>{tagEditing ? '取消' : '编辑标签'}</Button></Space>
            {tagEditing ? <Space.Compact style={{ width: '100%' }}><Input value={tagText} onChange={(event) => setTagText(event.target.value)} /><Button type="primary" onClick={() => void saveTags()}>保存</Button></Space.Compact> : <Space wrap>{detail.tags.map((tag) => <Tag icon={<Tags size={12} />} key={tag}>{tag}</Tag>)}</Space>}
          </section>
          <section style={{ marginTop: 18 }}><h3>字段信息</h3><Table<DataColumn> columns={[{ dataIndex: 'name', title: '字段' }, { dataIndex: 'type', title: '类型' }, { dataIndex: 'nullable', title: '可空', render: (value: boolean) => value ? '是' : '否' }, { dataIndex: 'comment', title: '说明' }]} dataSource={detail.columns} pagination={false} rowKey="name" size="small" /></section>
        </> : null}
      </Drawer>
    </ConsolePage>
  );
}
