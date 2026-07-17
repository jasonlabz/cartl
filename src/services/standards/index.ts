import type {
  MetadataPayload,
  MetadataStandard,
  Organization,
  OrganizationPayload,
  StandardVersionDetail,
  StandardsPage,
  ValueDomain,
  ValueDomainPayload,
  VersionInfo
} from '@/types/standards';
import { request } from '@/utils/request';

const BASE = '/api/v1/standards';

export interface OrganizationListParams {
  keyword?: string;
  page?: number;
  page_size?: number;
  status?: string;
  type?: string;
}

export function getOrganizationListApi(params?: OrganizationListParams): Promise<StandardsPage<Organization>> {
  return request.get(`${BASE}/org`, { params });
}

export function getOrganizationTreeApi(): Promise<Organization[]> {
  return request.get(`${BASE}/org/tree`, { unwrapData: false });
}

export function getOrganizationDetailApi(id: number): Promise<Organization> {
  return request.get(`${BASE}/org/${id}`);
}

export function createOrganizationApi(data: OrganizationPayload): Promise<Organization> {
  return request.post(`${BASE}/org`, { data });
}

export function updateOrganizationApi(id: number, data: Partial<OrganizationPayload>): Promise<Organization> {
  return request.put(`${BASE}/org/${id}`, { data });
}

export function deleteOrganizationApi(id: number): Promise<void> {
  return request.delete(`${BASE}/org/${id}`);
}

export function toggleOrganizationStatusApi(id: number, status: string): Promise<void> {
  return request.patch(`${BASE}/org/${id}/status`, { data: { status } });
}

export interface ValueDomainListParams {
  keyword?: string;
  page?: number;
  page_size?: number;
  status?: string;
}

export function getValueDomainListApi(params?: ValueDomainListParams): Promise<StandardsPage<ValueDomain>> {
  return request.get(`${BASE}/value-domain`, { params });
}

export function getValueDomainDetailApi(id: number): Promise<ValueDomain> {
  return request.get(`${BASE}/value-domain/${id}`);
}

export function createValueDomainApi(data: ValueDomainPayload): Promise<ValueDomain> {
  return request.post(`${BASE}/value-domain`, { data });
}

export function updateValueDomainApi(id: number, data: Partial<ValueDomainPayload>): Promise<ValueDomain> {
  return request.put(`${BASE}/value-domain/${id}`, { data });
}

export function deleteValueDomainApi(id: number): Promise<void> {
  return request.delete(`${BASE}/value-domain/${id}`);
}

export function getValueDomainVersionsApi(domainId: number): Promise<VersionInfo[]> {
  return request.get(`${BASE}/value-domain/${domainId}/versions`, { unwrapData: false });
}

export function getValueDomainVersionApi(domainId: number, versionId: number): Promise<StandardVersionDetail> {
  return request.get(`${BASE}/value-domain/${domainId}/version/${versionId}`);
}

export function createValueDomainVersionApi(domainId: number, data?: { version_number?: string }): Promise<StandardVersionDetail> {
  return request.post(`${BASE}/value-domain/${domainId}/version`, { data: data ?? { version_number: '' } });
}

export function publishValueDomainVersionApi(domainId: number, versionId: number, data?: Record<string, string>): Promise<void> {
  return request.post(`${BASE}/value-domain/${domainId}/version/${versionId}/publish`, { data });
}

export function reviseValueDomainVersionApi(domainId: number, versionId: number, data?: Record<string, string>): Promise<StandardVersionDetail> {
  return request.post(`${BASE}/value-domain/${domainId}/version/${versionId}/revise`, { data });
}

export function getValueDomainVersionValuesApi(domainId: number, versionId: number): Promise<{ config: string }> {
  return request.get(`${BASE}/value-domain/${domainId}/version/${versionId}/values`);
}

export function updateValueDomainVersionValuesApi(domainId: number, versionId: number, config: Record<string, unknown>[]): Promise<void> {
  return request.put(`${BASE}/value-domain/${domainId}/version/${versionId}/values`, { data: { config: JSON.stringify(config) } });
}

export interface MetadataListParams {
  keyword?: string;
  page?: number;
  page_size?: number;
  ref_domain_id?: number;
  status?: string;
}

export function getMetadataListApi(params?: MetadataListParams): Promise<StandardsPage<MetadataStandard>> {
  return request.get(`${BASE}/metadata`, { params });
}

export function getMetadataDetailApi(id: number): Promise<MetadataStandard> {
  return request.get(`${BASE}/metadata/${id}`);
}

export function createMetadataApi(data: MetadataPayload): Promise<MetadataStandard> {
  return request.post(`${BASE}/metadata`, { data });
}

export function updateMetadataApi(id: number, data: Partial<MetadataPayload>): Promise<MetadataStandard> {
  return request.put(`${BASE}/metadata/${id}`, { data });
}

export function deleteMetadataApi(id: number): Promise<void> {
  return request.delete(`${BASE}/metadata/${id}`);
}

export function getMetadataVersionsApi(standardId: number): Promise<VersionInfo[]> {
  return request.get(`${BASE}/metadata/${standardId}/versions`, { unwrapData: false });
}

export function getMetadataVersionApi(standardId: number, versionId: number): Promise<StandardVersionDetail> {
  return request.get(`${BASE}/metadata/${standardId}/version/${versionId}`);
}

export function publishMetadataVersionApi(standardId: number, versionId: number, data?: Record<string, string>): Promise<void> {
  return request.post(`${BASE}/metadata/${standardId}/version/${versionId}/publish`, { data });
}

export function reviseMetadataVersionApi(standardId: number, versionId: number, data?: Record<string, string | number>): Promise<StandardVersionDetail> {
  return request.post(`${BASE}/metadata/${standardId}/version/${versionId}/revise`, { data });
}

export function getMetadataVersionFieldsApi(standardId: number, versionId: number): Promise<{ config: string }> {
  return request.get(`${BASE}/metadata/${standardId}/version/${versionId}/fields`);
}

export function updateMetadataVersionFieldsApi(standardId: number, versionId: number, config: Record<string, unknown>[]): Promise<void> {
  return request.put(`${BASE}/metadata/${standardId}/version/${versionId}/fields`, { data: { config: JSON.stringify(config) } });
}
