import type { PropsWithChildren } from 'react';

import { AuthProvider } from '@/context/auth-context';
import { BaseThemeProvider } from '@/theme';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <BaseThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </BaseThemeProvider>
  );
}
