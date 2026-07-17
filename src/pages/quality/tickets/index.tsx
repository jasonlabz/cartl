import { Button, Drawer, Form, Input, Modal, Select, Space, Tag, Timeline, message } from 'antd';
import type { TableColumnsType } from 'antd';
import { CheckCircle2, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AsyncState } from '@/components/AsyncState';
import { DataTable } from '@/components/DataTable';
import { ConsolePage } from '@/pages/shared/page';
import { getQualityTicketApi, getQualityTicketListApi, updateQualityTicketActionApi } from '@/services/quality';
import type { QualityTicket, QualityTicketDetail } from '@/types/quality';

type TableParams = { page: number; page_size: number; severity?: string; status?: string };

const statusLabels: Record<string, string> = { ignored: '已忽略', pending: '待处理', processing: '处理中', reopened: '已重开', resolved: '已解决', verified: '已验证' };
const severityColors: Record<string, string> = { critical: 'error', major: 'warning', minor: 'default' };

export function QualityTicketsPage() {
  const [tableParams, setTableParams] = useState<TableParams>({ page: 1, page_size: 20 });
  const [rows, setRows] = useState<QualityTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [detail, setDetail] = useState<QualityTicketDetail | null>(null);
  const [actionTicket, setActionTicket] = useState<QualityTicket | null>(null);
  const [action, setAction] = useState<'ignore' | 'resolve'>('resolve');
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<{ comment?: string; ignore_until?: string }>();
  const sequence = useRef(0);

  const loadData = useCallback(async (params: TableParams) => {
    const current = ++sequence.current;
    setLoading(true);
    setError(undefined);
    try {
      const result = await getQualityTicketListApi(params);
      if (current === sequence.current) { setRows(result.list); setTotal(result.total); }
    } catch (requestError) { if (current === sequence.current) setError(requestError); }
    finally { if (current === sequence.current) setLoading(false); }
  }, []);

  useEffect(() => { void loadData(tableParams); return () => { sequence.current += 1; }; }, [loadData, tableParams]);

  async function quickAction(ticket: QualityTicket, nextAction: 'accept' | 'reopen') {
    await updateQualityTicketActionApi(ticket.id, { action: nextAction });
    message.success('操作成功');
    setTableParams((previous) => ({ ...previous }));
  }

  async function submitAction() {
    if (!actionTicket) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      await updateQualityTicketActionApi(actionTicket.id, { action, ...values });
      message.success('操作成功');
      setActionTicket(null);
      setDetail(null);
      setTableParams((previous) => ({ ...previous }));
    } finally { setSaving(false); }
  }

  function openAction(ticket: QualityTicket, nextAction: 'ignore' | 'resolve') {
    setActionTicket(ticket);
    setAction(nextAction);
    form.resetFields();
  }

  const columns: TableColumnsType<QualityTicket> = [
    { dataIndex: 'id', title: 'ID', width: 75 }, { dataIndex: 'title', ellipsis: true, title: '标题', width: 250 }, { dataIndex: 'asset_name', title: '资产', width: 170 },
    { dataIndex: 'severity', title: '级别', width: 95, render: (value: string) => <Tag color={severityColors[value]}>{value === 'critical' ? '严重' : value === 'major' ? '重要' : '次要'}</Tag> },
    { dataIndex: 'status', title: '状态', width: 105, render: (value: string) => <Tag color={value === 'resolved' || value === 'verified' ? 'success' : value === 'pending' ? 'gold' : 'processing'}>{statusLabels[value] ?? value}</Tag> },
    { dataIndex: 'assignee', title: '处理人', width: 110 }, { dataIndex: 'updated_at', title: '更新时间', width: 170 },
    {
      fixed: 'right', key: 'actions', title: '操作', width: 230, render: (_, ticket) => (
        <Space size={1}>
          <Button type="link" onClick={async () => setDetail(await getQualityTicketApi(ticket.id))}>详情</Button>
          {(ticket.status === 'pending' || ticket.status === 'reopened') ? <Button type="link" onClick={() => void quickAction(ticket, 'accept')}>接单</Button> : null}
          {ticket.status === 'processing' ? <Button type="link" onClick={() => openAction(ticket, 'resolve')}>解决</Button> : null}
          {['pending', 'processing', 'reopened'].includes(ticket.status) ? <Button type="link" onClick={() => openAction(ticket, 'ignore')}>忽略</Button> : null}
          {['resolved', 'verified', 'ignored'].includes(ticket.status) ? <Button type="link" onClick={() => void quickAction(ticket, 'reopen')}>重开</Button> : null}
        </Space>
      )
    }
  ];

  return (
    <ConsolePage description="追踪质量异常工单的分派、解决和验证全过程。" title="问题工单">
      <div className="console-page-toolbar">
        <Select allowClear options={Object.entries(statusLabels).map(([value, label]) => ({ label, value }))} placeholder="工单状态" style={{ width: 140 }} onChange={(status) => setTableParams((previous) => ({ ...previous, page: 1, status }))} />
        <Select allowClear options={[{ label: '严重', value: 'critical' }, { label: '重要', value: 'major' }, { label: '次要', value: 'minor' }]} placeholder="严重程度" style={{ width: 130 }} onChange={(severity) => setTableParams((previous) => ({ ...previous, page: 1, severity }))} />
        <Button onClick={() => setTableParams({ page: 1, page_size: 20 })}>重置</Button>
      </div>
      <AsyncState error={error} loading={loading} onRetry={() => void loadData(tableParams)}><DataTable columns={columns} dataSource={rows} pagination={{ current: tableParams.page, pageSize: tableParams.page_size, total, onChange: (page, page_size) => setTableParams((previous) => ({ ...previous, page, page_size })) }} rowKey="id" /></AsyncState>
      <Drawer open={Boolean(detail)} title={detail ? `工单 #${detail.id}` : ''} width={580} onClose={() => setDetail(null)}>
        {detail ? <>
          <h3>{detail.title}</h3><Space><Tag color={severityColors[detail.severity]}>{detail.severity}</Tag><Tag>{statusLabels[detail.status]}</Tag></Space>
          <p className="console-page-muted">资产：{detail.asset_name} · 处理人：{detail.assignee || '未分配'}</p>
          {detail.resolution ? <p>处理结论：{detail.resolution}</p> : null}
          <Timeline items={detail.events.map((event) => ({ children: <><strong>{event.action}</strong><br />{event.comment || event.to_status}<br /><span className="console-page-muted">{event.created_at}</span></> }))} />
        </> : null}
      </Drawer>
      <Modal okButtonProps={{ loading: saving }} open={Boolean(actionTicket)} title={action === 'resolve' ? '解决工单' : '忽略工单'} onCancel={() => setActionTicket(null)} onOk={() => void submitAction()}>
        <Form form={form} layout="vertical">
          <Form.Item label="处理意见" name="comment" rules={action === 'resolve' ? [{ required: true, message: '请填写处理意见' }] : []}><Input.TextArea rows={4} /></Form.Item>
          {action === 'ignore' ? <Form.Item label="忽略到期时间" name="ignore_until"><Input placeholder="ISO 时间，例如 2026-08-01T00:00:00Z" /></Form.Item> : null}
        </Form>
      </Modal>
    </ConsolePage>
  );
}
