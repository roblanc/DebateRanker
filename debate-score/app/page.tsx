'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DebateUpload from '@/components/DebateUpload';
import { Debate } from '@/types';

function DebateCard({ debate }: { debate: Debate }) {
  const statusColors = {
    pending: 'text-slate-400 bg-slate-800',
    analyzing: 'text-amber-400 bg-amber-900/30 animate-pulse',
    complete: 'text-emerald-400 bg-emerald-900/30',
    error: 'text-rose-400 bg-rose-900/30',
  };

  return (
    <Link href={`/debate/${debate.id}`}>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 hover:border-slate-500 hover:bg-slate-800 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-100 truncate group-hover:text-white">
              {debate.title}
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              <span className="text-blue-400">{debate.debater_a}</span>
              <span className="mx-2 text-slate-600">vs</span>
              <span className="text-violet-400">{debate.debater_b}</span>
            </p>
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${statusColors[debate.status]}`}
          >
            {debate.status}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {new Date(debate.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [debates, setDebates] = useState<Debate[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetch('/api/debates')
      .then(r => r.json())
      .then(d => setDebates(d.debates || []))
      .catch(() => {});
  }, [showUpload]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
              DR
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-none">DebateRank</h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">AI-Powered Debate Analysis</p>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(v => !v)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-1.5 rounded transition-colors"
          >
            {showUpload ? 'Cancel' : '+ New Debate'}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Hero */}
        {!showUpload && debates.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-3xl mx-auto mb-6">
              ⚖️
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Analyze Any Debate
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-2">
              Paste a transcript and get structured scoring across 8 debate mechanics,
              argument mapping, and key moment detection — powered by Claude AI.
            </p>
            <p className="text-xs text-slate-600 max-w-lg mx-auto mb-8">
              Scores logic, evidence, rhetoric, and structure — not political positions or ideology.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8 text-left">
              {[
                { icon: '📊', title: 'Round-by-Round Scoring', desc: '8 debate mechanics scored 0–10' },
                { icon: '🗺️', title: 'Argument Mapping', desc: 'Visual graph of claims & rebuttals' },
                { icon: '💥', title: 'Key Moments', desc: 'Contradictions, ad hominems & more' },
                { icon: '📤', title: 'Export Results', desc: 'Download as CSV or JSON' },
              ].map(f => (
                <div key={f.title} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className="font-semibold text-sm text-white mb-1">{f.title}</div>
                  <div className="text-xs text-slate-400">{f.desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowUpload(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-lg text-base transition-colors shadow-lg shadow-blue-900/30"
            >
              Analyze Your First Debate
            </button>
          </div>
        )}

        {/* Upload form */}
        {showUpload && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">New Debate Session</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Paste or upload a debate transcript to begin analysis
                </p>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6">
              <DebateUpload />
            </div>
          </div>
        )}

        {/* Recent debates */}
        {debates.length > 0 && (
          <div className={showUpload ? 'mt-8' : ''}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Recent Debates
              </h2>
              {!showUpload && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  + New
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {debates.map(d => <DebateCard key={d.id} debate={d} />)}
            </div>
          </div>
        )}

      </main>

      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-600">
        DebateRank — Powered by Claude Opus 4.6 · Scores debate mechanics, not ideology
      </footer>
    </div>
  );
}
