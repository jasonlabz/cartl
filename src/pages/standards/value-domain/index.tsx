import { Button, Drawer, Form, Input, Modal, Select, Space, Table, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { Edit3, Eye, FileClock, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AsyncState } from '@/components/AsyncState';
import { ConfirmAction } from '@/components/ConfirmAction';
import { DataTable } from '@/components/DataTable';
import { ConsolePage } from '@/pages/shared/page';
import {
  createValueDomainApi,
  deleteValueDomainApi,
  getValueDomainListApi,
  getValueDomainVersionsApi,
  updateValueDomainApi
} from '@/services/standards';
import type { ValueDomain, ValueDomainPayload, VersionInfo } from '@/types/standards';

type TableParams = { keyword: string; page: number; page_size: number; status?: string };

export function ValueDomainPage() {
  const [tableParams, setTableParams] = useState<TableParams>({ keyword: '', page: 1, page_size: 20 });
  const [rows, setRows] = useState<ValueDomain[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [editingItem, setEditingItem] = useState<ValueDomain | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [versionsTitle, setVersionsTitle] = useState('');
  const [form] = Form.useForm<ValueDomainPayload>();
  const sequence = useRef(0);
  const navigate = useNavigate();

  const loadData = useCallback(async (params: TableParams) => {
    const current = ++sequence.current;
    setLoading(true);
    setError(undefined);
    try {
      const result = await getValueDomainListApi(params);
      if (current === sequence.current) {
        setRows(result.list);
        setTotal(result.total);
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

  function openCreate() {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(item: ValueDomain) {
    setEditingItem(item);
    form.setFieldsValue({ category: item.category, description: item.description, name: item.name, source: item.source });
    setModalOpen(true);
  }

  async function submit() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editingItem) {
        await updateValueDomainApi(editingItem.id, values);
        message.success('值域标准已更新');
      } else {
        await createValueDomainApi(values);
        message.success('值域标准已创建');
      }
      setModalOpen(false);
      setTableParams((previous) => ({ ...previous, page: 1 }));
    } finally {
      setSaving(false);
    }
  }

  async function openVersions(item: ValueDomain) {
    setVersionsTitle(item.name);
    setVersionsOpen(true);
    setVersions(await getValueDomainVersionsApi(item.id));
  }

  const columns: TableColumnsType<ValueDomain> = [
    {
      dataIndex: 'name',
      title: '规范名称',
      width: 240,
      render: (_, item) => <Button type="link" onClick={() => navigate(`/standards/value-domain/${item.id}`)}>{item.name}</Button>
    },
    { dataIndex: 'description', ellipsis: true, title: '说明' },
    { dataIndex: 'source', title: '来源', width: 120, render: (value: string) => value ? <Tag color="blue">{value}</Tag> : '-' },
    { dataIndex: 'category', title: '分类', width: 130, render: (value: string) => value ? <Tag color="purple">{value}</Tag> : '-' },
    { dataIndex: 'version_count', title: '版本数', width: 90 },
    {
      dataIndex: 'latest_version',
      title: '最新版本',
      width: 150,
      render: (version?: ValueDomain['latest_version']) => version ? <Tag color={version.status === 'published' ? 'success' : 'gold'}>{version.version_number} · {version.status === 'published' ? '已发布' : '草稿'}</Tag> : '-'
    },
    { dataIndex: 'updated_at', title: '更新时间', width: 170 },
    {
      fixed: 'right',
      key: 'actions',
      title: '操作',
      width: 220,
      render: (_, item) => (
        <Space size={2}>
          <Button icon={<Eye size={14} />} type="link" onClick={() => navigate(`/standards/value-domain/${item.id}`)}>详情</Button>
          <Button icon={<FileClock size={14} />} type="link" onClick={() => void openVersions(item)}>版本</Button>
          <Button icon={<Edit3 size={14} />} type="link" onClick={() => openEdit(item)}>编辑</Button>
          <ConfirmAction title="确认删除此值域标准？" onConfirm={async () => { await deleteValueDomainApi(item.id); message.success('值域标准已删除'); setTableParams((previous) => ({ ...previous })); }}><Button danger icon={<Trash2 size={14} />} type="link">删除</Button></ConfirmAction>
        </Space>
      )
    }
  ];

  return (
    <ConsolePage actions={<Button icon={<Plus size={16} />} type="primary" onClick={openCreate}>新建值域</Button>} description="维护业务代码、枚举和值域规范的生命周期。" title="值域标准">
      <div className="console-page-toolbar">
        <Input allowClear prefix={<Search size={16} />} placeholder="搜索规范名称" style={{ width: 260 }} onPressEnter={(event) => setTableParams((previous) => ({ ...previous, keyword: event.currentTarget.value.trim(), page: 1 }))} />
        <Select allowClear options={[{ label: '草稿', value: 'draft' }, { label: '已发布', value: 'published' }]} placeholder="版本状态" style={{ width: 130 }} onChange={(status) => setTableParams((previous) => ({ ...previous, page: 1, status }))} />
        <Button onClick={() => setTableParams({ keyword: '', page: 1, page_size: 20 })}>重置</Button>
      </div>
      <AsyncState error={error} loading={loading} onRetry={() => void loadData(tableParams)}>
        <DataTable columns={columns} dataSource={rows} pagination={{ current: tableParams.page, pageSize: tableParams.page_size, total, onChange: (page, page_size) => setTableParams((previous) => ({ ...previous, page, page_size })) }} rowKey="id" />
      </AsyncState>
      <Modal destroyOnHidden okButtonProps={{ loading: saving }} open={modalOpen} title={editingItem ? '编辑值域标准' : '新建值域标准'} onCancel={() => { setModalOpen(false); form.resetFields(); }} onOk={() => void submit()}>
        <Form form={form} layout="vertical">
          <Form.Item label="规范名称" name="name" rules={[{ required: true, message: '请输入规范名称' }]}><Input /></Form.Item>
          <Form.Item label="说明" name="description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="来源" name="source"><Input placeholder="如：国家标准、行业规范" /></Form.Item>
          <Form.Item label="分类" name="category"><Input /></Form.Item>
        </Form>
      </Modal>
      <Drawer open={versionsOpen} title={`${versionsTitle} · 版本历史`} width={540} onClose={() => setVersionsOpen(false)}>
        <Table<VersionInfo> columns={[{ dataIndex: 'version_number', title: '版本' }, { dataIndex: 'status', title: '状态', render: (status: string) => <Tag color={status === 'published' ? 'success' : 'gold'}>{status}</Tag> }, { dataIndex: 'created_at', title: '创建时间' }]} dataSource={versions} pagination={false} rowKey="id" />
      </Drawer>
    </ConsolePage>
  );
}
