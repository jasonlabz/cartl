import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { WorkflowTasksPage } from './index';

const { getDataFlowListApi, getTaskExecutionListApi, getTaskExecutionStatsApi } = vi.hoisted(() => ({
  getDataFlowListApi: vi.fn(),
  getTaskExecutionListApi: vi.fn(),
  getTaskExecutionStatsApi: vi.fn()
}));

vi.mock('@/services/workflow', () => ({
  cancelTaskExecutionApi: vi.fn(),
  getDataFlowListApi,
  getTaskExecutionListApi,
  getTaskExecutionStatsApi,
  retryTaskExecutionApi: vi.fn()
}));

function CurrentLocation() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe('WorkflowTasksPage', () => {
  it('loads source-compatible task rows and opens their detail route', async () => {
    getDataFlowListApi.mockResolvedValue({ list: [], total: 0 });
    getTaskExecutionListApi.mockResolvedValue({
      list: [{ created_at: '2026-07-17 12:00:00', duration_ms: 1200, end_time: null, error_message: null, flow_id: 12, flow_name: '客户同步', id: 7, log_file_path: null, start_time: '2026-07-17 12:00:00', status: 'running', task_id: 77, trigger_type: 'scheduled' }],
      total: 1
    });
    getTaskExecutionStatsApi.mockResolvedValue({ failed: 2, running: 1, success: 8, total: 11 });

    render(<MemoryRouter><WorkflowTasksPage /><CurrentLocation /></MemoryRouter>);

    expect(await screen.findByText('客户同步')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '查看' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/workflow/tasks/7');
  });
});
