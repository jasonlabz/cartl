import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from '@/context/auth-context';

export { router } from './index';

import { router } from './index';

export function AppRouter() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
