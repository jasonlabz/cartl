import type {
  DashboardStats,
  DataFlow,
  DataSource,
  DataSourcePayload,
  ConnectionLogEntry,
  FlowDocument,
  Operator,
  ScheduledTask,
  ScheduledTaskPayload,
  TaskLogEntry,
  TaskSnapshot,
  TaskStageDetail,
  TaskExecution,
  WorkflowTablePreview,
  WorkflowPage
} from '@/types/workflow';
import { request } from '@/utils/request';

const BASE = '/api/v1';

export function getDataSourceListApi(params?: Record<string, string | number | undefined>): Promise<WorkflowPage<DataSource>> {
  return request.get(`${BASE}/workflow/data-source`, { params: { ...params, usage_type: 'datasource' } });
}

export function getDataSourceDetailApi(id: number): Promise<DataSource> {
  return request.get(`${BASE}/workflow/data-source/${id}`);
}

export function createDataSourceApi(data: DataSourcePayload): Promise<DataSource> {
  return request.post(`${BASE}/workflow/data-source`, { data });
}

export function updateDataSourceApi(id: number, data: Partial<DataSourcePayload>): Promise<DataSource> {
  return request.put(`${BASE}/workflow/data-source/${id}`, { data });
}

export function deleteDataSourceApi(id: number): Promise<void> {
  return request.delete(`${BASE}/workflow/data-source/${id}`);
}

export function testDataSourceApi(data: { config: Record<string, unknown>; operator_ref?: string; type?: string }): Promise<{ message: string; success: boolean }> {
  return request.post(`${BASE}/workflow/data-source/test`, { data });
}

export function testDataSourceByIdApi(id: number): Promise<{ message: string; success: boolean }> {
  return request.post(`${BASE}/workflow/data-source/${id}/test`);
}

export function getDataSourceRelatedFlowsApi(id: number): Promise<DataFlow[]> {
  return request.get(`${BASE}/workflow/data-source/${id}/related-flows`, { unwrapData: false });
}

export function getDataSourceConnectionLogsApi(id: number, params?: { page?: number; page_size?: number }): Promise<WorkflowPage<ConnectionLogEntry>> {
  return request.get(`${BASE}/workflow/data-source/${id}/connection-logs`, { params });
}

export function getDataSourceTypesApi(): Promise<Array<{ label?: string; name?: string; value?: string }>> {
  return request.get(`${BASE}/workflow/data-source/types`, { unwrapData: false });
}

export function getAssetRepoListApi(params?: Record<string, string | number | undefined>): Promise<WorkflowPage<DataSource>> {
  return request.get(`${BASE}/workflow/asset-repo`, { params: { ...params, usage_type: 'asset_repo' } });
}

export function getAssetRepoDetailApi(id: number): Promise<DataSource> {
  return request.get(`${BASE}/workflow/asset-repo/${id}`);
}

export function createAssetRepoApi(data: DataSourcePayload): Promise<DataSource> {
  return request.post(`${BASE}/workflow/asset-repo`, { data });
}

export function updateAssetRepoApi(id: number, data: Partial<DataSourcePayload>): Promise<DataSource> {
  return request.put(`${BASE}/workflow/asset-repo/${id}`, { data });
}

export function deleteAssetRepoApi(id: number): Promise<void> {
  return request.delete(`${BASE}/workflow/asset-repo/${id}`);
}

export function testAssetRepoApi(data: { config: Record<string, unknown>; type: string }): Promise<{ message: string; success: boolean }> {
  return request.post(`${BASE}/workflow/asset-repo/test`, { data });
}

export function testAssetRepoByIdApi(id: number): Promise<{ message: string; success: boolean }> {
  return request.post(`${BASE}/workflow/asset-repo/${id}/test`);
}

export function getCustomOperatorListApi(params?: Record<string, string | number | undefined>): Promise<WorkflowPage<Operator>> {
  return request.get(`${BASE}/workflow/operators/custom`, { params });
}

