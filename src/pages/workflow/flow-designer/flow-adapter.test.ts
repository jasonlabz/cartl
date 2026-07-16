import { describe, expect, it } from 'vitest';

import { canConnect, fromReactFlow, toReactFlow, type FlowDocument } from './flow-adapter';

describe('flow adapter', () => {
  const document: FlowDocument = {
    edges: [
      {
        id: 'edge-source-transform',
        source: 'source-orders',
        sourceHandle: 'output',
        target: 'transform-clean',
        targetHandle: 'input'
      }
    ],
    nodes: [
      {
        id: 'source-orders',
        operator: 'mysql-source',
        parameter: { table: 'orders' },
        position: { x: 24, y: 48 },
        type: 'source'
      },
      {
        id: 'transform-clean',
        operator: 'clean-fields',
        parameter: { remove_empty: true },
        position: { x: 320, y: 48 },
        type: 'transform'
      }
    ],
    revision: 'rev-1'
  };

  it('round-trips persisted nodes and edges without losing flow data', () => {
    const result = fromReactFlow(toReactFlow(document), document.revision);

    expect(result).toEqual(document);
  });

  it('rejects self connections and duplicate directional connections', () => {
    expect(canConnect({ source: 'source-orders', target: 'source-orders' }, document.edges)).toBe(false);
    expect(canConnect({ source: 'source-orders', target: 'transform-clean' }, document.edges)).toBe(false);
    expect(canConnect({ source: 'transform-clean', target: 'source-orders' }, document.edges)).toBe(true);
  });
});
