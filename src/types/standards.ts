import type { PaginatedResult } from './api';

export interface Organization {
  code: string;
  created_at: string;
  id: number;
  level: number;
  name: string;
  parent_id: number | null;
  parent_name: string;
  remark: string;
  status: string;
  type: string;
  updated_at: string;
}

export interface OrganizationPayload {
  code: string;
  level?: number;
  name: string;
  parent_id?: number | null;
  remark?: string;
  status?: string;
  type: string;
}

export interface VersionInfo {
  config_size: number;
  created_at: string;
  created_by: string;
  id: number;
  publish_note: string;
  published_at: string | null;
  status: 'deprecated' | 'draft' | 'published';
  version_number: string;
}

export interface ValueDomain {
  category: string;
  created_at: string;
  description: string;
  has_draft: boolean;
  id: number;
  latest_version?: ValueDomainVersionInfo;
  name: string;
  ref_count?: number;
  source: string;
  updated_at: string;
  version_count: number;
}

export interface ValueDomainVersionInfo extends VersionInfo {
  change_summary: string;
  domain_id: number;
  value_count: number;
}

export interface ValueDomainPayload {
  category?: string;
  description?: string;
  name: string;
  source?: string;
}

export interface MetadataStandard {
  category: string;
  created_at: string;
  data_type: string;
  description: string;
  has_draft: boolean;
  id: number;
  latest_version?: MetadataVersionInfo;
  name: string;
  org_scope: number[] | null;
  ref_domain_id?: number | null;
  ref_domain_version_id?: number | null;
  updated_at: string;
  version_count: number;
}

export interface MetadataVersionInfo extends VersionInfo {
  field_count: number;
  standard_id: number;
}

export interface MetadataPayload {
  category?: string;
  data_type: string;
  description?: string;
  name: string;
  org_scope?: number[] | null;
  ref_domain_id?: number;
  ref_domain_version_id?: number;
}

export interface StandardVersionDetail {
  config: string;
  id: number;
  status: VersionInfo['status'];
  version_number: string;
}

export type StandardsPage<T> = PaginatedResult<T>;
