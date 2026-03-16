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

type TabType = 'scores' | 'map' | 'moments';

export default function DebatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [debate, setDebate] = useState<DebateWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('scores');
  const [activeSegment, setActiveSegment] = useState<string | undefined>();
  const [mobilePanel, setMobilePanel] = useState<'transcript' | 'analysis'>('analysis');

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
    await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debate_id: id }),
    });
    fetchDebate();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
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
          <p className="text-rose-500 dark:text-rose-400 mb-4">{error || 'Debate not found'}</p>
          <Link href="/" className="text-blue-500 dark:text-blue-400 hover:text-blue-400 dark:hover:text-blue-300 text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const isAnalyzing = debate.status === 'analyzing' || debate.status === 'pending';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Link href="/" className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors flex-shrink-0">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 dark:text-white text-sm truncate">{debate.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="text-blue-600 dark:text-blue-400">{debate.debater_a}</span>
              <span className="mx-1.5 text-slate-400 dark:text-slate-600">vs</span>
              <span className="text-violet-600 dark:text-violet-400">{debate.debater_b}</span>
              {debate.segments.length > 0 && (
                <span className="text-slate-400 dark:text-slate-600 ml-2">· {debate.segments.length} rounds</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {isAnalyzing && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700/40 px-2 py-1 rounded">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </span>
            )}
            {(debate.status === 'error' || debate.status === 'analyzing') && (
              <button
                onClick={handleReanalyze}
                className="text-xs text-rose-500 dark:text-rose-400 hover:text-rose-400 dark:hover:text-rose-300 border border-rose-300 dark:border-rose-700/40 px-2 py-1 rounded transition-colors"
              >
                Retry analysis
              </button>
            )}
            {debate.status === 'complete' && (
              <div className="flex gap-1">
                <button
                  onClick={() => handleExport('csv')}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 px-2 py-1 rounded transition-colors"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 px-2 py-1 rounded transition-colors"
                >
                  JSON
                </button>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile panel toggle */}
      <div className="flex md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
        <button
          onClick={() => setMobilePanel('transcript')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            mobilePanel === 'transcript'
              ? 'text-slate-900 dark:text-white border-b-2 border-blue-500'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Transcript
        </button>
        <button
          onClick={() => setMobilePanel('analysis')}
          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
            mobilePanel === 'analysis'
              ? 'text-slate-900 dark:text-white border-b-2 border-blue-500'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Analysis
        </button>
      </div>

      {/* Main layout: left transcript | right panel */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Transcript */}
        <div className={`${mobilePanel === 'transcript' ? 'flex' : 'hidden'} md:flex w-full md:w-80 md:flex-shrink-0 border-r border-slate-200 dark:border-slate-800 p-4 overflow-hidden flex-col`}>
          <TranscriptViewer
            transcript={debate.transcript}
            segments={debate.segments}
            activeSegment={activeSegment}
            onSegmentClick={setActiveSegment}
          />
        </div>

        {/* Right: Analysis panel */}
        <div className={`${mobilePanel === 'analysis' ? 'flex' : 'hidden'} md:flex flex-1 flex-col overflow-hidden`}>
          {/* Tab nav */}
          <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-slate-200 dark:border-slate-800">
            {([
              { key: 'scores', label: 'Score Tables', icon: '📊' },
              { key: 'map', label: 'Argument Map', icon: '🗺️' },
              { key: 'moments', label: `Moments (${allMoments.length})`, icon: '💥' },
            ] as { key: TabType; label: string; icon: string }[]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}

            {/* Scoreboard always visible at right */}
            <div className="ml-auto hidden sm:flex items-center gap-3 pb-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{debate.debater_a}</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{debate.totals.debater_a.toFixed(1)}</span>
              </div>
              <span className="text-slate-400 dark:text-slate-600">vs</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{debate.debater_b}</span>
                <span className="font-bold text-violet-600 dark:text-violet-400">{debate.totals.debater_b.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'scores' && (
              <div className="h-full overflow-y-auto md:overflow-hidden p-4 flex flex-col md:flex-row gap-4">
                {/* Score tables */}
                <div className="flex-1 md:overflow-y-auto space-y-4">
                  {isAnalyzing && debate.segments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
                      <svg className="animate-spin h-8 w-8 mb-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <p className="text-sm">AI is analyzing the transcript...</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">This may take 30–90 seconds</p>
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
                <div className="w-full md:w-72 md:flex-shrink-0 md:overflow-y-auto">
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
              <div className="h-full p-4">
                <ArgumentMap
                  nodes={debate.argument_nodes}
                  edges={debate.argument_edges}
                  debaterA={debate.debater_a}
                  debaterB={debate.debater_b}
                />
              </div>
            )}

            {activeTab === 'moments' && (
              <div className="h-full overflow-y-auto p-4">
                <div className="max-w-2xl">
                  {isAnalyzing && allMoments.length === 0 ? (
                    <p className="text-slate-400 dark:text-slate-500 text-sm italic">
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
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-4 py-2 flex items-center gap-6 text-xs overflow-x-auto">
          <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 font-medium uppercase tracking-wider">
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
                className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-1 rounded transition-colors ${
                  activeSegment === seg.id
                    ? 'bg-slate-200 dark:bg-slate-700'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="text-slate-500 dark:text-slate-400 font-medium">R{seg.round_number}</span>
                <div className="flex gap-1 items-center">
                  <span className={`font-bold ${winner === 'A' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {sA?.total_score.toFixed(1) ?? '—'}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">:</span>
                  <span className={`font-bold ${winner === 'B' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {sB?.total_score.toFixed(1) ?? '—'}
                  </span>
                </div>
              </button>
            );
          })}
          <div className="ml-auto flex-shrink-0 flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
            <span className="text-slate-400 dark:text-slate-500">Final</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">{debate.totals.debater_a.toFixed(1)}</span>
            <span className="text-slate-400 dark:text-slate-600">—</span>
            <span className="text-violet-600 dark:text-violet-400 font-bold">{debate.totals.debater_b.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
