import { Button, Drawer, Form, Input, Modal, Select, Space, Tag, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { FlaskConical, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AsyncState } from '@/components/AsyncState';
import { ConfirmAction } from '@/components/ConfirmAction';
import { DataTable } from '@/components/DataTable';
import { ConsolePage } from '@/pages/shared/page';
import { createQualityRuleApi, deleteQualityRuleApi, getQualityRuleListApi, testQualityRuleApi, updateQualityRuleApi } from '@/services/quality';
import type { QualityRule, QualityRulePayload } from '@/types/quality';

type TableParams = { dimension?: string; keyword: string; page: number; page_size: number; status?: string };

const dimensions = [
  ['completeness', '完整性'], ['accuracy', '准确性'], ['consistency', '一致性'], ['uniqueness', '唯一性'], ['timeliness', '及时性'], ['validity', '有效性']
].map(([value, label]) => ({ label, value }));

export function QualityRulesPage() {
  const [tableParams, setTableParams] = useState<TableParams>({ keyword: '', page: 1, page_size: 20 });
  const [rows, setRows] = useState<QualityRule[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [editingItem, setEditingItem] = useState<QualityRule | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<QualityRulePayload>();
  const [testForm] = Form.useForm<{ asset_id: number; field_name?: string }>();
  const sequence = useRef(0);

  const loadData = useCallback(async (params: TableParams) => {
    const current = ++sequence.current;
    setLoading(true);
    setError(undefined);
    try {
      const result = await getQualityRuleListApi(params);
      if (current === sequence.current) { setRows(result.list); setTotal(result.total); }
    } catch (requestError) {
      if (current === sequence.current) setError(requestError);
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(tableParams); return () => { sequence.current += 1; }; }, [loadData, tableParams]);

  function openCreate() {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ dimension: 'completeness', level: 'field', operation: 'not_null', rule_type: 'custom' });
    setModalOpen(true);
  }

  function openEdit(item: QualityRule) {
    setEditingItem(item);
    form.setFieldsValue({ code: item.code, default_parameters: item.default_parameters, description: item.description, dimension: item.dimension, level: item.level, name: item.name, operation: item.operation, parameter_schema: item.parameter_schema, rule_type: item.rule_type });
    setModalOpen(true);
  }

  async function submit() {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editingItem) { await updateQualityRuleApi(editingItem.id, values); message.success('质量规则已更新'); }
      else { await createQualityRuleApi(values); message.success('质量规则已创建'); }
      setModalOpen(false);
      setTableParams((previous) => ({ ...previous, page: 1 }));
    } finally { setSaving(false); }
  }

  const columns: TableColumnsType<QualityRule> = [
    { dataIndex: 'name', title: '规则名称', width: 200 },
    { dataIndex: 'code', title: '规则编码', width: 150 },
    { dataIndex: 'dimension', title: '质量维度', width: 115, render: (value: string) => <Tag color="blue">{dimensions.find((item) => item.value === value)?.label ?? value}</Tag> },
    { dataIndex: 'level', title: '校验级别', width: 100, render: (value: string) => value === 'field' ? '字段' : '表' },
    { dataIndex: 'operation', title: '操作符', width: 120 },
    { dataIndex: 'status', title: '状态', width: 90, render: (value: string) => <Tag color={value === 'active' ? 'success' : 'default'}>{value === 'active' ? '启用' : '停用'}</Tag> },
    { dataIndex: 'updated_at', title: '更新时间', width: 170 },
    {
      fixed: 'right', key: 'actions', title: '操作', width: 210, render: (_, item) => (
        <Space size={2}>
          <Button type="link" onClick={() => openEdit(item)}>编辑</Button>
          <Button icon={<FlaskConical size={14} />} type="link" onClick={() => { setEditingItem(item); testForm.resetFields(); setTestResult(null); setTestOpen(true); }}>测试</Button>
          <ConfirmAction title="确认删除此质量规则？" onConfirm={async () => { await deleteQualityRuleApi(item.id); message.success('质量规则已删除'); setTableParams((previous) => ({ ...previous })); }}><Button danger icon={<Trash2 size={14} />} type="link">删除</Button></ConfirmAction>
        </Space>
      )
    }
  ];

  return (
    <ConsolePage actions={<Button icon={<Plus size={16} />} type="primary" onClick={openCreate}>新建规则</Button>} description="配置数据完整性、准确性、一致性等自动化质量校验。" title="质量规则">
      <div className="console-page-toolbar">
        <Input allowClear prefix={<Search size={16} />} placeholder="搜索规则名称或编码" style={{ width: 260 }} onPressEnter={(event) => setTableParams((previous) => ({ ...previous, keyword: event.currentTarget.value.trim(), page: 1 }))} />
        <Select allowClear options={dimensions} placeholder="质量维度" style={{ width: 130 }} onChange={(dimension) => setTableParams((previous) => ({ ...previous, dimension, page: 1 }))} />
        <Select allowClear options={[{ label: '启用', value: 'active' }, { label: '停用', value: 'inactive' }]} placeholder="状态" style={{ width: 110 }} onChange={(status) => setTableParams((previous) => ({ ...previous, page: 1, status }))} />
        <Button onClick={() => setTableParams({ keyword: '', page: 1, page_size: 20 })}>重置</Button>
      </div>
      <AsyncState error={error} loading={loading} onRetry={() => void loadData(tableParams)}><DataTable columns={columns} dataSource={rows} pagination={{ current: tableParams.page, pageSize: tableParams.page_size, total, onChange: (page, page_size) => setTableParams((previous) => ({ ...previous, page, page_size })) }} rowKey="id" /></AsyncState>
      <Modal destroyOnHidden okButtonProps={{ loading: saving }} open={modalOpen} title={editingItem ? '编辑质量规则' : '新建质量规则'} onCancel={() => { setModalOpen(false); form.resetFields(); }} onOk={() => void submit()}>
        <Form form={form} layout="vertical">
          <Form.Item label="规则名称" name="name" rules={[{ required: true, message: '请输入规则名称' }]}><Input /></Form.Item>
          <Form.Item label="规则编码" name="code" rules={[{ required: true, message: '请输入规则编码' }]}><Input /></Form.Item>
          <Form.Item label="质量维度" name="dimension" rules={[{ required: true, message: '请选择质量维度' }]}><Select options={dimensions} /></Form.Item>
          <Form.Item label="校验级别" name="level"><Select options={[{ label: '字段', value: 'field' }, { label: '表', value: 'table' }]} /></Form.Item>
          <Form.Item label="操作符" name="operation"><Input placeholder="如：not_null、unique、regex" /></Form.Item>
          <Form.Item label="说明" name="description"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
      <Drawer open={testOpen} title={`${editingItem?.name ?? ''} · 规则测试`} width={480} onClose={() => setTestOpen(false)}>
        <Form form={testForm} layout="vertical" onFinish={async (values) => { if (!editingItem) return; setTestResult(await testQualityRuleApi(editingItem.id, values)); }}>
          <Form.Item label="资产 ID" name="asset_id" rules={[{ required: true, message: '请输入资产 ID' }]}><Input type="number" /></Form.Item>
          <Form.Item label="字段名（字段规则可填）" name="field_name"><Input /></Form.Item>
          <Button htmlType="submit" type="primary">执行测试</Button>
        </Form>
        {testResult ? <pre className="console-page-code" style={{ marginTop: 16 }}>{JSON.stringify(testResult, null, 2)}</pre> : null}
      </Drawer>
    </ConsolePage>
  );
}
