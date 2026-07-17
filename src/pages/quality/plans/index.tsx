import { Button, Drawer, Form, Input, Modal, Select, Space, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { Play, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AsyncState } from '@/components/AsyncState';
import { ConfirmAction } from '@/components/ConfirmAction';
import { DataTable } from '@/components/DataTable';
import { ConsolePage } from '@/pages/shared/page';
import { createQualityPlanApi, deleteQualityPlanApi, getQualityPlanListApi, publishQualityPlanApi, reviseQualityPlanApi, runQualityPlanApi, updateQualityPlanApi } from '@/services/quality';
import type { QualityPlan, QualityPlanPayload } from '@/types/quality';

type TableParams = { keyword: string; page: number; page_size: number; status?: string };

export function QualityPlansPage() {
  const [tableParams, setTableParams] = useState<TableParams>({ keyword: '', page: 1, page_size: 20 });
  const [rows, setRows] = useState<QualityPlan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [editingItem, setEditingItem] = useState<QualityPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [form] = Form.useForm<QualityPlanPayload>();
  const sequence = useRef(0);

  const loadData = useCallback(async (params: TableParams) => {
    const current = ++sequence.current;
    setLoading(true);
    setError(undefined);
    try {
      const result = await getQualityPlanListApi(params);
      if (current === sequence.current) { setRows(result.list); setTotal(result.total); }
    } catch (requestError) {
      if (current === sequence.current) setError(requestError);
    } finally { if (current === sequence.current) setLoading(false); }
  }, []);

  useEffect(() => { void loadData(tableParams); return () => { sequence.current += 1; }; }, [loadData, tableParams]);

  function openCreate() {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ rules: [] });
    setModalOpen(true);
  }

  function openEdit(item: QualityPlan) {
    setEditingItem(item);
    form.setFieldsValue({ asset_id: item.asset_id, description: item.description, name: item.name, owner: item.owner, rules: item.rules ?? [], strategy: item.strategy });
    setModalOpen(true);
  }

  async function submit() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editingItem) { await updateQualityPlanApi(editingItem.id, values); message.success('质检方案已更新'); }
      else { await createQualityPlanApi(values); message.success('质检方案已创建'); }
      setModalOpen(false);
      setTableParams((previous) => ({ ...previous, page: 1 }));
    } finally { setSaving(false); }
  }

  async function action(callback: () => Promise<unknown>, success: string) {
    await callback();
    message.success(success);
    setTableParams((previous) => ({ ...previous }));
  }

  const columns: TableColumnsType<QualityPlan> = [
    { dataIndex: 'name', title: '方案名称', width: 200, render: (_, item) => <Button type="link" onClick={() => { setEditingItem(item); setDetailsOpen(true); }}>{item.name}</Button> },
    { dataIndex: 'asset_name', title: '目标资产', width: 180 },
    { dataIndex: 'owner', title: '负责人', width: 120 },
    { dataIndex: 'current_version', title: '当前版本', width: 100 },
    { dataIndex: 'rules', title: '规则数', width: 90, render: (rules?: QualityPlan['rules']) => rules?.length ?? 0 },
    { dataIndex: 'status', title: '状态', width: 100, render: (status: string) => <Tag color={status === 'active' ? 'success' : status === 'draft' ? 'gold' : 'default'}>{status}</Tag> },
    { dataIndex: 'updated_at', title: '更新时间', width: 170 },
    {
      fixed: 'right', key: 'actions', title: '操作', width: 270, render: (_, item) => (
        <Space size={1}>
          <Button type="link" onClick={() => openEdit(item)}>编辑</Button>
          <Button icon={<Play size={14} />} type="link" onClick={() => void action(() => runQualityPlanApi(item.id, { idempotency_key: `manual:${item.id}:${Date.now()}` }), '已发起质检运行')}>运行</Button>
          {item.status === 'draft' ? <Button type="link" onClick={() => void action(() => publishQualityPlanApi(item.id), '方案已发布')}>发布</Button> : <Button type="link" onClick={() => void action(() => reviseQualityPlanApi(item.id), '已创建修订草稿')}>修订</Button>}
          <ConfirmAction title="确认删除此质检方案？" onConfirm={() => void action(() => deleteQualityPlanApi(item.id), '质检方案已删除')}><Button danger icon={<Trash2 size={14} />} type="link">删除</Button></ConfirmAction>
        </Space>
      )
    }
  ];

  return (
    <ConsolePage actions={<Button icon={<Plus size={16} />} type="primary" onClick={openCreate}>新建方案</Button>} description="组合质量规则并发布为可重复执行的质检方案。" title="质检方案">
      <div className="console-page-toolbar">
        <Input allowClear prefix={<Search size={16} />} placeholder="搜索方案名称" style={{ width: 260 }} onPressEnter={(event) => setTableParams((previous) => ({ ...previous, keyword: event.currentTarget.value.trim(), page: 1 }))} />
        <Select allowClear options={['draft', 'active', 'inactive', 'archived'].map((value) => ({ label: value, value }))} placeholder="状态" style={{ width: 130 }} onChange={(status) => setTableParams((previous) => ({ ...previous, page: 1, status }))} />
        <Button onClick={() => setTableParams({ keyword: '', page: 1, page_size: 20 })}>重置</Button>
      </div>
      <AsyncState error={error} loading={loading} onRetry={() => void loadData(tableParams)}><DataTable columns={columns} dataSource={rows} pagination={{ current: tableParams.page, pageSize: tableParams.page_size, total, onChange: (page, page_size) => setTableParams((previous) => ({ ...previous, page, page_size })) }} rowKey="id" /></AsyncState>
      <Modal destroyOnHidden okButtonProps={{ loading: saving }} open={modalOpen} title={editingItem ? '编辑质检方案' : '新建质检方案'} onCancel={() => { setModalOpen(false); form.resetFields(); }} onOk={() => void submit()}>
        <Form form={form} layout="vertical">
          <Form.Item label="方案名称" name="name" rules={[{ required: true, message: '请输入方案名称' }]}><Input /></Form.Item>
          <Form.Item label="目标资产 ID" name="asset_id" rules={[{ required: true, message: '请输入资产 ID' }]}><Input type="number" /></Form.Item>
          <Form.Item label="负责人" name="owner"><Input /></Form.Item>
          <Form.Item label="说明" name="description"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
      <Drawer open={detailsOpen} title={`${editingItem?.name ?? ''} · 方案详情`} width={520} onClose={() => setDetailsOpen(false)}>
        {editingItem ? <><p className="console-page-muted">{editingItem.description || '暂无说明'}</p><DataTable columns={[{ dataIndex: 'rule_name', title: '规则名称' }, { dataIndex: 'field_name', title: '字段' }, { dataIndex: 'severity', title: '级别' }]} dataSource={editingItem.rules ?? []} pagination={false} rowKey={(item) => item.id ?? item.rule_id} /></> : null}
      </Drawer>
    </ConsolePage>
  );
}
