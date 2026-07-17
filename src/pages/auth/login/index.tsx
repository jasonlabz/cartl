import { Button, Card, Checkbox, Divider, Form, Input, Result, Space, Typography, message } from 'antd';
import { KeyRound, LockKeyhole, Sparkles, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/context/auth-context';
import createStyles from '@/utils/createStyles';

const useStyles = createStyles(({ css, token }) => ({
  page: css({
    '&.login-page': {
      width: 420,

      '& .login-page-card': {
        boxShadow: '0 18px 46px rgba(65, 93, 145, 0.14)'
      },

      '& .login-page-brand': {
        alignItems: 'center',
        display: 'flex',
        gap: 11,
        marginBottom: 26
      },

      '& .login-page-brand-mark': {
        alignItems: 'center',
        background: token.colorPrimary,
        borderRadius: 10,
        color: '#fff',
        display: 'inline-flex',
        height: 38,
        justifyContent: 'center',
        width: 38
      },

      '& .login-page-brand-copy': { display: 'flex', flexDirection: 'column' },
      '& .login-page-brand-copy strong': { color: token.colorText, fontSize: 20, letterSpacing: '-0.04em' },
      '& .login-page-brand-copy span': { color: token.colorTextSecondary, fontSize: 9, letterSpacing: '0.12em', marginTop: 2 },
      '& .login-page-heading': { marginBottom: 24 },
      '& .login-page-heading h1': { fontSize: 23, margin: 0 },
      '& .login-page-heading p': { color: token.colorTextSecondary, fontSize: 13, margin: '7px 0 0' },
      '@media (max-width: 480px)': { width: '100%' }
    }
  })
}));

type LoginValues = {
  password: string;
  userName: string;
};

function AuxiliaryLogin({ module }: { module: string }) {
  const navigate = useNavigate();
  const labels: Record<string, string> = {
    'bind-wechat': '微信绑定',
    'code-login': '验证码登录',
    register: '注册账号',
    'reset-pwd': '重置密码'
  };

  return (
    <Card style={{ maxWidth: 420, width: '100%' }}>
      <Result
        extra={<Button type="primary" onClick={() => navigate('/login')}>返回密码登录</Button>}
        status="info"
        subTitle="原系统该入口未接入独立后端契约，保留页面切换与返回行为。"
        title={labels[module] ?? '登录'}
      />
    </Card>
  );
}

export function LoginPage() {
  const { cx, styles } = useStyles();
  const { isAuthenticated, login } = useAuth();
  const [form] = Form.useForm<LoginValues>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { module = 'pwd-login' } = useParams();
  const [searchParams] = useSearchParams();

  if (isAuthenticated) {
    return <Navigate replace to="/home" />;
  }

  if (module !== 'pwd-login') {
    return <AuxiliaryLogin module={module} />;
  }

  async function handleSubmit(values: LoginValues) {
    setLoading(true);
    try {
      await login(values.userName, values.password);
      navigate(searchParams.get('redirect') || '/home', { replace: true });
    } catch {
      message.error('登录失败，请检查用户名和密码。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={cx('login-page', styles.page)}>
      <Card className="login-page-card" styles={{ body: { padding: '34px 36px' } }}>
        <div className="login-page-brand">
          <span className="login-page-brand-mark"><Sparkles size={20} /></span>
          <span className="login-page-brand-copy"><strong>dagine</strong><span>DATA GOVERNANCE</span></span>
        </div>
        <div className="login-page-heading">
          <Typography.Title level={2}>欢迎登录</Typography.Title>
          <p>进入 Dagine 数据治理工作台。</p>
        </div>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="用户名" name="userName" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input autoComplete="username" prefix={<UserRound size={16} />} placeholder="请输入用户名" size="large" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password autoComplete="current-password" prefix={<LockKeyhole size={16} />} placeholder="请输入密码" size="large" />
          </Form.Item>
          <Space orientation="vertical" size={18} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Checkbox>记住我</Checkbox>
              <Button type="link" onClick={() => navigate('/login/reset-pwd')}>忘记密码</Button>
            </div>
            <Button block htmlType="submit" loading={loading} size="large" type="primary">登录</Button>
            <Divider plain>其他方式</Divider>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button block icon={<KeyRound size={15} />} onClick={() => navigate('/login/code-login')}>验证码登录</Button>
              <Button block onClick={() => navigate('/login/register')}>注册账号</Button>
            </div>
          </Space>
        </Form>
      </Card>
    </section>
  );
}
