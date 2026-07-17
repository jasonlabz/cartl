import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export function SystemErrorPage({ status }: { status: '403' | '404' | '500' }) {
  const navigate = useNavigate();
  const description = status === '403' ? '你没有访问此页面的权限。' : status === '404' ? '请求的页面不存在。' : '服务暂时不可用，请稍后重试。';

  return (
    <main style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
      <Result extra={<Button type="primary" onClick={() => navigate('/home')}>返回工作台</Button>} status={status} subTitle={description} title={status} />
    </main>
  );
}
