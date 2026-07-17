import { Button, Form, Input, Modal, Select, Space, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ConfirmAction } from '@/components/ConfirmAction';
import { DataTable } from '@/components/DataTable';
import { AsyncState } from '@/components/AsyncState';
import { ConsolePage } from '@/pages/shared/page';
import {
  createOrganizationApi,
  deleteOrganizationApi,
  getOrganizationListApi,
  toggleOrganizationStatusApi,
  updateOrganizationApi
} from '@/services/standards';
import type { Organization, OrganizationPayload } from '@/types/standards';

type TableParams = { keyword: string; page: number; page_size: number; status?: string; type?: string };

export function OrganizationPage() {
  const [tableParams, setTableParams] = useState<TableParams>({ keyword: '', page: 1, page_size: 20 });
  const [rows, setRows] = useState<Organization[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<OrganizationPayload>();
  const sequence = useRef(0);

  const loadData = useCallback(async (params: TableParams) => {
    const current = ++sequence.current;
    setLoading(true);
    setError(undefined);
    try {
      const result = await getOrganizationListApi(params);
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
    form.setFieldsValue({ level: 1, status: 'active', type: 'department' });
    setModalOpen(true);
  }

  function openEdit(item: Organization) {
    setEditingItem(item);
    form.setFieldsValue({
      code: item.code,
      level: item.level,
      name: item.name,
      parent_id: item.parent_id,
      remark: item.remark,
      status: item.status,
      type: item.type
    });
    setModalOpen(true);
  }

  async function submit() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editingItem) {
        await updateOrganizationApi(editingItem.id, values);
        message.success('组织机构已更新');
      } else {
        await createOrganizationApi(values);
        message.success('组织机构已创建');
      }
      setModalOpen(false);
      setTableParams((previous) => ({ ...previous, page: 1 }));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    await deleteOrganizationApi(id);
    message.success('组织机构已删除');
    setTableParams((previous) => ({ ...previous }));
  }

  async function toggle(item: Organization) {
    const status = item.status === 'active' ? 'inactive' : 'active';
    await toggleOrganizationStatusApi(item.id, status);
    message.success(status === 'active' ? '已启用' : '已停用');
    setTableParams((previous) => ({ ...previous }));
  }

  const columns: TableColumnsType<Organization> = [
    { dataIndex: 'code', title: '机构编码', width: 140 },
    { dataIndex: 'name', title: '机构名称', width: 180 },
    { dataIndex: 'type', title: '类型', render: (value: string) => <Tag>{value || '-'}</Tag>, width: 120 },
    { dataIndex: 'parent_name', title: '上级机构', width: 160 },
    { dataIndex: 'level', title: '层级', width: 90 },
    { dataIndex: 'remark', ellipsis: true, title: '说明' },
    {
      dataIndex: 'status',
      title: '状态',
      render: (value: string) => <Tag color={value === 'active' ? 'success' : 'default'}>{value === 'active' ? '启用' : '停用'}</Tag>,
      width: 96
    },
    {
      fixed: 'right',
      key: 'actions',
      title: '操作',
      width: 190,
      render: (_, item) => (
        <Space size={4}>
          <Button type="link" onClick={() => openEdit(item)}>编辑</Button>
          <Button type="link" onClick={() => void toggle(item)}>{item.status === 'active' ? '停用' : '启用'}</Button>
          <ConfirmAction title="确认删除此组织机构？" onConfirm={() => void remove(item.id)}><Button danger icon={<Trash2 size={14} />} type="link">删除</Button></ConfirmAction>
        </Space>
      )
    }
  ];

  return (
    <ConsolePage actions={<Button icon={<Plus size={16} />} type="primary" onClick={openCreate}>新建机构</Button>} description="维护数据治理组织、部门和责任归属。" title="组织机构">
      <div className="console-page-toolbar">
        <Input
          allowClear
          prefix={<Search size={16} />}
          placeholder="搜索机构名称或编码"
          style={{ width: 260 }}
          onPressEnter={(event) => setTableParams((previous) => ({ ...previous, keyword: event.currentTarget.value.trim(), page: 1 }))}
        />
        <Select allowClear options={[{ label: '启用', value: 'active' }, { label: '停用', value: 'inactive' }]} placeholder="状态" style={{ width: 120 }} onChange={(status) => setTableParams((previous) => ({ ...previous, page: 1, status }))} />
        <Button onClick={() => setTableParams((previous) => ({ ...previous, keyword: '', page: 1, status: undefined, type: undefined }))}>重置</Button>
      </div>
      <AsyncState error={error} loading={loading} onRetry={() => void loadData(tableParams)}>
        <DataTable
          columns={columns}
          dataSource={rows}
          pagination={{
            current: tableParams.page,
            pageSize: tableParams.page_size,
            total,
            onChange: (page, page_size) => setTableParams((previous) => ({ ...previous, page, page_size }))
          }}
          rowKey="id"
        />
      </AsyncState>
      <Modal
        destroyOnHidden
        okButtonProps={{ loading: saving }}
        open={modalOpen}
        title={editingItem ? '编辑组织机构' : '新建组织机构'}
        onCancel={() => { setModalOpen(false); setEditingItem(null); form.resetFields(); }}
        onOk={() => void submit()}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="机构名称" name="name" rules={[{ required: true, message: '请输入机构名称' }]}><Input /></Form.Item>
          <Form.Item label="机构编码" name="code" rules={[{ required: true, message: '请输入机构编码' }]}><Input /></Form.Item>
          <Form.Item label="类型" name="type" rules={[{ required: true, message: '请选择机构类型' }]}><Select options={[{ label: '部门', value: 'department' }, { label: '组织', value: 'organization' }, { label: '团队', value: 'team' }]} /></Form.Item>
          <Form.Item label="层级" name="level"><Input type="number" /></Form.Item>
          <Form.Item label="说明" name="remark"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
    </ConsolePage>
  );
}
