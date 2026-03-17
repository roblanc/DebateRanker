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
      'border-l-amber-500/50 bg-amber-500/5',
      'border-l-stone-400/50 bg-stone-400/5 dark:bg-stone-500/5',
      'border-l-orange-500/50 bg-orange-500/5',
      'border-l-stone-600/50 bg-stone-600/5',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em]">
          Transcript
        </h2>
        <div className="flex gap-1 bg-stone-100 dark:bg-[#1a1a1a] rounded-full p-1 border border-stone-200 dark:border-[#2a2a2a]">
          {(['segments', 'full'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all ${
                view === v
                  ? 'bg-[#d97706] text-white dark:text-[#0d0d0d]'
                  : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              {v === 'segments' ? 'Rounds' : 'Full'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {view === 'segments' && segments.length > 0 ? (
          segments.map((seg, i) => (
            <div
              key={seg.id}
              onClick={() => onSegmentClick?.(seg.id)}
              className={`border-l-2 pl-4 py-3 rounded-r-xl cursor-pointer transition-all duration-300 ${getSegmentColor(i)} ${
                activeSegment === seg.id
                  ? 'ring-1 ring-amber-500/30 border-l-amber-500 bg-amber-50/50 dark:bg-amber-500/5'
                  : 'hover:bg-stone-100 dark:hover:bg-white/5 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-widest">
                  Round {seg.round_number}
                </span>
                {seg.start_time && (
                  <span className="text-[10px] font-mono text-stone-400 dark:text-stone-600">[{seg.start_time}]</span>
                )}
              </div>
              {seg.topic && (
                <h4 className="text-sm font-serif text-stone-900 dark:text-white mb-2 leading-tight">
                  {seg.topic}
                </h4>
              )}
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-4 whitespace-pre-wrap font-sans opacity-80">
                {seg.content}
              </p>
              {seg.summary && (
                <div className="mt-3 text-[11px] text-amber-800/60 dark:text-amber-200/50 italic border-t border-stone-200 dark:border-white/5 pt-2 leading-snug">
                  {seg.summary}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed whitespace-pre-wrap font-sans opacity-80 px-1">
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