export function getBuiltInOperatorListApi(params?: Record<string, string | number | undefined>): Promise<WorkflowPage<Operator>> {
  return request.get(`${BASE}/workflow/operators/built-in`, { params });
}

export function getDataFlowListApi(params?: Record<string, string | number | undefined>): Promise<WorkflowPage<DataFlow>> {
  return request.get(`${BASE}/workflow/data-flow`, { params });
}

export function getDataFlowDetailApi(id: number, params?: { include_workbench?: boolean }): Promise<FlowDocument> {
  return request.get(`${BASE}/workflow/data-flow/${id}`, { params });
}

export function createDataFlowApi(data: Partial<DataFlow>): Promise<DataFlow> {
  return request.post(`${BASE}/workflow/data-flow`, { data });
}

export function updateDataFlowApi(id: number, data: Partial<FlowDocument>): Promise<DataFlow> {
  return request.put(`${BASE}/workflow/data-flow/${id}`, { data });
}

export function validateDataFlowApi(id: number): Promise<{ errors?: string[]; valid?: boolean }> {
  return request.post(`${BASE}/workflow/data-flow/${id}/validate`);
}

export function getTaskExecutionListApi(params?: Record<string, string | number | undefined>): Promise<WorkflowPage<TaskExecution>> {
  return request.get(`${BASE}/workflow/tasks`, { params });
}

export function getTaskExecutionStatsApi(): Promise<{ failed: number; running: number; success: number; total: number }> {
  return request.get(`${BASE}/workflow/tasks/stats`);
}

export function getTaskExecutionDetailApi(id: number): Promise<TaskExecution> {
  return request.get(`${BASE}/workflow/tasks/${id}`);
}

export function getTaskExecutionLogsApi(id: number, params?: { keyword?: string; level?: TaskLogEntry['level']; limit?: number; offset?: number }): Promise<TaskLogEntry[]> {
  return request.get(`${BASE}/workflow/tasks/${id}/logs`, { params, unwrapData: false });
}

export function getTaskExecutionStagesApi(id: number): Promise<TaskStageDetail[]> {
  return request.get(`${BASE}/workflow/tasks/${id}/stages`, { unwrapData: false });
}

export function getTaskExecutionPreviewApi(id: number): Promise<WorkflowTablePreview> {
  return request.get(`${BASE}/workflow/tasks/${id}/preview`);
}

export function getTaskExecutionSnapshotApi(id: number): Promise<TaskSnapshot> {
  return request.get(`${BASE}/workflow/tasks/${id}/snapshot`);
}

export function cancelTaskExecutionApi(id: number): Promise<void> {
  return request.post(`${BASE}/workflow/tasks/${id}/cancel`);
}

export function retryTaskExecutionApi(id: number, data?: { use_snapshot?: boolean }): Promise<{ task_id: number }> {
  return request.post(`${BASE}/workflow/tasks/${id}/retry`, { data });
}

export function getScheduledTaskListApi(params?: Record<string, string | number | boolean | undefined>): Promise<WorkflowPage<ScheduledTask>> {
  return request.get(`${BASE}/workflow/scheduler`, { params });
}

export function createScheduledTaskApi(data: ScheduledTaskPayload): Promise<ScheduledTask> {
  return request.post(`${BASE}/workflow/scheduler`, { data });
}

export function updateScheduledTaskApi(id: number, data: Partial<ScheduledTaskPayload>): Promise<ScheduledTask> {
  return request.put(`${BASE}/workflow/scheduler/${id}`, { data });
}

export function deleteScheduledTaskApi(id: number): Promise<void> {
  return request.delete(`${BASE}/workflow/scheduler/${id}`);
}

export function toggleScheduledTaskApi(id: number, is_enabled: boolean): Promise<void> {
  return request.patch(`${BASE}/workflow/scheduler/${id}/toggle`, { data: { is_enabled } });
}

export function getDashboardStatsApi(): Promise<DashboardStats> {
  return request.get(`${BASE}/scheduler/dashboard`);
}
