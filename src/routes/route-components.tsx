import { Alert, Card, Empty, Typography } from 'antd';
import { useParams } from 'react-router-dom';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <Card bordered={false} style={{ margin: 24 }}>
      <Typography.Title level={2}>{title}</Typography.Title>
      <Typography.Paragraph type="secondary">此页面正在按 Dagine Dashboard 的原有接口和交互迁移。</Typography.Paragraph>
      <Alert message="迁移进行中" showIcon type="info" />
    </Card>
  );
}

export function IframePage() {
  const { url } = useParams();

  return url ? (
    <iframe sandbox="allow-forms allow-popups allow-same-origin allow-scripts" src={url} style={{ border: 0, height: '100%', width: '100%' }} title="嵌入页面" />
  ) : (
    <Empty description="缺少嵌入页面地址" />
  );
}

export function SystemErrorPage({ status }: { status: '403' | '404' | '500' }) {
  const description = status === '403' ? '你没有访问此页面的权限。' : status === '404' ? '请求的页面不存在。' : '服务暂时不可用，请稍后重试。';

  return <Empty description={`${status} · ${description}`} style={{ paddingTop: 120 }} />;
}
