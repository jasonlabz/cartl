import createStyles from '@/utils/createStyles';

export const usePageStyles = createStyles(({ css, token }) => ({
  page: css({
    '&.console-page': {
      margin: '0 auto',
      maxWidth: 1480,
      padding: '32px 42px 48px',
      width: '100%',

      '& .console-page-toolbar': {
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16
      },

      '& .console-page-toolbar .console-page-toolbar-spacer': { flex: 1 },

      '& .console-page-card': { boxShadow: '0 2px 6px rgba(39, 58, 83, 0.025)' },

      '& .console-page-summary': {
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))',
        marginBottom: 16
      },

      '& .console-page-inline-actions': { alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 },

      '& .console-page-muted': { color: token.colorTextSecondary },

      '& .console-page-detail-grid': { display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 0.55fr)' },

      '& .console-page-code': {
        background: '#172033',
        borderRadius: 8,
        color: '#d5e3ff',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        lineHeight: 1.7,
        margin: 0,
        maxHeight: 420,
        overflow: 'auto',
        padding: 16,
        whiteSpace: 'pre-wrap'
      },

      '@media (max-width: 768px)': {
        padding: '22px 16px 36px',
        '& .console-page-detail-grid': { gridTemplateColumns: '1fr' }
      }
    }
  })
}));
