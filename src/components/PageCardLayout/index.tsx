import { Card } from 'antd';
import type { PropsWithChildren, ReactNode } from 'react';

import { useStyles } from './styles';

export interface PageCardLayoutProps extends PropsWithChildren {
  className?: string;
  header?: ReactNode;
  toolbar?: ReactNode;
}

export function PageCardLayout({ children, className, header, toolbar }: PageCardLayoutProps) {
  const { cx, styles } = useStyles();

  return (
    <div className={cx('page-card-layout', styles.layout, className)}>
      {header}
      {toolbar}
      <Card className="page-card-layout-card" variant="outlined">
        {children}
      </Card>
    </div>
  );
}
