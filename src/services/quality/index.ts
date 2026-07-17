import type {
  QualityPage,
  QualityPlan,
  QualityPlanPayload,
  QualityRule,
  QualityRulePayload,
  QualityRuleResult,
  QualityRun,
  QualityTicket,
  QualityTicketDetail
} from '@/types/quality';
import { request } from '@/utils/request';

const BASE = '/api/v1/quality';

export function getQualityRuleListApi(params?: Record<string, string | number | undefined>): Promise<QualityPage<QualityRule>> {
  return request.get(`${BASE}/rules`, { params });
}

export function getQualityRuleApi(id: number): Promise<QualityRule> {
  return request.get(`${BASE}/rules/${id}`);
}

export function createQualityRuleApi(data: QualityRulePayload): Promise<QualityRule> {
  return request.post(`${BASE}/rules`, { data });
}

export function updateQualityRuleApi(id: number, data: QualityRulePayload): Promise<QualityRule> {
  return request.put(`${BASE}/rules/${id}`, { data });
}

export function deleteQualityRuleApi(id: number): Promise<void> {
  return request.delete(`${BASE}/rules/${id}`);
}

export function testQualityRuleApi(id: number, data: { asset_id: number; field_name?: string; parameters?: Record<string, unknown> }): Promise<Record<string, unknown>> {
  return request.post(`${BASE}/rules/${id}/test`, { data });
}

export function getQualityPlanListApi(params?: Record<string, string | number | undefined>): Promise<QualityPage<QualityPlan>> {
  return request.get(`${BASE}/plans`, { params });
}

export function getQualityPlanApi(id: number): Promise<QualityPlan> {
  return request.get(`${BASE}/plans/${id}`);
}

export function createQualityPlanApi(data: QualityPlanPayload): Promise<QualityPlan> {
  return request.post(`${BASE}/plans`, { data });
}

export function updateQualityPlanApi(id: number, data: QualityPlanPayload): Promise<QualityPlan> {
  return request.put(`${BASE}/plans/${id}`, { data });
}

export function publishQualityPlanApi(id: number): Promise<QualityPlan> {
  return request.post(`${BASE}/plans/${id}/publish`);
}

export function reviseQualityPlanApi(id: number): Promise<QualityPlan> {
  return request.post(`${BASE}/plans/${id}/revise`);
}

export function deleteQualityPlanApi(id: number): Promise<void> {
  return request.delete(`${BASE}/plans/${id}`);
}

export function runQualityPlanApi(id: number, data: { idempotency_key: string }): Promise<{ run_id: number; task_id: number }> {
  return request.post(`${BASE}/plans/${id}/runs`, { data });
}

export function getQualityReportSummaryApi(): Promise<{ completed_runs: number; failed_runs: number; open_critical_tickets: number }> {
  return request.get(`${BASE}/reports/summary`);
}

export function getQualityReportListApi(params?: Record<string, string | number | undefined>): Promise<QualityPage<QualityRun>> {
  return request.get(`${BASE}/reports`, { params });
}

export function getQualityReportResultsApi(runId: number, params?: Record<string, number | undefined>): Promise<QualityPage<QualityRuleResult>> {
  return request.get(`${BASE}/reports/${runId}/results`, { params });
}

export function getQualityTicketListApi(params?: Record<string, string | number | undefined>): Promise<QualityPage<QualityTicket>> {
  return request.get(`${BASE}/tickets`, { params });
}

export function getQualityTicketApi(id: number): Promise<QualityTicketDetail> {
  return request.get(`${BASE}/tickets/${id}`);
}

export function updateQualityTicketActionApi(id: number, data: { action: 'accept' | 'ignore' | 'reopen' | 'resolve'; comment?: string; ignore_until?: string }): Promise<QualityTicket> {
  return request.post(`${BASE}/tickets/${id}/actions`, { data });
}
