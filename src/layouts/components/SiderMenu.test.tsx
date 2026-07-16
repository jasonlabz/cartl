import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { SiderMenu } from './SiderMenu';

describe('SiderMenu', () => {
  it('renders source-compatible business entries and selects the current route', () => {
    render(
      <MemoryRouter initialEntries={['/workflow/data-source']}>
        <SiderMenu />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: '元数据标准' })).toHaveAttribute('href', '/standards/metadata');
    expect(screen.getByRole('link', { name: '数据源管理' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '版本对比' })).toHaveAttribute('href', '/data-view/compare');
  });
});
