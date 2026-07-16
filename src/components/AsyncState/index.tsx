import { Button, Empty, Result, Spin } from 'antd';
import type { ReactNode } from 'react';

import createStyles from '@/utils/createStyles';

export interface AsyncStateProps {
  children: ReactNode;
  empty?: boolean;
  emptyDescription?: ReactNode;
  error?: unknown;
  errorTitle?: ReactNode;
  loading?: boolean;
  onRetry?: () => void;
}

const useStyles = createStyles(({ css, token }) => ({
  state: css({
    '&.async-state': {
      minHeight: 168,
      padding: `${token.paddingLG}px ${token.padding}px`,

      '& .async-state-loading': {
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: 136
      }
    }
  })
}));

export function AsyncState({
  children,
  empty = false,
  emptyDescription = '暂无数据',
  error,
  errorTitle = '加载失败',
  loading = false,
  onRetry
}: AsyncStateProps) {
  const { cx, styles } = useStyles();

  if (loading) {
    return (
      <div className={cx('async-state', styles.state)}>
        <div className="async-state-loading">
          <Spin description="正在加载" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cx('async-state', styles.state)}>
        <Result
          extra={onRetry ? <Button onClick={onRetry}>重新加载</Button> : undefined}
          status="error"
          subTitle={error instanceof Error ? error.message : undefined}
          title={errorTitle}
        />
      </div>
    );
  }

  if (empty) {
    return (
      <div className={cx('async-state', styles.state)}>
        <Empty description={emptyDescription} />
      </div>
    );
  }

  return <>{children}</>;
}
