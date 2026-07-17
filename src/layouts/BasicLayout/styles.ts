import createStyles from '@/utils/createStyles';

export const useStyles = createStyles(({ css, token }) => ({
  layout: css({
    '&.basic-layout': {
      minHeight: '100vh',

      '& .basic-layout-sider': {
        borderRight: `1px solid ${token.colorBorder}`,
        boxShadow: '1px 0 8px rgba(27, 45, 71, 0.035)'
      },

      '& .basic-layout-logo': {
        alignItems: 'center',
        display: 'flex',
        gap: 10,
        height: 64,
        padding: '0 20px'
      },

      '& .basic-layout-logo-mark': {
        alignItems: 'center',
        background: 'linear-gradient(135deg, #4b75ff, #718dff)',
        borderRadius: 9,
        color: '#fff',
        display: 'inline-flex',
        height: 32,
        justifyContent: 'center',
        width: 32
      },

      '& .basic-layout-logo-copy': {
        display: 'flex',
        flexDirection: 'column',
        lineHeight: 1.2
      },

      '& .basic-layout-logo-name': {
        color: '#243143',
        fontSize: 17,
        fontWeight: 750,
        letterSpacing: '-0.04em'
      },

      '& .basic-layout-logo-caption': {
        color: '#9aa6b7',
        fontSize: 8,
        letterSpacing: '0.14em',
        marginTop: 3
      },

      '& .basic-layout-menu': {
        borderInlineEnd: 0,
        padding: '4px 10px'
      },

      '& .basic-layout-header': {
        alignItems: 'center',
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorder}`,
        display: 'flex',
        height: 64,
        justifyContent: 'space-between',
        padding: '0 28px'
      },

      '& .basic-layout-breadcrumb': {
        color: token.colorTextSecondary,
        fontSize: 13
      },

      '& .basic-layout-breadcrumb strong': {
        color: token.colorText,
        fontWeight: 600
      },

      '& .basic-layout-header-actions': {
        alignItems: 'center',
        display: 'flex',
        gap: 8
      },

      '& .basic-layout-content': {
        background: '#f6f8fb',
        minHeight: 'calc(100vh - 64px)'
      },

      '@media (max-width: 768px)': {
        '& .basic-layout-header': { padding: '0 16px' },
        '& .basic-layout-header-actions .basic-layout-search': { display: 'none' }
      }
    }
  })
}));
