'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import TranscriptViewer from '@/components/TranscriptViewer';
import ScoreTable from '@/components/ScoreTable';
import Scoreboard from '@/components/Scoreboard';
import MomentsPanel from '@/components/MomentsPanel';
import ThemeToggle from '@/components/ThemeToggle';
import { DebateWithDetails, Moment } from '@/types';

// Dynamic import to avoid SSR issues with ReactFlow
const ArgumentMap = dynamic(() => import('@/components/ArgumentMap'), { ssr: false });

type TabType = 'transcript' | 'scores' | 'map' | 'moments';

export default function DebatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [debate, setDebate] = useState<DebateWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('scores');
  const [activeSegment, setActiveSegment] = useState<string | undefined>();
  const [retrying, setRetrying] = useState(false);

  const fetchDebate = useCallback(async () => {
    try {
      const res = await fetch(`/api/debates/${id}`);
      if (!res.ok) throw new Error('Debate not found');
      const data: DebateWithDetails = await res.json();
      setDebate(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDebate();
  }, [fetchDebate]);

  // Poll while analyzing
  useEffect(() => {
    if (!debate) return;
    if (debate.status !== 'analyzing' && debate.status !== 'pending') return;

    const timer = setInterval(fetchDebate, 3000);
    return () => clearInterval(timer);
  }, [debate, fetchDebate]);

  const allMoments: Moment[] = debate?.segments.flatMap(s => s.moments) ?? [];

  const handleExport = async (format: 'csv' | 'json') => {
    const res = await fetch(`/api/export/${id}?format=${format}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debate-${id}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReanalyze = async () => {
    setRetrying(true);
    try {
      await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debate_id: id }),
      });
      await fetchDebate();
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading debate...</span>
        </div>
      </div>
    );
  }

  if (error || !debate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-400 mb-4">{error || 'Debate not found'}</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const isAnalyzing = debate.status === 'analyzing' || debate.status === 'pending';

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfc] dark:bg-[#0a0a0a]">
      {/* Top bar */}
      <header className="border-b border-stone-200 dark:border-[#1a1a1a] bg-white/80 dark:bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3">
          <Link href="/" className="text-stone-500 hover:text-[#d97706] transition-colors flex-shrink-0">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="flex-1 min-w-0">
            <h1 className="font-serif font-medium text-stone-900 dark:text-white text-base sm:text-lg truncate tracking-tight">{debate.title}</h1>
            <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-500 font-sans uppercase tracking-wider truncate mt-0.5">
              <span className="text-amber-700 dark:text-amber-200/60">{debate.debater_a}</span>
              <span className="mx-2 opacity-30 text-stone-900 dark:text-white">vs</span>
              <span className="text-amber-700 dark:text-amber-200/60">{debate.debater_b}</span>
              {debate.segments.length > 0 && (
                <span className="hidden sm:inline opacity-30 text-stone-900 dark:text-white ml-2">· {debate.segments.length} rounds</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <ThemeToggle />
            {isAnalyzing && (
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs text-amber-500 bg-amber-900/10 border border-amber-900/30 px-2 sm:px-3 py-1 rounded-full font-bold uppercase tracking-tighter">
                <svg className="animate-spin h-2.5 w-2.5 sm:h-3 sm:w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="hidden xs:inline">Analyzing</span>
              </span>
            )}
            {(debate.status === 'error' || debate.status === 'analyzing') && (
              <button
                onClick={handleReanalyze}
                disabled={retrying}
                className="text-[10px] sm:text-xs text-rose-500 hover:text-rose-400 border border-rose-900/30 bg-rose-900/10 px-2 sm:px-4 py-1 rounded-full font-bold uppercase tracking-tighter transition-all flex items-center gap-1.5"
              >
                {retrying ? (
                  <>
                    <svg className="animate-spin h-2.5 w-2.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Retrying
                  </>
                ) : (
                  'Retry'
                )}
              </button>
            )}
            {debate.status === 'complete' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="text-[10px] sm:text-xs text-stone-400 hover:text-white border border-[#2a2a2a] px-2 sm:px-3 py-1 rounded-full transition-colors font-bold uppercase tracking-tighter"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="text-[10px] sm:text-xs text-stone-400 hover:text-white border border-[#2a2a2a] px-2 sm:px-3 py-1 rounded-full transition-colors font-bold uppercase tracking-tighter"
                >
                  JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main layout: left transcript (desktop only) | right panel */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden md:h-[calc(100vh-65px)]">
        {/* Left: Transcript (Hidden on mobile, uses tab instead) */}
        <div className="hidden md:flex w-80 lg:w-96 flex-shrink-0 border-r border-stone-200 dark:border-[#1a1a1a] p-6 overflow-hidden flex-col bg-stone-50/50 dark:bg-[#0d0d0d]">
          <TranscriptViewer
            transcript={debate.transcript}
            segments={debate.segments}
            activeSegment={activeSegment}
            onSegmentClick={setActiveSegment}
          />
        </div>

        {/* Right: Analysis panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#fdfdfc] dark:bg-[#0a0a0a]">
          {/* Tab nav */}
          <div className="flex items-center gap-1 px-3 sm:px-6 pt-4 pb-0 border-b border-stone-200 dark:border-[#1a1a1a] overflow-x-auto no-scrollbar bg-white dark:bg-[#0d0d0d]">
            {([
              { key: 'transcript', label: 'Transcript', icon: '📄', mobileOnly: true },
              { key: 'scores', label: 'Analysis', icon: '📊' },
              { key: 'map', label: 'Structure', icon: '🗺️' },
              { key: 'moments', label: `Moments`, icon: '💥' },
            ] as { key: TabType; label: string; icon: string; mobileOnly?: boolean }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-t-lg border-b-2 transition-all duration-300 whitespace-nowrap ${
                  tab.mobileOnly ? 'md:hidden' : ''
                } ${
                  activeTab === tab.key
                    ? 'border-[#d97706] text-[#d97706] bg-[#d97706]/5'
                    : 'border-transparent text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-300'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {/* Scoreboard totals at right */}
            <div className="hidden lg:flex ml-auto items-center gap-6 pb-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest border-l border-stone-200 dark:border-[#1a1a1a] pl-6">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(217,119,6,0.5)]" />
                <span className="text-stone-500 dark:text-stone-400 truncate max-w-[100px]">{debate.debater_a}</span>
                <span className="text-stone-900 dark:text-white">{debate.totals.debater_a.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400 dark:bg-stone-600" />
                <span className="text-stone-500 dark:text-stone-400 truncate max-w-[100px]">{debate.debater_b}</span>
                <span className="text-stone-900 dark:text-white">{debate.totals.debater_b.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto md:overflow-hidden">
            {activeTab === 'transcript' && (
              <div className="md:hidden h-full p-4">
                <TranscriptViewer
                  transcript={debate.transcript}
                  segments={debate.segments}
                  activeSegment={activeSegment}
                  onSegmentClick={setActiveSegment}
                />
              </div>
            )}

            {activeTab === 'scores' && (
              <div className="h-full flex flex-col lg:flex-row gap-4 overflow-y-auto md:overflow-hidden p-3 sm:p-4">
                {/* Score tables */}
                <div className="flex-1 md:overflow-y-auto space-y-4">
                  {isAnalyzing && debate.segments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <svg className="animate-spin h-8 w-8 mb-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="text-sm">AI is analyzing the transcript...</p>
                      <p className="text-xs text-slate-500 mt-1">This may take 30–90 seconds</p>
                    </div>
                  )}
                  {debate.segments.map(seg => (
                    <ScoreTable
                      key={seg.id}
                      segment={seg}
                      scores={seg.scores}
                      debaterA={debate.debater_a}
                      debaterB={debate.debater_b}
                    />
                  ))}
                </div>

                {/* Scoreboard sidebar */}
                <div className="w-full lg:w-72 flex-shrink-0 lg:overflow-y-auto">
                  <Scoreboard
                    debaterA={debate.debater_a}
                    debaterB={debate.debater_b}
                    totalA={debate.totals.debater_a}
                    totalB={debate.totals.debater_b}
                    segments={debate.segments}
                  />
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <div className="h-[400px] md:h-full p-3 sm:p-4">
                <ArgumentMap
                  nodes={debate.argument_nodes}
                  edges={debate.argument_edges}
                  debaterA={debate.debater_a}
                  debaterB={debate.debater_b}
                />
              </div>
            )}

            {activeTab === 'moments' && (
              <div className="h-full overflow-y-auto p-3 sm:p-4">
                <div className="max-w-2xl mx-auto md:mx-0">
                  {isAnalyzing && allMoments.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">
                      Key moments will appear as analysis completes...
                    </p>
                  ) : (
                    <MomentsPanel
                      moments={allMoments}
                      debaterA={debate.debater_a}
                      debaterB={debate.debater_b}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom scoreboard strip */}
      {debate.status === 'complete' && debate.segments.length > 0 && (
        <div className="border-t border-stone-200 dark:border-[#1a1a1a] bg-white/80 dark:bg-[#0d0d0d]/50 px-3 sm:px-4 py-2 flex items-center gap-3 sm:gap-6 text-[10px] sm:text-xs overflow-x-auto no-scrollbar">
          <span className="text-stone-400 dark:text-stone-500 flex-shrink-0 font-medium uppercase tracking-wider hidden xs:inline">
            Cumulative
          </span>
          {debate.segments.map(seg => {
            const sA = seg.scores.find(s => s.debater === 'A');
            const sB = seg.scores.find(s => s.debater === 'B');
            const winner =
              !sA ? 'B' : !sB ? 'A' :
              sA.total_score > sB.total_score ? 'A' : 'B';
            return (
              <button
                key={seg.id}
                onClick={() => {
                  setActiveSegment(seg.id);
                  setActiveTab('scores');
                }}
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-2.5 sm:px-3 py-1 rounded transition-colors ${
                  activeSegment === seg.id
                    ? 'bg-stone-200 dark:bg-stone-700'
                    : 'hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <span className="text-stone-500 dark:text-stone-400 font-medium">R{seg.round_number}</span>
                <div className="flex gap-1 items-center">
                  <span className={`font-bold ${winner === 'A' ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'}`}>
                    {sA?.total_score.toFixed(1) ?? '—'}
                  </span>
                  <span className="text-stone-300 dark:text-stone-700">:</span>
                  <span className={`font-bold ${winner === 'B' ? 'text-stone-600 dark:text-stone-300' : 'text-stone-400 dark:text-stone-500'}`}>
                    {sB?.total_score.toFixed(1) ?? '—'}
                  </span>
                </div>
              </button>
            );
          })}
          <div className="ml-auto flex-shrink-0 flex items-center gap-2 border-l border-stone-200 dark:border-stone-700 pl-3 sm:pl-4">
            <span className="text-stone-400 dark:text-stone-500 hidden xs:inline">Final</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{debate.totals.debater_a.toFixed(1)}</span>
            <span className="text-stone-300 dark:text-stone-600">—</span>
            <span className="text-stone-600 dark:text-white font-bold">{debate.totals.debater_b.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
