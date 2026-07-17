import type { PaginatedResult } from './api';

export type QualityDimension = 'accuracy' | 'completeness' | 'consistency' | 'timeliness' | 'uniqueness' | 'validity';
export type QualityStatus = 'active' | 'inactive';

export interface QualityRule {
  code: string;
  created_at: string;
  current_version: number;
  default_parameters: Record<string, unknown>;
  description: string;
  dimension: QualityDimension;
  id: number;
  level: 'field' | 'table';
  name: string;
  operation: string;
  parameter_schema: Record<string, unknown>;
  rule_type: 'builtin' | 'custom';
  status: QualityStatus;
  updated_at: string;
}

export interface QualityRulePayload {
  code: string;
  default_parameters?: Record<string, unknown>;
  description?: string;
  dimension: QualityDimension;
  level: 'field' | 'table';
  name: string;
  operation: string;
  parameter_schema?: Record<string, unknown>;
  rule_type?: 'builtin' | 'custom';
  supported_types?: string[];
}

export interface QualityPlanRule {
  field_name?: string;
  id?: number;
  parameters?: Record<string, unknown>;
  rule_id: number;
  rule_name?: string;
  severity?: 'critical' | 'major' | 'minor';
  weight?: number;
}

export interface QualityPlan {
  asset_id: number;
  asset_name: string;
  created_at: string;
  current_version: number;
  description: string;
  id: number;
  name: string;
  owner: string;
  rules?: QualityPlanRule[];
  status: 'active' | 'archived' | 'draft' | 'inactive';
  strategy: Record<string, unknown>;
  updated_at: string;
  version_status: string;
}

export interface QualityPlanPayload {
  asset_id: number;
  description?: string;
  name: string;
  owner?: string;
  rules: QualityPlanRule[];
  strategy?: Record<string, unknown>;
}

export interface QualityRun {
  asset_id: number;
  asset_name: string;
  completed_at?: string;
  created_at: string;
  failed_rules: number;
  passed_rules: number;
  plan_id: number;
  plan_name: string;
  plan_version: number;
  run_id: number;
  score?: number;
  started_at?: string;
  status: 'completed' | 'failed' | 'pending' | 'running';
  total_rules: number;
  trigger_type: 'manual' | 'scheduled' | 'trial';
}

export interface QualityRuleResult {
  dimension: QualityDimension;
  failed_rows: number;
  id: number;
  message?: string;
  pass_rate?: number;
  rule_name: string;
  status: 'error' | 'failed' | 'passed' | 'unsupported';
  total_rows: number;
}

export interface QualityTicket {
  asset_id: number;
  asset_name: string;
  assignee: string;
  created_at: string;
  id: number;
  plan_rule_id: number;
  resolution: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'ignored' | 'pending' | 'processing' | 'reopened' | 'resolved' | 'verified';
  title: string;
  updated_at: string;
}

export interface QualityTicketDetail extends QualityTicket {
  events: Array<{ action: string; comment?: string; created_at: string; id: number; operator?: string; to_status: string }>;
}

export type QualityPage<T> = PaginatedResult<T>;
