import createStyles from '@/utils/createStyles';

export const useStyles = createStyles(({ css, token }) => ({
  layout: css({
    '&.page-card-layout': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginLG,
      margin: '0 auto',
      maxWidth: 1480,
      minWidth: 0,
      padding: '34px 42px 50px',
      width: '100%',

      '& .page-card-layout-card': {
        borderColor: token.colorBorder,
        boxShadow: '0 2px 6px rgba(39, 58, 83, 0.025)'
      },

      '@media (max-width: 768px)': {
        gap: token.margin,
        padding: '24px 20px 36px'
      },

      '@media (max-width: 390px)': {
        padding: '18px 14px 30px'
      }
    }
  })
}));
