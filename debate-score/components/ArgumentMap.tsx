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
  claim: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-500/40', text: 'text-amber-800 dark:text-amber-200' },
  rebuttal: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-500/40', text: 'text-rose-800 dark:text-rose-200' },
  evidence: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-500/40', text: 'text-emerald-800 dark:text-emerald-200' },
  concession: { bg: 'bg-stone-50 dark:bg-stone-800/50', border: 'border-stone-200 dark:border-stone-600/40', text: 'text-stone-800 dark:text-stone-200' },
};

const DEBATER_COLORS = {
  A: { ring: 'ring-amber-500', label: 'bg-amber-600' },
  B: { ring: 'ring-stone-400', label: 'bg-stone-500' },
};

const EDGE_STYLES = {
  supports: { stroke: '#10b981', label: 'supports', animated: false },
  rebuts: { stroke: '#f43f5e', label: 'rebuts', animated: true },
  concedes_to: { stroke: '#f59e0b', label: 'concedes', animated: false },
  qualifies: { stroke: '#78716c', label: 'qualifies', animated: false },
};

function ArgumentNodeCard({ data }: { data: { node: ArgNode; debaterName: string } }) {
  const { node, debaterName } = data;
  const typeStyle = NODE_TYPE_STYLES[node.type] || NODE_TYPE_STYLES.claim;
  const debaterColor = DEBATER_COLORS[node.debater as 'A' | 'B'] || DEBATER_COLORS.A;

  return (
    <div
      className={`${typeStyle.bg} border ${typeStyle.border} rounded-xl p-3 max-w-56 shadow-md ring-1 ${debaterColor.ring} ring-opacity-20 transition-all hover:shadow-lg`}
    >
      <Handle type="target" position={Position.Top} className="!bg-stone-400 dark:!bg-stone-600 !border-none" />
      <div className="flex items-center justify-between gap-2 mb-2 pb-1 border-b border-black/5 dark:border-white/5">
        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white uppercase tracking-tighter ${debaterColor.label}`}>
          {debaterName}
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-widest opacity-50 ${typeStyle.text}`}>{node.type}</span>
      </div>
      <p className={`text-xs leading-relaxed font-serif ${typeStyle.text}`}>{node.claim}</p>
      <Handle type="source" position={Position.Bottom} className="!bg-stone-400 dark:!bg-stone-600 !border-none" />
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
    <div className="h-full w-full font-sans">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-[10px] font-bold uppercase tracking-widest px-1">
        <div className="flex gap-2 items-center">
          <span className="text-stone-400 dark:text-stone-500">Nodes:</span>
          {Object.entries(NODE_TYPE_STYLES).map(([type, style]) => (
            <span key={type} className={`px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text} shadow-sm`}>
              {type}
            </span>
          ))}
        </div>
        <div className="flex gap-2 items-center border-l border-stone-200 dark:border-stone-800 pl-4">
          <span className="text-stone-400 dark:text-stone-500">Links:</span>
          {Object.entries(EDGE_STYLES).map(([rel, style]) => (
            <span key={rel} style={{ color: style.stroke }} className="opacity-80">
              {style.label}
            </span>
          ))}
        </div>
      </div>

      <div style={{ height: 'calc(100% - 48px)' }} className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-inner">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-right"
          style={{ background: 'var(--background)' }}
        >
          <Background color="var(--border)" gap={20} size={1} />
          <Controls className="!bg-white dark:!bg-[#1a1a1a] !border-stone-200 dark:!border-[#2a2a2a] !shadow-lg rounded-xl overflow-hidden" />
          <MiniMap
            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px' }}
            nodeColor="var(--border)"
            maskColor="rgba(0,0,0,0.1)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
