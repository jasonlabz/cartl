import type { ThemeConfig } from 'antd';

export const layoutTokens = {
  contentMaxWidth: 1480,
  desktopSiderWidth: 248,
  headerHeight: 65,
  mobileBreakpoint: 768,
  pageGutter: 42,
  phoneBreakpoint: 390
} as const;

export const dagineTheme: ThemeConfig = {
  components: {
    Button: { borderRadius: 6, controlHeight: 34, fontWeight: 600 },
    Card: { bodyPadding: 18, headerFontSize: 13 },
    Drawer: { footerPaddingBlock: 12, footerPaddingInline: 20 },
    Table: { cellFontSize: 12, cellPaddingBlock: 12, headerBg: '#f9fbfd', headerColor: '#738094' }
  },
  token: {
    borderRadius: 8,
    colorBgBase: '#f6f8fb',
    colorBgContainer: '#ffffff',
    colorBorder: '#e6ebf2',
    colorError: '#df6d67',
    colorInfo: '#4b75ff',
    colorPrimary: '#4b75ff',
    colorSuccess: '#2aa876',
    colorText: '#182230',
    colorTextSecondary: '#738094',
    colorWarning: '#e7964c',
    fontFamily: '"DM Sans", "Noto Sans SC", sans-serif',
    fontSize: 13
  }
};
