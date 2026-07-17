import { Button, Card, Descriptions, Empty, Input, Spin, Table, Tag } from 'antd';
import { ArrowLeft, FileClock, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getMetadataDetailApi, getMetadataVersionFieldsApi, getMetadataVersionsApi, updateMetadataVersionFieldsApi } from '@/services/standards';
import type { MetadataStandard, VersionInfo } from '@/types/standards';

export function MetadataDetailPage() {
  const { standardId } = useParams();
  const navigate = useNavigate();
  const [standard, setStandard] = useState<MetadataStandard | null>(null);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [config, setConfig] = useState('[]');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = Number(standardId);
    if (!id) return;
    void (async () => {
      setLoading(true);
      try {
        const [nextStandard, nextVersions] = await Promise.all([getMetadataDetailApi(id), getMetadataVersionsApi(id)]);
        setStandard(nextStandard);
        setVersions(nextVersions);
        const draft = nextVersions.find((version) => version.status === 'draft') ?? nextVersions[0];
        if (draft) setConfig((await getMetadataVersionFieldsApi(id, draft.id)).config || '[]');
      } finally {
        setLoading(false);
      }
    })();
  }, [standardId]);

  if (loading) return <Spin fullscreen />;
  if (!standard) return <Empty description="未找到元数据标准" />;
  const editableVersion = versions.find((version) => version.status === 'draft');

  return (
    <section className="console-page">
      <Button icon={<ArrowLeft size={16} />} type="link" onClick={() => navigate('/standards/metadata')}>返回元数据标准</Button>
      <div className="console-page-detail-grid" style={{ marginTop: 12 }}>
        <Card title={standard.name}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="数据类型"><Tag color="cyan">{standard.data_type}</Tag></Descriptions.Item>
            <Descriptions.Item label="说明">{standard.description || '-'}</Descriptions.Item>
            <Descriptions.Item label="分类">{standard.category || '-'}</Descriptions.Item>
          </Descriptions>
          <Card size="small" style={{ marginTop: 16 }} title="字段配置" extra={editableVersion ? <Button icon={<Save size={15} />} loading={saving} type="primary" onClick={async () => { try { setSaving(true); await updateMetadataVersionFieldsApi(standard.id, editableVersion.id, JSON.parse(config)); } finally { setSaving(false); } }}>保存草稿</Button> : null}>
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
