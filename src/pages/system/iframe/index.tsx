import { Empty } from 'antd';
import { useParams } from 'react-router-dom';

export function IframePage() {
  const { url } = useParams();
  const source = url ? decodeURIComponent(url) : '';

  return source ? <iframe sandbox="allow-forms allow-popups allow-same-origin allow-scripts" src={source} style={{ border: 0, height: '100vh', width: '100%' }} title="嵌入页面" /> : <Empty description="缺少嵌入页面地址" style={{ paddingTop: 120 }} />;
}
