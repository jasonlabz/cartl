import type { CompareConfig, CompareResult, DataAsset, DataAssetPage, DataColumn, LineageGraph, TablePreview, TableProfile } from '@/types/data-view';
import { request } from '@/utils/request';

const BASE = '/api/v1/data-view';

export function getDataCatalogApi(params?: Record<string, string | number | undefined>): Promise<DataAssetPage> {
  return request.get(`${BASE}/catalog`, { params });
}

export function getDataAssetDetailApi(id: number): Promise<DataAsset & { columns: DataColumn[]; preview: TablePreview }> {
  return request.get(`${BASE}/catalog/${id}`);
}

export function updateDataAssetTagsApi(id: number, tags: string[]): Promise<void> {
  return request.patch(`${BASE}/catalog/${id}/tags`, { data: { tags } });
}

export function getTableProfileApi(params: { datasource_id: number; schema?: string; table: string }): Promise<TableProfile> {
  return request.get(`${BASE}/profiling/table`, { params });
}

export function startTableProfileApi(data: { datasource_id: number; force?: boolean; schema?: string; table: string }): Promise<{ task_id: number }> {
  return request.post(`${BASE}/profiling/table/async`, { data });
}

export function getTableProfileTaskApi(taskId: number): Promise<{ progress_percent: number; result?: TableProfile; status: string }> {
  return request.get(`${BASE}/profiling/table/task/${taskId}`);
}

export function getLineageGraphApi(params: { depth?: number; field_name?: string; table_name?: string }): Promise<LineageGraph> {
  return request.get(`${BASE}/lineage`, { params });
}

export function executeDataCompareApi(data: CompareConfig): Promise<CompareResult> {
  return request.post(`${BASE}/compare`, { data });
}

export function getCompareDetailApi(id: string | number, params?: Record<string, number | string | undefined>): Promise<{ list: CompareResult['differences']; total: number }> {
  return request.get(`${BASE}/compare/${id}/details`, { params });
}
