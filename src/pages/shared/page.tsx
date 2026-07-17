import type { ReactNode } from 'react';

import { PageHeader } from '@/components/PageHeader';

import { usePageStyles } from './styles';

export interface ConsolePageProps {
  actions?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  title: ReactNode;
}

export function ConsolePage({ actions, children, description, title }: ConsolePageProps) {
  const { cx, styles } = usePageStyles();

  return (
    <section className={cx('console-page', styles.page)}>
      <PageHeader actions={actions} eyebrow="DAGINE DATA GOVERNANCE" title={title} description={description} />
      {children}
    </section>
  );
}
