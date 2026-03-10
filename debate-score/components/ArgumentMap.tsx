'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArgumentNode as ArgNode, ArgumentEdge as ArgEdge } from '@/types';

interface ArgumentMapProps {
  nodes: ArgNode[];
  edges: ArgEdge[];
  debaterA: string;
  debaterB: string;
}

const NODE_TYPE_STYLES = {
  claim: { bg: 'bg-blue-900/80', border: 'border-blue-500/60', text: 'text-blue-200' },
  rebuttal: { bg: 'bg-rose-900/80', border: 'border-rose-500/60', text: 'text-rose-200' },
  evidence: { bg: 'bg-emerald-900/80', border: 'border-emerald-500/60', text: 'text-emerald-200' },
  concession: { bg: 'bg-amber-900/80', border: 'border-amber-500/60', text: 'text-amber-200' },
};

const DEBATER_COLORS = {
  A: { ring: 'ring-blue-400', label: 'bg-blue-600' },
  B: { ring: 'ring-violet-400', label: 'bg-violet-600' },
};

const EDGE_STYLES = {
  supports: { stroke: '#10b981', label: 'supports', animated: false },
  rebuts: { stroke: '#f43f5e', label: 'rebuts', animated: true },
  concedes_to: { stroke: '#f59e0b', label: 'concedes', animated: false },
  qualifies: { stroke: '#a78bfa', label: 'qualifies', animated: false },
};

function ArgumentNodeCard({ data }: { data: { node: ArgNode; debaterName: string } }) {
  const { node, debaterName } = data;
  const typeStyle = NODE_TYPE_STYLES[node.type] || NODE_TYPE_STYLES.claim;
  const debaterColor = DEBATER_COLORS[node.debater as 'A' | 'B'] || DEBATER_COLORS.A;

  return (
    <div
      className={`${typeStyle.bg} border ${typeStyle.border} rounded-lg p-2 max-w-48 shadow-lg ring-1 ${debaterColor.ring} ring-opacity-30`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${debaterColor.label}`}>
          {debaterName}
        </span>
        <span className={`text-xs opacity-70 ${typeStyle.text}`}>{node.type}</span>
      </div>
      <p className={`text-xs leading-snug ${typeStyle.text}`}>{node.claim}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  argumentNode: ArgumentNodeCard,
};

export default function ArgumentMap({ nodes, edges, debaterA, debaterB }: ArgumentMapProps) {
  const flowNodes: Node[] = useMemo(() =>
    nodes.map(n => ({
      id: n.id,
      type: 'argumentNode',
      position: { x: n.position_x ?? 0, y: n.position_y ?? 0 },
      data: {
        node: n,
        debaterName: n.debater === 'A' ? debaterA : debaterB,
      },
    })),
    [nodes, debaterA, debaterB]
  );

  const flowEdges: Edge[] = useMemo(() =>
    edges.map(e => {
      const style = EDGE_STYLES[e.relationship as keyof typeof EDGE_STYLES] || EDGE_STYLES.supports;
      return {
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        animated: style.animated,
        label: style.label,
        labelStyle: { fill: style.stroke, fontSize: 9 },
        style: { stroke: style.stroke, strokeWidth: 1.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: style.stroke,
        },
      };
    }),
    [edges]
  );

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm italic">
        Argument map will appear after analysis completes
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3 text-xs">
        <div className="flex gap-2 items-center">
          <span className="font-semibold text-slate-400">Nodes:</span>
          {Object.entries(NODE_TYPE_STYLES).map(([type, style]) => (
            <span key={type} className={`px-1.5 py-0.5 rounded border ${style.bg} ${style.border} ${style.text}`}>
              {type}
            </span>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="font-semibold text-slate-400">Edges:</span>
          {Object.entries(EDGE_STYLES).map(([rel, style]) => (
            <span key={rel} style={{ color: style.stroke }} className="font-medium">
              {style.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ height: 'calc(100% - 40px)' }} className="rounded-lg overflow-hidden border border-slate-700/50">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-right"
          style={{ background: '#0f172a' }}
        >
          <Background color="#1e293b" gap={20} />
          <Controls style={{ background: '#1e293b', border: '1px solid #334155' }} />
          <MiniMap
            style={{ background: '#0f172a', border: '1px solid #334155' }}
            nodeColor="#334155"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
