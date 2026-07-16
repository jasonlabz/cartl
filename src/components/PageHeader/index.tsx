import type { ReactNode } from 'react';

import createStyles from '@/utils/createStyles';

export interface PageHeaderProps {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
}

const useStyles = createStyles(({ css, token }) => ({
  header: css({
    '&.page-header': {
      alignItems: 'flex-end',
      display: 'flex',
      gap: token.marginLG,
      justifyContent: 'space-between',

      '& .page-header-eyebrow': {
        color: '#8693a6',
        fontFamily: '"DM Mono", monospace',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.14em',
        marginBottom: 8
      },

      '& .page-header-title': {
        color: '#1d2a3a',
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: '-0.035em',
        lineHeight: 1.2,
        margin: 0
      },

      '& .page-header-description': {
        color: '#8090a4',
        fontSize: 12,
        margin: '8px 0 0'
      },

      '& .page-header-actions': {
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8
      },

      '@media (max-width: 768px)': {
        alignItems: 'flex-start',
        flexDirection: 'column',

        '& .page-header-actions': { width: '100%' }
      }
    }
  })
}));

export function PageHeader({ actions, description, eyebrow, title }: PageHeaderProps) {
  const { cx, styles } = useStyles();

  return (
    <header className={cx('page-header', styles.header)}>
      <div>
        {eyebrow ? <div className="page-header-eyebrow">{eyebrow}</div> : null}
        <h1 className="page-header-title">{title}</h1>
        {description ? <p className="page-header-description">{description}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  );
}
