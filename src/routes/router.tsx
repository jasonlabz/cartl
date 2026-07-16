import { Alert, Button, Form, Input, Result, Spin } from 'antd';
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { FormProps } from 'antd';
import type { ReactNode } from 'react';

import { useAuth } from '@/context/auth-context';
import { hasRoutePermission } from '@/routes/route-permission';
import { AuthProvider } from '@/context/auth-context';

type LoginValues = {
  password: string;
  userName: string;
};

function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const [form] = Form.useForm<LoginValues>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { module } = useParams();
  const redirect = searchParams.get('redirect') || '/home';

  if (isAuthenticated) {
    return <Navigate replace to="/home" />;
  }

  const handleSubmit: FormProps<LoginValues>['onFinish'] = async (values) => {
    await login(values.userName, values.password);
    navigate(redirect, { replace: true });
  };

  if (module && module !== 'pwd-login') {
    return (
      <section className="system-page">
        <Result
          extra={<Button onClick={() => navigate(`/login${location.search}`)}>返回密码登录</Button>}
          status="info"
          title={module === 'register' ? '注册账号' : module === 'reset-pwd' ? '重置密码' : '微信绑定'}
        />
      </section>
    );
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <p className="login-kicker">DAGINE DATA GOVERNANCE</p>
        <h1>登录 Dagine</h1>
        <p>访问数据工坊与治理工作台。</p>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="用户名" name="userName" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input autoComplete="username" placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password autoComplete="current-password" placeholder="请输入密码" />
          </Form.Item>
          <Button block htmlType="submit" type="primary">
            登录
          </Button>
        </Form>
      </section>
    </main>
  );
}

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate replace to={`/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`} />;
  }

  if (!hasRoutePermission({ path: location.pathname, roles, title: location.pathname }, user?.roles ?? [])) {
    return <Navigate replace to="/403" />;
  }

  return <>{children}</>;
}

function ConsoleFallback() {
  return <Outlet />;
}

function SystemPage({ status, title }: { status: '403' | '404' | '500'; title: string }) {
  const navigate = useNavigate();

  return (
    <section className="system-page">
      <Result extra={<Button onClick={() => navigate('/home')}>返回工作台</Button>} status={status} title={title} />
    </section>
  );
}

function IframePage() {
  const { url } = useParams();
  const source = url ? decodeURIComponent(url) : '';

  if (!source) {
    return <SystemPage status="404" title="找不到嵌入页面" />;
  }

  return <iframe className="embedded-page" src={source} title="Dagine 嵌入页面" />;
}

function HomeFallback() {
  return (
    <section className="route-fallback">
      <Spin />
      <span>正在加载工作台…</span>
    </section>
  );
}

function UnavailableRoute() {
  const location = useLocation();

  return (
    <section className="route-fallback">
      <Alert
        description={`React 页面迁移中：${location.pathname}`}
        message="该模块即将接入"
        showIcon
        type="info"
      />
    </section>
  );
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate replace to="/home" /> },
  { path: '/login/:module?', element: <LoginPage /> },
  { path: '/403', element: <SystemPage status="403" title="没有访问权限" /> },
  { path: '/404', element: <SystemPage status="404" title="页面不存在" /> },
  { path: '/500', element: <SystemPage status="500" title="服务暂时不可用" /> },
  { path: '/iframe-page/:url', element: <IframePage /> },
  {
    element: <ProtectedRoute><ConsoleFallback /></ProtectedRoute>,
    children: [
      { path: '/home', element: <HomeFallback /> },
      { path: '/standards/*', element: <UnavailableRoute /> },
      { path: '/workflow/*', element: <UnavailableRoute /> },
      { path: '/quality/*', element: <UnavailableRoute /> },
      { path: '/data-view/*', element: <UnavailableRoute /> }
    ]
  },
  { path: '*', element: <SystemPage status="404" title="页面不存在" /> }
]);

export function AppRouter() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
