import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { HomePage } from './index';

const { getDashboardStatsApi } = vi.hoisted(() => ({ getDashboardStatsApi: vi.fn() }));

vi.mock('@/services/workflow', () => ({ getDashboardStatsApi }));

function CurrentLocation() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe('HomePage', () => {
  it('renders scheduler statistics and keeps the source keyboard shortcut', async () => {
    getDashboardStatsApi.mockResolvedValue({
      job_stats: { created: 1, failed: 1, finished: 8, running: 2 },
      scheduler: { pool_capacity: 16, pool_running: 3, pool_waiting: 0, queue_capacity: 100, queue_pending: 5, queue_type: 'fifo', started_at: 0, uptime_seconds: 3600 },
      task_stats: { created: 2, failed: 3, finished: 27, running: 4 }
    });

    render(<MemoryRouter><HomePage /><CurrentLocation /></MemoryRouter>);

    expect(await screen.findByText('27')).toBeInTheDocument();
    expect(getDashboardStatsApi).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'r' });

    expect(screen.getByTestId('location')).toHaveTextContent('/workflow/data-source');
  });
});
