import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppRouter, router } from './router';

describe('AppRouter', () => {
  it('redirects an unauthenticated private route to its source-compatible login redirect', async () => {
    await act(async () => {
      await router.navigate('/workflow/data-source?status=active');
    });

    render(<AppRouter />);

    expect(await screen.findByRole('heading', { name: '欢迎登录' })).toBeInTheDocument();
    expect(window.location.search).toContain('redirect=%2Fworkflow%2Fdata-source%3Fstatus%3Dactive');
  });
});
