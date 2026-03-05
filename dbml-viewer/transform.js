import dagre from 'dagre';
import { HEADER_H, ROW_H, PAD } from './TableNode';

const MIN_WIDTH = 220;

function calculateTableWidth(table) {
  let maxRow = 0;
  for (const f of table.fields || []) {
    const nameW = f.name.length * 7.5;
    const typeW = f.type.length * 6.5;
    const rowW = 60 + nameW + typeW;
    if (rowW > maxRow) maxRow = rowW;
  }
  const headerW = 24 + table.name.length * 8.5;
  return Math.max(MIN_WIDTH, maxRow, headerW);
}

function mapSourceTarget(ep0, ep1) {
  if (ep0.relation === '1' && ep1.relation === '*') return [ep1, ep0];
  if (ep1.relation === '1' && ep0.relation === '*') return [ep0, ep1];
  if (ep0.relation === '1') return [ep1, ep0];
  return [ep1, ep0];
}

export function transformSchema(schema) {
  const { tables, refs } = schema;

  // Analyze which columns need handles
  const columnHandles = {};
  for (const ref of refs) {
    if (!ref.endpoints || ref.endpoints.length < 2) continue;
    const [source, target] = mapSourceTarget(ref.endpoints[0], ref.endpoints[1]);

    if (!columnHandles[source.tableName]) columnHandles[source.tableName] = {};
    for (const f of source.fieldNames || []) {
      columnHandles[source.tableName][f] = {
        ...columnHandles[source.tableName][f],
        isSource: true,
      };
    }

    if (!columnHandles[target.tableName]) columnHandles[target.tableName] = {};
    for (const f of target.fieldNames || []) {
      columnHandles[target.tableName][f] = {
        ...columnHandles[target.tableName][f],
        isTarget: true,
      };
    }
  }

  // Create nodes
  const nodes = [];
  const dims = {};
  for (const table of tables) {
    const w = calculateTableWidth(table);
    const h = HEADER_H + (table.fields?.length || 0) * ROW_H + PAD * 2;
    dims[table.name] = { width: w, height: h };

    nodes.push({
      id: table.name,
      type: 'table',
      position: { x: 0, y: 0 },
      data: { table, columnHandles: columnHandles[table.name] || {} },
    });
  }

  // Create edges
  const edges = [];
  for (let ri = 0; ri < refs.length; ri++) {
    const ref = refs[ri];
    if (!ref.endpoints || ref.endpoints.length < 2) continue;
    const [source, target] = mapSourceTarget(ref.endpoints[0], ref.endpoints[1]);
    const sFields = source.fieldNames || [];
    const tFields = target.fieldNames || [];

    for (let i = 0; i < sFields.length; i++) {
      edges.push({
        id: `ref-${ri}-${i}`,
        source: source.tableName,
        target: target.tableName,
        sourceHandle: `${sFields[i]}-source`,
        targetHandle: `${(tFields[i] || tFields[0])}-target`,
        type: 'custom',
        style: { stroke: '#6366f1', strokeWidth: 2 },
      });
    }
  }

  // Dagre layout
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });

  for (const node of nodes) {
    g.setNode(node.id, dims[node.id]);
  }
  for (const edge of edges) {
    if (edge.source !== edge.target) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  for (const node of nodes) {
    const pos = g.node(node.id);
    const dim = dims[node.id];
    node.position = { x: pos.x - dim.width / 2, y: pos.y - dim.height / 2 };
  }

  return { nodes, edges };
}
