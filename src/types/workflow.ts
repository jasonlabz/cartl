import type { PaginatedResult } from './api';

export interface DataSource {
  config?: Record<string, unknown> | string;
  created_at: string;
  description?: string;
  explore_type?: string;
  id: number;
  name: string;
  operator_ref?: string;
  org_id?: number | null;
  org_name?: string;
  status: 'connected' | 'disabled' | 'error' | 'failed' | 'normal' | 'testing' | 'untested';
  status_message?: string;
  type: string;
  updated_at: string;
  usage_type?: 'asset_repo' | 'datasource';
  usage_count?: number;
}

export interface DataSourcePayload {
  config: Record<string, unknown>;
  description?: string;
  name: string;
  operator_ref?: string;
  type?: string;
}

export interface ConnectionLogEntry {
  engine_metadata?: string;
  error_message?: string;
  id: number;
  response_time_ms: number;
  status: string;
  tested_at: string;
}

export interface Operator {
  category?: string;
  class_name?: string;
  description: string;
  display_name: string;
  id: number;
  name: string;
  parameter_schema?: Record<string, unknown>;
  status?: string;
  type: 'sink' | 'source' | 'transform';
  version?: string;
}

export interface DataFlow {
  created_at: string;
  created_by?: string;
  description?: string;
  id: number;
  name: string;
  nodes?: FlowNode[];
  status: 'draft' | 'published';
  updated_at: string;
  version?: string;
}

export interface FlowNode {
  id: string;
  name?: string;
  operator?: string;
  parameter?: Record<string, unknown>;
  position?: { x: number; y: number };
  type: 'router' | 'sink' | 'source' | 'transform';
}

export interface FlowEdge {
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
}

export interface FlowDocument extends DataFlow {
  edges: FlowEdge[];
  nodes: FlowNode[];
  revision?: string;
}

export interface TaskExecution {
  duration_ms: number | null;
  end_time: string | null;
  error_message: string | null;
  flow_id: number;
  flow_name: string;
  id: number;
  log_file_path: string | null;
  start_time: string | null;
  status: 'cancelled' | 'failed' | 'pending' | 'running' | 'success';
  task_id: number;
  trigger_type: 'manual' | 'scheduled';
  created_at: string;
}

export interface TaskLogEntry {
  level: 'ERROR' | 'INFO' | 'WARN';
  message: string;
  timestamp: string;
}

export interface TaskStageDetail {
  duration_ms: number;
  node_id: string;
  node_name: string;
  processed_rows: number;
  status: TaskExecution['status'];
  throughput_rows_per_sec: number;
}

export interface WorkflowTablePreview {
  columns: Array<string | { name: string }>;
  rows: Record<string, unknown>[];
  total: number;
}

export interface TaskSnapshot {
  config_json: Record<string, unknown>;
  snapshot_at: string;
}

export interface ScheduledTask {
  cron_expression: string;
  flow_id: number;
  flow_name?: string;
  id: number;
  is_enabled: boolean;
  task_name: string;
}

export interface ScheduledTaskPayload {
  cron_expression: string;
  dependency_task_ids?: number[];
  flow_id: number;
  is_enabled: boolean;
  notification_config?: Record<string, unknown>;
  retry_count?: number;
  retry_interval_sec?: number;
  task_name: string;
  timeout_sec?: number;
}

export interface DashboardStats {
  scheduler?: {
    pool_capacity: number;
    pool_running: number;
    pool_waiting: number;
    queue_capacity: number;
    queue_pending: number;
    queue_type: string;
    started_at: number;
    uptime_seconds: number;
  };
  job_stats?: { created: number; failed: number; finished: number; running: number };
  task_stats?: { created: number; failed: number; finished: number; running: number };
}

export type WorkflowPage<T> = PaginatedResult<T>;
