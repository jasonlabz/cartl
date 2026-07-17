import type { PaginatedResult } from './api';

export interface DataAsset {
  column_count: number;
  comment: string;
  datasource_id: number;
  datasource_name: string;
  domain: string;
  id: number;
  name: string;
  owner: string;
  quality_score: number | null;
  row_count: number;
  schema_name: string;
  sensitivity: 'confidential' | 'internal' | 'public' | 'restricted';
  size_bytes: number;
  status: 'active' | 'archived' | 'deprecated';
  steward: string;
  tags: string[];
  type: 'file' | 'table' | 'view';
  updated_at: string;
}

export interface DataColumn {
  comment: string;
  distinct_count: number | null;
  is_pk: boolean;
  name: string;
  nullable: boolean;
  null_ratio: number | null;
  sample_values: string[];
  type: string;
}

export interface TablePreview {
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface FieldProfile {
  avg_value: string | null;
  distinct_count: number;
  max_value: string | null;
  min_value: string | null;
  name: string;
  null_count: number;
  null_rate: number;
  nullable: boolean;
  top_values: Array<{ count: number; value: string }>;
  total_count: number;
  type: string;
}

export interface TableProfile {
  column_count: number;
  completeness: number;
  fields: FieldProfile[];
  row_count: number;
  size_bytes: number;
  table_name: string;
}

export interface LineageGraph {
  edges: Array<{ edge_type?: string; source: string; target: string; transform_logic?: string }>;
  nodes: Array<{ description?: string; id: string; name: string; type: string; x_position?: number; y_position?: number }>;
}

export interface CompareConfig {
  compare_mode?: 'data_only' | 'schema_and_data' | 'schema_only';
  left: CompareSide;
  name?: string;
  right: CompareSide;
}

export interface CompareSide {
  datasource_id: number;
  exclude_columns?: string[];
  filter?: string;
  key_columns: string[];
  schema_name?: string;
  table_name: string;
}

export interface CompareResult {
  differences: Array<{ diff_fields?: string[]; key_values: Record<string, unknown>; type: string }>;
  different: number;
  execution_time_ms?: number;
  left_only: number;
  left_total: number;
  match_count: number;
  right_only: number;
  right_total: number;
}

export type DataAssetPage = PaginatedResult<DataAsset>;
