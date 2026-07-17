import { Outlet } from 'react-router-dom';

import createStyles from '@/utils/createStyles';

const useStyles = createStyles(({ css }) => ({
  layout: css({
    '&.login-layout': {
      alignItems: 'center',
      background: 'radial-gradient(circle at 0 0, #dce7ff 0, transparent 38%), #f4f7fc',
      display: 'flex',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 24
    }
  })
}));

export function LoginLayout() {
  const { cx, styles } = useStyles();

  return <main className={cx('login-layout', styles.layout)}><Outlet /></main>;
}
