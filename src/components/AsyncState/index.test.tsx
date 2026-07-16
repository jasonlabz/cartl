import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AsyncState } from './index';

describe('AsyncState', () => {
  it.each([
    { props: { loading: true }, text: '正在加载' },
    { props: { error: new Error('加载失败') }, text: '加载失败' },
    { props: { empty: true }, text: '暂无数据' }
  ])('renders the expected $text feedback state', ({ props, text }) => {
    render(
      <AsyncState {...props}>
        <div>内容区域</div>
      </AsyncState>
    );

    expect(screen.getAllByText(text).length).toBeGreaterThan(0);
  });

  it('renders content when it has no feedback state', () => {
    render(
      <AsyncState>
        <div>内容区域</div>
      </AsyncState>
    );

    expect(screen.getByText('内容区域')).toBeInTheDocument();
  });
});
