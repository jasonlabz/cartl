import { Button, Card, Descriptions, Space, Statistic, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { ArrowLeft, Play, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { AsyncState } from '@/components/AsyncState';
import { DataTable } from '@/components/DataTable';
import { ConsolePage } from '@/pages/shared/page';
import { getQualityReportListApi, getQualityReportResultsApi, getQualityReportSummaryApi, runQualityPlanApi } from '@/services/quality';
import type { QualityRuleResult, QualityRun } from '@/types/quality';

type TableParams = { page: number; page_size: number; status?: string };

export function QualityReportsPage() {
  const [tableParams, setTableParams] = useState<TableParams>({ page: 1, page_size: 20 });
  const [rows, setRows] = useState<QualityRun[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ completed_runs: 0, failed_runs: 0, open_critical_tickets: 0 });
  const [selected, setSelected] = useState<QualityRun | null>(null);
  const [results, setResults] = useState<QualityRuleResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const sequence = useRef(0);

  const loadData = useCallback(async (params: TableParams) => {
    const current = ++sequence.current;
    setLoading(true);
    setError(undefined);
    try {
      const [reportPage, reportSummary] = await Promise.all([getQualityReportListApi(params), getQualityReportSummaryApi()]);
      if (current === sequence.current) { setRows(reportPage.list); setTotal(reportPage.total); setSummary(reportSummary); }
    } catch (requestError) { if (current === sequence.current) setError(requestError); }
    finally { if (current === sequence.current) setLoading(false); }
  }, []);

  useEffect(() => { void loadData(tableParams); return () => { sequence.current += 1; }; }, [loadData, tableParams]);

  if (selected) {
    return (
      <ConsolePage actions={<Button icon={<ArrowLeft size={15} />} onClick={() => setSelected(null)}>返回报告列表</Button>} title={`运行报告 #${selected.run_id}`}>
        <div className="console-page-summary">
          <Card><Statistic title="综合评分" value={selected.score ?? '-'} /></Card><Card><Statistic title="通过规则" value={selected.passed_rules} /></Card><Card><Statistic title="失败规则" value={selected.failed_rules} /></Card>
        </div>
        <Card title={`${selected.plan_name} · 规则执行结果`}>
          <DataTable columns={[{ dataIndex: 'rule_name', title: '规则' }, { dataIndex: 'dimension', title: '维度' }, { dataIndex: 'status', title: '结果', render: (status: string) => <Tag color={status === 'passed' ? 'success' : 'error'}>{status}</Tag> }, { dataIndex: 'total_rows', title: '总行数' }, { dataIndex: 'failed_rows', title: '失败行数' }, { dataIndex: 'message', title: '消息' }]} dataSource={results} pagination={false} rowKey="id" />
        </Card>
      </ConsolePage>
    );
  }

  const columns: TableColumnsType<QualityRun> = [
    { dataIndex: 'run_id', title: 'Run ID', width: 90 }, { dataIndex: 'plan_name', title: '方案名称', width: 180 }, { dataIndex: 'asset_name', title: '资产', width: 160 },
    { dataIndex: 'score', title: '评分', width: 90, render: (value?: number) => value?.toFixed(1) ?? '-' }, { dataIndex: 'passed_rules', title: '通过', width: 75 }, { dataIndex: 'failed_rules', title: '失败', width: 75 },
    { dataIndex: 'status', title: '状态', width: 100, render: (value: string) => <Tag color={value === 'completed' ? 'success' : value === 'failed' ? 'error' : 'processing'}>{value}</Tag> }, { dataIndex: 'created_at', title: '创建时间', width: 170 },
    { fixed: 'right', key: 'actions', title: '操作', width: 160, render: (_, item) => <Space size={2}><Button type="link" onClick={async () => { setSelected(item); setResults((await getQualityReportResultsApi(item.run_id)).list); }}>详情</Button><Button icon={<Play size={14} />} type="link" onClick={() => void runQualityPlanApi(item.plan_id, { idempotency_key: `manual:${item.plan_id}:${Date.now()}` })}>重跑</Button></Space> }
  ];

  return (
    <ConsolePage description="查看质量方案的运行记录、评分和失败规则。" title="质量报告">
      <div className="console-page-summary"><Card><Statistic title="待处理严重工单" value={summary.open_critical_tickets} /></Card><Card><Statistic title="完成运行" value={summary.completed_runs} /></Card><Card><Statistic title="失败运行" value={summary.failed_runs} /></Card></div>
      <AsyncState error={error} loading={loading} onRetry={() => void loadData(tableParams)}><DataTable columns={columns} dataSource={rows} pagination={{ current: tableParams.page, pageSize: tableParams.page_size, total, onChange: (page, page_size) => setTableParams((previous) => ({ ...previous, page, page_size })) }} rowKey="run_id" /></AsyncState>
    </ConsolePage>
  );
}
