import createStyles from '@/utils/createStyles';

export const useStyles = createStyles(({ css, token }) => ({
  page: css({
    '&.home-page': {
      margin: '0 auto',
      maxWidth: 1480,
      padding: '26px 42px 48px',
      width: '100%',

      '& .home-welcome': {
        alignItems: 'center',
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 8,
        display: 'flex',
        justifyContent: 'space-between',
        padding: '14px 20px'
      },

      '& .home-greeting': { color: token.colorTextSecondary, fontSize: 14 },
      '& .home-title': { color: token.colorText, fontSize: 20, fontWeight: 700, marginLeft: 4 },
      '& .home-date': { color: token.colorTextSecondary, fontSize: 13 },

      '& .home-stat-row': { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', marginTop: 16 },

      '& .home-stat-card': {
        alignItems: 'center',
        background: token.colorBgContainer,
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex',
        gap: 14,
        minWidth: 0,
        padding: '16px 18px',
        textAlign: 'left',
        transition: 'box-shadow 160ms ease, transform 160ms ease'
      },

      '& .home-stat-card:hover': { boxShadow: '0 5px 14px rgba(31, 49, 77, 0.11)', transform: 'translateY(-2px)' },
      '& .home-stat-icon': { alignItems: 'center', borderRadius: 10, display: 'inline-flex', flex: '0 0 auto', height: 44, justifyContent: 'center', width: 44 },
      '& .home-stat-body': { display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0 },
      '& .home-stat-label': { color: token.colorTextSecondary, fontSize: 12, marginBottom: 2 },
      '& .home-stat-value': { color: token.colorText, fontSize: 24, fontWeight: 700, lineHeight: 1.2 },
      '& .home-stat-arrow': { color: token.colorTextSecondary, fontSize: 20 },

      '& .home-main-grid': { alignItems: 'start', display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1fr) 300px', marginTop: 16 },
      '& .home-left, & .home-right': { display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 },
      '& .home-panel-card': { boxShadow: '0 2px 6px rgba(39, 58, 83, 0.025)' },
      '& .home-card-heading': { alignItems: 'center', display: 'flex', gap: 10, minWidth: 0 },
      '& .home-card-title': { alignItems: 'center', color: token.colorText, display: 'flex', flex: 1, fontSize: 15, fontWeight: 600, gap: 8 },
      '& .home-card-title::before': { background: token.colorPrimary, borderRadius: 2, content: '""', display: 'inline-block', height: 14, width: 3 },
      '& .home-card-subtitle': { color: token.colorTextSecondary, fontSize: 12 },
      '& .home-trend-up': { color: token.colorSuccess },
      '& .home-chart': { height: 280, width: '100%' },
      '& .home-small-chart': { height: 200, width: '100%' },

      '& .home-health-actions': { display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' },
      '& .home-health-grid': { display: 'grid', gap: 8, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
      '& .home-health-item': {
        alignItems: 'center',
        background: '#fbfcfe',
        border: `1px solid ${token.colorBorder}`,
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
        padding: '10px 6px 8px',
        transition: 'box-shadow 160ms ease, transform 160ms ease'
      },

      '& .home-health-item:hover': { boxShadow: '0 4px 12px rgba(31, 49, 77, 0.1)', transform: 'translateY(-2px)' },
      '& .home-health-item.normal': { background: 'rgba(42, 168, 118, 0.04)', borderColor: 'rgba(42, 168, 118, 0.25)' },
      '& .home-health-item.error': { background: 'rgba(223, 109, 103, 0.04)', borderColor: 'rgba(223, 109, 103, 0.3)' },
      '& .home-health-icon': { alignItems: 'center', background: '#edf2ff', borderRadius: 7, color: token.colorPrimary, display: 'inline-flex', height: 28, justifyContent: 'center', width: 28 },
      '& .home-health-name': { color: token.colorText, fontSize: 11, fontWeight: 500, overflow: 'hidden', textAlign: 'center', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' },
      '& .home-health-status': { alignItems: 'center', color: token.colorTextSecondary, display: 'flex', fontSize: 10, gap: 3 },
      '& .home-status-dot': { borderRadius: '50%', display: 'inline-block', height: 6, width: 6 },
      '& .home-status-dot.normal': { background: token.colorSuccess },
      '& .home-status-dot.error': { background: token.colorError },
      '& .home-status-dot.unknown': { background: '#adb7c5' },
      '& .home-health-footer': { display: 'flex', justifyContent: 'center', marginTop: 12 },

      '& .home-governance-row': { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
      '& .home-quick-list, & .home-work-list, & .home-task-list': { display: 'flex', flexDirection: 'column' },
      '& .home-quick-item, & .home-work-item, & .home-task-item': {
        alignItems: 'center',
        background: 'transparent',
        border: 0,
        borderRadius: 6,
        color: token.colorText,
        cursor: 'pointer',
        display: 'flex',
        font: 'inherit',
        gap: 9,
        minWidth: 0,
        padding: '9px 6px',
        textAlign: 'left',
        transition: 'background 150ms ease'
      },

      '& .home-quick-item:hover, & .home-work-item:hover:not(:disabled), & .home-task-item:hover': { background: '#f5f7fb' },
      '& .home-work-item': { borderBottom: `1px solid ${token.colorBorder}`, borderRadius: 0, padding: '10px 4px' },
      '& .home-work-item:last-child': { borderBottom: 0 },
      '& .home-work-item:disabled': { cursor: 'default', opacity: 0.48 },
      '& .home-quick-icon, & .home-work-icon': { alignItems: 'center', borderRadius: 8, display: 'inline-flex', flex: '0 0 auto', height: 30, justifyContent: 'center', width: 30 },
      '& .home-quick-label, & .home-work-label, & .home-task-name': { flex: 1, fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      '& .home-shortcut, & .home-task-time': { color: token.colorTextSecondary, fontSize: 11, whiteSpace: 'nowrap' },
      '& .home-task-dot': { borderRadius: '50%', display: 'inline-block', flex: '0 0 auto', height: 8, width: 8 },
      '& .home-task-dot.success': { background: token.colorSuccess },
      '& .home-task-dot.failed': { background: token.colorError },
      '& .home-task-dot.running': { background: token.colorPrimary, boxShadow: `0 0 0 3px rgba(75, 117, 255, 0.15)` },
      '& .home-load-error': { alignItems: 'center', color: token.colorTextSecondary, display: 'flex', fontSize: 12, gap: 8, marginTop: 16 },

      '@media (max-width: 1400px)': { '& .home-stat-row': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' } },
      '@media (max-width: 1200px)': { '& .home-main-grid': { gridTemplateColumns: '1fr' }, '& .home-governance-row': { gridTemplateColumns: '1fr' } },
      '@media (max-width: 900px)': { '& .home-stat-row': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, '& .home-health-grid': { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' } },
      '@media (max-width: 560px)': {
        padding: '18px 16px 36px',
        '& .home-welcome': { alignItems: 'flex-start', flexDirection: 'column', gap: 5 },
        '& .home-stat-row': { gap: 10, gridTemplateColumns: '1fr' },
        '& .home-main-grid': { gap: 10, marginTop: 10 },
        '& .home-health-grid': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
        '& .home-health-actions': { justifyContent: 'flex-start', marginTop: 8 }
      }
    }
  })
}));
