import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from '@xyflow/react';
import { Button, Card, Descriptions, Empty, Input, Select, Spin } from 'antd';
import { Search } from 'lucide-react';
import { useState } from 'react';

import { ConsolePage } from '@/pages/shared/page';
import { getLineageGraphApi } from '@/services/data-view';
import type { LineageGraph } from '@/types/data-view';

export function DataLineagePage() {
  const [tableName, setTableName] = useState('');
  const [depth, setDepth] = useState(2);
  const [graph, setGraph] = useState<LineageGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<LineageGraph['nodes'][number] | null>(null);

  async function search() {
    setLoading(true);
    try { setGraph(await getLineageGraphApi({ depth, table_name: tableName || undefined })); } finally { setLoading(false); }
  }

  const nodes: Node[] = (graph?.nodes ?? []).map((node, index) => ({
    data: { label: node.name }, id: node.id, position: { x: node.x_position ?? (index % 4) * 230, y: node.y_position ?? Math.floor(index / 4) * 130 }, style: { border: `1px solid ${node.type === 'source' ? '#4b75ff' : node.type === 'sink' ? '#e7964c' : '#8a72d5'}`, borderRadius: 8, padding: 10, width: 180 }
  }));
  const edges: Edge[] = (graph?.edges ?? []).map((edge, index) => ({ animated: edge.edge_type === 'transform', id: `${edge.source}-${edge.target}-${index}`, label: edge.edge_type, source: edge.source, target: edge.target }));

  return (
    <ConsolePage description="搜索表和字段的上下游依赖关系与转换逻辑。" title="数据血缘">
      <Card style={{ marginBottom: 16 }}><div className="console-page-toolbar"><Input placeholder="输入表名或资产名称" value={tableName} onChange={(event) => setTableName(event.target.value)} onPressEnter={() => void search()} style={{ width: 300 }} /><Select options={[1, 2, 3, 4].map((value) => ({ label: `${value} 层`, value }))} value={depth} onChange={setDepth} style={{ width: 110 }} /><Button icon={<Search size={15} />} loading={loading} type="primary" onClick={() => void search()}>搜索血缘</Button></div></Card>
      {loading ? <Spin /> : graph ? <div className="console-page-detail-grid"><Card style={{ height: 620 }} styles={{ body: { height: '100%', padding: 0 } }}><ReactFlow edges={edges} fitView nodes={nodes} onNodeClick={(_, node) => setSelected(graph.nodes.find((item) => item.id === node.id) ?? null)}><Background /><Controls /><MiniMap /></ReactFlow></Card><Card title="节点详情">{selected ? <Descriptions column={1} size="small"><Descriptions.Item label="名称">{selected.name}</Descriptions.Item><Descriptions.Item label="类型">{selected.type}</Descriptions.Item><Descriptions.Item label="说明">{selected.description || '-'}</Descriptions.Item></Descriptions> : <Empty description="选择节点查看详情" />}</Card></div> : <Empty description="输入表名后搜索血缘" />}
    </ConsolePage>
  );
}
