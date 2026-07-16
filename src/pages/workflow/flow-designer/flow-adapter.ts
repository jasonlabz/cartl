import type { Edge, Node } from '@xyflow/react';

export type FlowNodeType = 'router' | 'sink' | 'source' | 'transform';

export interface FlowNodeDocument {
  id: string;
  operator: string;
  parameter: Record<string, unknown>;
  position: { x: number; y: number };
  type: FlowNodeType;
}

export interface FlowEdgeDocument {
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
}

export interface FlowDocument {
  edges: FlowEdgeDocument[];
  nodes: FlowNodeDocument[];
  revision: string;
}

interface ReactFlowNodeData extends Record<string, unknown> {
  operator: string;
  parameter: Record<string, unknown>;
}

export interface ReactFlowDocument {
  edges: Edge[];
  nodes: Node<ReactFlowNodeData>[];
}

export function toReactFlow(document: FlowDocument): ReactFlowDocument {
  return {
    edges: document.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle ?? null,
      target: edge.target,
      targetHandle: edge.targetHandle ?? null
    })),
    nodes: document.nodes.map((node) => ({
      data: {
        operator: node.operator,
        parameter: node.parameter
      },
      id: node.id,
      position: node.position,
      type: node.type
    }))
  };
}

export function fromReactFlow(document: ReactFlowDocument, revision: string): FlowDocument {
  return {
    edges: document.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle
    })),
    nodes: document.nodes.map((node) => ({
      id: node.id,
      operator: node.data.operator,
      parameter: node.data.parameter,
      position: node.position,
      type: node.type as FlowNodeType
    })),
    revision
  };
}

export function canConnect(
  connection: { source?: string | null; target?: string | null },
  edges: FlowEdgeDocument[]
): boolean {
  if (!connection.source || !connection.target || connection.source === connection.target) {
    return false;
  }

  return !edges.some((edge) => edge.source === connection.source && edge.target === connection.target);
}
