import { Button, Card, Descriptions, Empty, Input, Spin, Table, Tag } from 'antd';
import { ArrowLeft, FileClock, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getValueDomainDetailApi, getValueDomainVersionValuesApi, getValueDomainVersionsApi, updateValueDomainVersionValuesApi } from '@/services/standards';
import type { ValueDomain, VersionInfo } from '@/types/standards';

export function ValueDomainDetailPage() {
  const { domainId } = useParams();
  const navigate = useNavigate();
  const [domain, setDomain] = useState<ValueDomain | null>(null);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [config, setConfig] = useState('[]');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = Number(domainId);
    if (!id) return;
    void (async () => {
      setLoading(true);
      try {
        const [nextDomain, nextVersions] = await Promise.all([getValueDomainDetailApi(id), getValueDomainVersionsApi(id)]);
        setDomain(nextDomain);
        setVersions(nextVersions);
        const draft = nextVersions.find((version) => version.status === 'draft') ?? nextVersions[0];
        if (draft) {
          const values = await getValueDomainVersionValuesApi(id, draft.id);
          setConfig(values.config || '[]');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [domainId]);

  if (loading) return <Spin fullscreen />;
  if (!domain) return <Empty description="未找到值域标准" />;
  const editableVersion = versions.find((version) => version.status === 'draft');

  return (
    <section className="console-page">
      <Button icon={<ArrowLeft size={16} />} type="link" onClick={() => navigate('/standards/value-domain')}>返回值域标准</Button>
      <div className="console-page-detail-grid" style={{ marginTop: 12 }}>
        <Card title={domain.name}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="说明">{domain.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="来源">{domain.source || '-'}</Descriptions.Item>
            <Descriptions.Item label="分类">{domain.category || '-'}</Descriptions.Item>
          </Descriptions>
          <Card size="small" style={{ marginTop: 16 }} title="代码表配置" extra={editableVersion ? <Button icon={<Save size={15} />} loading={saving} type="primary" onClick={async () => { try { setSaving(true); await updateValueDomainVersionValuesApi(domain.id, editableVersion.id, JSON.parse(config)); } finally { setSaving(false); } }}>保存草稿</Button> : null}>
            <Input.TextArea autoSize={{ minRows: 14 }} value={config} onChange={(event) => setConfig(event.target.value)} />
          </Card>
        </Card>
        <Card title={<><FileClock size={16} style={{ marginRight: 8 }} />版本记录</>}>
          <Table<VersionInfo> columns={[{ dataIndex: 'version_number', title: '版本' }, { dataIndex: 'status', title: '状态', render: (status: string) => <Tag color={status === 'published' ? 'success' : 'gold'}>{status}</Tag> }, { dataIndex: 'created_at', title: '创建时间' }]} dataSource={versions} pagination={false} rowKey="id" size="small" />
        </Card>
      </div>
    </section>
  );
}
