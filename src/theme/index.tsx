import { App as AntdApp, ConfigProvider } from 'antd';
import { ThemeProvider } from 'antd-style';
import type { PropsWithChildren } from 'react';

import { dagineTheme } from './tokens';

export function BaseThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={dagineTheme}>
      <ConfigProvider theme={dagineTheme}>
        <AntdApp>{children}</AntdApp>
      </ConfigProvider>
    </ThemeProvider>
  );
}
