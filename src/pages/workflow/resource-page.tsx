import { Alert, Button, Card, Descriptions, Empty, Form, Input, Modal, Popconfirm, Segmented, Space, Spin, Table, Tabs, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { Activity, ArrowLeft, Database, Edit3, Plus, RefreshCw, Search, Server, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AsyncState } from '@/components/AsyncState';
import { DataTable } from '@/components/DataTable';
import { ConsolePage } from '@/pages/shared/page';
import {
  createAssetRepoApi,
  createDataSourceApi,
  deleteAssetRepoApi,
  deleteDataSourceApi,
  getAssetRepoDetailApi,
  getAssetRepoListApi,
  getDataSourceConnectionLogsApi,
  getDataSourceDetailApi,
  getDataSourceListApi,
  getDataSourceRelatedFlowsApi,
  testDataSourceApi,
  testDataSourceByIdApi,
  testAssetRepoApi,
  testAssetRepoByIdApi,
  updateAssetRepoApi,
  updateDataSourceApi
} from '@/services/workflow';
import type { DataFlow, DataSource, DataSourcePayload } from '@/types/workflow';

type ResourceKind = 'asset-repo' | 'data-source';
type TableParams = { keyword: string; page: number; page_size: number; status?: string; type?: string };
type EditorValues = { config: string; description?: string; name: string; type: string };

const statusMap: Record<DataSource['status'], { color: string; label: string }> = {
  connected: { color: 'success', label: '连接正常' }, disabled: { color: 'default', label: '已禁用' }, error: { color: 'error', label: '连接失败' }, failed: { color: 'error', label: '连接失败' }, normal: { color: 'success', label: '连接正常' }, testing: { color: 'processing', label: '测试中' }, untested: { color: 'default', label: '未测试' }
};

function parseConfig(config: DataSource['config']) {
  if (typeof config === 'string') return config;
  return JSON.stringify(config ?? {}, null, 2);
}

function parsePayload(values: EditorValues): DataSourcePayload {
  let config: Record<string, unknown>;
  try {
    config = values.config.trim() ? JSON.parse(values.config) : {};
  } catch {
    throw new Error('连接配置必须是有效的 JSON 对象。');
  }
  if (Array.isArray(config) || config === null) throw new Error('连接配置必须是 JSON 对象。');
  return { config, description: values.description?.trim(), name: values.name.trim(), type: values.type };
}

function resourceLabel(kind: ResourceKind) {
  return kind === 'data-source' ? '数据源' : '资产仓库';
}

function defaultTypes(kind: ResourceKind) {
  return kind === 'data-source' ? ['mysql', 'postgresql', 'oracle', 'hive', 'kafka', 'redis', 'http_api'] : ['mysql', 'postgresql', 's3', 'hdfs', 'file', 'http_api'];
}

function ResourceListPage({ kind }: { kind: ResourceKind }) {
  const navigate = useNavigate();
  const label = resourceLabel(kind);
  const [form] = Form.useForm<EditorValues>();
  const [tableParams, setTableParams] = useState<TableParams>({ keyword: '', page: 1, page_size: 20 });
  const [rows, setRows] = useState<DataSource[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [editing, setEditing] = useState<DataSource | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ message: string; success: boolean } | null>(null);
  const sequence = useRef(0);

  const listApi = kind === 'data-source' ? getDataSourceListApi : getAssetRepoListApi;
  const createApi = kind === 'data-source' ? createDataSourceApi : createAssetRepoApi;
  const updateApi = kind === 'data-source' ? updateDataSourceApi : updateAssetRepoApi;
  const deleteApi = kind === 'data-source' ? deleteDataSourceApi : deleteAssetRepoApi;
  const testApi = kind === 'data-source' ? testDataSourceApi : testAssetRepoApi;
  const testByIdApi = kind === 'data-source' ? testDataSourceByIdApi : testAssetRepoByIdApi;

  const loadData = useCallback(async (params: TableParams) => {
    const current = ++sequence.current;
    setLoading(true);
    setError(undefined);
    try {
      const page = await listApi(params);
      if (current === sequence.current) { setRows(page.list); setTotal(page.total); }
    } catch (requestError) {
      if (current === sequence.current) setError(requestError);
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, [listApi]);

  useEffect(() => { void loadData(tableParams); return () => { sequence.current += 1; }; }, [loadData, tableParams]);

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
    setTestResult(null);
    form.resetFields();
  }

  function openCreate() {
    setEditing(null);
    setTestResult(null);
    form.setFieldsValue({ config: '{}', description: '', name: '', type: defaultTypes(kind)[0] });
    setEditorOpen(true);
  }

  function openEdit(item: DataSource) {
    setEditing(item);
    setTestResult(null);
    form.setFieldsValue({ config: parseConfig(item.config), description: item.description, name: item.name, type: item.type });
    setEditorOpen(true);
  }

  async function testConnection() {
    const values = await form.validateFields();
    setTesting(true);
    try {
      const payload = parsePayload(values);
      const result = await testApi({ config: payload.config, type: values.type });
      setTestResult(result);
      if (result.success) message.success('连接测试成功');
    } catch (requestError) {
      message.error(requestError instanceof Error ? requestError.message : '连接测试失败');
    } finally {
      setTesting(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const payload = parsePayload(await form.validateFields());
      if (editing) await updateApi(editing.id, payload);
      else await createApi(payload);
      message.success(editing ? '更新成功' : '创建成功');
      closeEditor();
      setTableParams((previous) => ({ ...previous }));
    } catch (requestError) {
      message.error(requestError instanceof Error ? requestError.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function testExisting(item: DataSource) {
    const result = await testByIdApi(item.id);
    if (result.success) message.success(result.message || '连接测试成功');
    else message.error(result.message || '连接测试失败');
    setTableParams((previous) => ({ ...previous }));
  }

  async function deleteItem(item: DataSource) {
    await deleteApi(item.id);
    message.success('删除成功');
    setTableParams((previous) => ({ ...previous }));
  }

  const columns: TableColumnsType<DataSource> = [
    { dataIndex: 'name', render: (name: string, item) => <Button type="link" onClick={() => navigate(`/workflow/${kind}/${item.id}`)}>{name}</Button>, title: `${label}名称`, width: 220 },
    { dataIndex: 'type', title: '类型', width: 130 },
    { dataIndex: 'status', render: (status: DataSource['status']) => <Tag color={statusMap[status].color}>{statusMap[status].label}</Tag>, title: '连接状态', width: 120 },
    { dataIndex: 'usage_count', render: (count?: number) => count ?? 0, title: '引用数据流', width: 110 },
    { dataIndex: 'description', render: (value?: string) => value || '-', title: '描述', width: 260 },
    { dataIndex: 'updated_at', title: '更新时间', width: 180 },
    { fixed: 'right', key: 'actions', render: (_, item) => <Space onClick={(event) => event.stopPropagation()}><Button icon={<RefreshCw size={14} />} title="测试连接" type="link" onClick={() => void testExisting(item)} /><Button icon={<Edit3 size={14} />} title="编辑" type="link" onClick={() => openEdit(item)} /><Popconfirm okText="删除" title={`确认删除该${label}？`} onConfirm={() => void deleteItem(item)}><Button danger icon={<Trash2 size={14} />} title="删除" type="link" /></Popconfirm></Space>, title: '操作', width: 130 }
  ];

  const cards = rows.map((item) => <Card hoverable key={item.id} onClick={() => navigate(`/workflow/${kind}/${item.id}`)} style={{ cursor: 'pointer' }}><Space direction="vertical" size={12} style={{ width: '100%' }}><Space style={{ justifyContent: 'space-between', width: '100%' }}><Space><span style={{ alignItems: 'center', background: '#edf2ff', borderRadius: 7, color: '#4b75ff', display: 'inline-flex', height: 32, justifyContent: 'center', width: 32 }}>{kind === 'data-source' ? <Database size={17} /> : <Server size={17} />}</span><b>{item.type}</b></Space><Tag color={statusMap[item.status].color}>{statusMap[item.status].label}</Tag></Space><strong>{item.name}</strong><span className="console-page-muted">{item.description || '暂无描述'}</span><Space style={{ justifyContent: 'space-between', width: '100%' }}><span className="console-page-muted">已被 {item.usage_count ?? 0} 个数据流使用</span><Space onClick={(event) => event.stopPropagation()}><Button size="small" type="link" onClick={() => openEdit(item)}>编辑</Button><Popconfirm okText="删除" title={`确认删除该${label}？`} onConfirm={() => void deleteItem(item)}><Button danger size="small" type="link">删除</Button></Popconfirm></Space></Space></Space></Card>);

  return <ConsolePage actions={<Button icon={<Plus size={15} />} type="primary" onClick={openCreate}>新增{label}</Button>} description={`配置并管理可被数据流引用的${label}连接。`} title={`${label}管理`}><Card className="console-page-card"><div className="console-page-toolbar"><Input allowClear defaultValue={tableParams.keyword} placeholder="搜索别名/地址" prefix={<Search size={15} />} style={{ width: 220 }} onPressEnter={(event) => setTableParams((previous) => ({ ...previous, keyword: event.currentTarget.value.trim(), page: 1 }))} /><Input allowClear defaultValue={tableParams.type} placeholder="数据源类型" style={{ width: 150 }} onPressEnter={(event) => setTableParams((previous) => ({ ...previous, page: 1, type: event.currentTarget.value.trim() || undefined }))} /><Input allowClear defaultValue={tableParams.status} placeholder="连接状态" style={{ width: 130 }} onPressEnter={(event) => setTableParams((previous) => ({ ...previous, page: 1, status: event.currentTarget.value.trim() || undefined }))} /><Button type="primary" onClick={() => setTableParams((previous) => ({ ...previous, page: 1 }))}>搜索</Button><Button onClick={() => setTableParams({ keyword: '', page: 1, page_size: 20 })}>重置</Button><span className="console-page-toolbar-spacer" /><Segmented options={[{ label: '卡片', value: 'card' }, { label: '列表', value: 'list' }]} value={viewMode} onChange={(value) => setViewMode(value as 'card' | 'list')} /></div><AsyncState empty={!rows.length} error={error} loading={loading} onRetry={() => void loadData(tableParams)}>{viewMode === 'card' ? <><div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>{cards}</div><div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}><Button disabled={tableParams.page <= 1} onClick={() => setTableParams((previous) => ({ ...previous, page: previous.page - 1 }))}>上一页</Button><span style={{ padding: '6px 12px' }}>第 {tableParams.page} 页</span><Button disabled={tableParams.page * tableParams.page_size >= total} onClick={() => setTableParams((previous) => ({ ...previous, page: previous.page + 1 }))}>下一页</Button></div></> : <DataTable columns={columns} dataSource={rows} pagination={{ current: tableParams.page, onChange: (page, page_size) => setTableParams((previous) => ({ ...previous, page, page_size })), pageSize: tableParams.page_size, total }} rowKey="id" />}</AsyncState></Card><Modal destroyOnHidden okText="保存" open={editorOpen} title={editing ? `编辑${label}` : `新增${label}`} confirmLoading={saving} width={680} onCancel={closeEditor} onOk={() => void save()}><Form form={form} layout="vertical"><Form.Item label={`${label}别名`} name="name" rules={[{ required: true, message: `请输入${label}别名` }]}><Input /></Form.Item><Form.Item label="类型" name="type" rules={[{ required: true, message: '请选择类型' }]}><Segmented options={defaultTypes(kind)} /></Form.Item><Form.Item label="描述" name="description"><Input.TextArea rows={2} /></Form.Item><Form.Item label="连接配置（JSON）" name="config" rules={[{ required: true, message: '请输入连接配置' }]}><Input.TextArea autoSize={{ minRows: 8, maxRows: 14 }} /></Form.Item>{testResult ? <Alert message={testResult.success ? '连接成功' : '连接失败'} description={testResult.message} showIcon type={testResult.success ? 'success' : 'error'} /> : null}<Button loading={testing} onClick={() => void testConnection()}>测试连接</Button></Form></Modal></ConsolePage>;
}

function ResourceDetailPage({ kind }: { kind: ResourceKind }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const resourceId = Number(id);
  const [resource, setResource] = useState<DataSource | null>(null);
  const [flows, setFlows] = useState<DataFlow[]>([]);
  const [logs, setLogs] = useState<Array<{ id: number; response_time_ms: number; status: string; tested_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const detailApi = kind === 'data-source' ? getDataSourceDetailApi : getAssetRepoDetailApi;
  const label = resourceLabel(kind);

  const load = useCallback(async () => {
    if (!Number.isSafeInteger(resourceId)) return;
    setLoading(true);
    setError(undefined);
    try {
      const detail = await detailApi(resourceId);
      setResource(detail);
      if (kind === 'data-source') {
        const [relatedFlows, logPage] = await Promise.all([getDataSourceRelatedFlowsApi(resourceId), getDataSourceConnectionLogsApi(resourceId, { page: 1, page_size: 20 })]);
        setFlows(relatedFlows);
        setLogs(logPage.list);
      }
    } catch (requestError) { setError(requestError); } finally { setLoading(false); }
  }, [detailApi, kind, resourceId]);

  useEffect(() => { void load(); }, [load]);
  if (!Number.isSafeInteger(resourceId)) return <Empty description="无效的资源 ID" />;
  return <ConsolePage actions={<Button icon={<ArrowLeft size={15} />} onClick={() => navigate(`/workflow/${kind}`)}>返回列表</Button>} title={`${label}详情`}><AsyncState error={error} loading={loading} onRetry={() => void load()}>{resource ? <><Card className="console-page-card" style={{ marginBottom: 16 }}><Descriptions bordered column={2} size="small"><Descriptions.Item label="名称">{resource.name}</Descriptions.Item><Descriptions.Item label="类型">{resource.type}</Descriptions.Item><Descriptions.Item label="状态"><Tag color={statusMap[resource.status].color}>{statusMap[resource.status].label}</Tag></Descriptions.Item><Descriptions.Item label="引用数据流">{resource.usage_count ?? 0}</Descriptions.Item><Descriptions.Item label="描述" span={2}>{resource.description || '-'}</Descriptions.Item><Descriptions.Item label="创建时间">{resource.created_at}</Descriptions.Item><Descriptions.Item label="更新时间">{resource.updated_at}</Descriptions.Item></Descriptions></Card><Card className="console-page-card"><Tabs items={[{ key: 'config', label: '连接配置', children: <pre className="console-page-code">{parseConfig(resource.config)}</pre> }, { key: 'flows', label: `关联数据流 (${flows.length})`, children: flows.length ? <Table columns={[{ dataIndex: 'name', title: '数据流名称' }, { dataIndex: 'status', title: '状态' }, { dataIndex: 'updated_at', title: '更新时间' }]} dataSource={flows} pagination={false} rowKey="id" /> : <Empty description="暂无关联数据流" /> }, { key: 'logs', label: '连接日志', children: logs.length ? <Table columns={[{ dataIndex: 'tested_at', title: '测试时间' }, { dataIndex: 'status', title: '结果', render: (status) => <Tag color={status === 'connected' ? 'success' : 'error'}>{status === 'connected' ? '成功' : '失败'}</Tag> }, { dataIndex: 'response_time_ms', title: '响应时间', render: (value) => `${value}ms` }]} dataSource={logs} pagination={false} rowKey="id" /> : <Empty description="暂无连接日志" /> }]} /></Card></> : null}</AsyncState></ConsolePage>;
}

export function WorkflowDataSourcePage() { return <ResourceListPage kind="data-source" />; }
export function WorkflowDataSourceDetailPage() { return <ResourceDetailPage kind="data-source" />; }
export function WorkflowAssetRepoPage() { return <ResourceListPage kind="asset-repo" />; }
export function WorkflowAssetRepoDetailPage() { return <ResourceDetailPage kind="asset-repo" />; }
