'use client';

import { useState, useRef } from 'react';
import { Segment } from '@/types';

interface TranscriptViewerProps {
  transcript: string;
  segments: Segment[];
  activeSegment?: string;
  onSegmentClick?: (segmentId: string) => void;
}

export default function TranscriptViewer({
  transcript,
  segments,
  activeSegment,
  onSegmentClick,
}: TranscriptViewerProps) {
  const [view, setView] = useState<'full' | 'segments'>('segments');

  const getSegmentColor = (index: number) => {
    const colors = [
      'border-l-blue-400 bg-blue-950/20',
      'border-l-violet-400 bg-violet-950/20',
      'border-l-emerald-400 bg-emerald-950/20',
      'border-l-amber-400 bg-amber-950/20',
      'border-l-rose-400 bg-rose-950/20',
      'border-l-cyan-400 bg-cyan-950/20',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Transcript
        </h2>
        <div className="flex gap-1 bg-slate-800 rounded p-0.5">
          {(['segments', 'full'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                view === v
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {v === 'segments' ? 'By Round' : 'Full'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {view === 'segments' && segments.length > 0 ? (
          segments.map((seg, i) => (
            <div
              key={seg.id}
              onClick={() => onSegmentClick?.(seg.id)}
              className={`border-l-2 pl-3 py-2 rounded-r cursor-pointer transition-all ${getSegmentColor(i)} ${
                activeSegment === seg.id
                  ? 'ring-1 ring-slate-500'
                  : 'hover:brightness-110'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-slate-300">
                  Round {seg.round_number}
                </span>
                {seg.start_time && (
                  <span className="text-xs text-slate-500">[{seg.start_time}]</span>
                )}
                {seg.topic && (
                  <span className="text-xs text-slate-400 italic truncate">
                    — {seg.topic}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-4 whitespace-pre-wrap">
                {seg.content}
              </p>
              {seg.summary && (
                <p className="mt-2 text-xs text-slate-400 italic border-t border-slate-700/50 pt-1">
                  {seg.summary}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
            {transcript}
          </div>
        )}

        {view === 'segments' && segments.length === 0 && (
          <div className="text-xs text-slate-500 italic text-center py-8">
            Analysis in progress — segments will appear here...
          </div>
        )}
      </div>
    </div>
  );
}
