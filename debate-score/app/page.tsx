'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DebateUpload from '@/components/DebateUpload';
import { Debate } from '@/types';

function DebateCard({ debate }: { debate: Debate }) {
  const statusColors = {
    pending: 'text-stone-400 bg-stone-800',
    analyzing: 'text-amber-500 bg-amber-900/10 animate-pulse border border-amber-900/30',
    complete: 'text-emerald-500 bg-emerald-900/10 border border-emerald-900/30',
    error: 'text-rose-500 bg-rose-900/10 border border-rose-900/30',
  };

  return (
    <Link href={`/debate/${debate.id}`}>
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 hover:border-[#3a3a3a] hover:bg-[#1e1e1e] transition-all cursor-pointer group shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-medium text-[#e5e5e5] truncate group-hover:text-white leading-tight mb-1">
              {debate.title}
            </h3>
            <p className="text-sm font-sans text-stone-400 mt-1">
              <span className="text-amber-200/70">{debate.debater_a}</span>
              <span className="mx-2 text-stone-600">vs</span>
              <span className="text-amber-200/70">{debate.debater_b}</span>
            </p>
          </div>
          <span
            className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold flex-shrink-0 ${statusColors[debate.status]}`}
          >
            {debate.status}
          </span>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2a2a2a]/50">
          <p className="text-[10px] text-stone-500 font-mono uppercase tracking-tighter">
            {new Date(debate.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <div className="text-stone-600 group-hover:text-amber-500 transition-colors">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
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
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] bg-[#0d0d0d]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#d97706] flex items-center justify-center text-[#0d0d0d] font-serif font-bold text-lg shadow-inner">
              D
            </div>
            <div className="min-w-0">
              <h1 className="font-serif font-medium text-[#e5e5e5] text-xl sm:text-2xl leading-none tracking-tight">DebateRank</h1>
              <p className="text-[10px] sm:text-xs text-stone-500 font-sans uppercase tracking-[0.1em] mt-1.5 opacity-70">Scholarly Analysis</p>
            </div>
          </div>
          <button
            onClick={() => setShowUpload(v => !v)}
            className="bg-[#d97706]/10 hover:bg-[#d97706]/20 text-[#d97706] border border-[#d97706]/30 text-[11px] sm:text-xs font-bold uppercase tracking-widest px-4 sm:px-6 py-2 rounded-full transition-all duration-300"
          >
            {showUpload ? 'Cancel' : (
              <span className="flex items-center gap-2">
                <span className="hidden xs:inline">New Analysis</span>
                <span className="xs:hidden">New</span>
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero */}
        {!showUpload && debates.length === 0 && (
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl sm:text-6xl font-serif font-medium text-white mb-6 leading-[1.1] tracking-tight">
              A more rigorous way to <span className="italic text-[#d97706]">evaluate debates.</span>
            </h2>
            <p className="text-lg sm:text-xl text-stone-400 font-sans leading-relaxed mb-10 max-w-2xl mx-auto">
              Analyze transcripts with Claude AI to uncover logic, evidence, and framing. 
              Objective scoring that focuses on mechanics, not ideology.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left mb-12">
              {[
                { icon: '📊', title: 'Round-by-Round Metrics', desc: 'Detailed scoring on evidence, logic, and composure.' },
                { icon: '🗺️', title: 'Argument Mapping', desc: 'Visualize the structure of claims and rebuttals.' },
              ].map(f => (
                <div key={f.title} className="bg-[#151515] border border-[#222] rounded-2xl p-6 shadow-sm">
                  <div className="text-2xl mb-4">{f.icon}</div>
                  <div className="font-serif text-lg text-white mb-2">{f.title}</div>
                  <div className="text-sm text-stone-400 leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowUpload(true)}
              className="bg-[#d97706] hover:bg-[#b45309] text-[#0d0d0d] font-bold px-10 py-4 rounded-full text-sm uppercase tracking-widest transition-all shadow-xl shadow-amber-900/10 hover:scale-[1.02]"
            >
              Start First Analysis
            </button>
          </div>
        )}

        {/* Upload form */}
        {showUpload && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-serif text-white mb-2 tracking-tight">New Debate Analysis</h2>
              <p className="text-sm text-stone-400 font-sans">
                Paste a transcript or provide a YouTube link to begin.
              </p>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/50">
              <DebateUpload />
            </div>
          </div>
        )}

        {/* Recent debates */}
        {debates.length > 0 && (
          <div className={showUpload ? 'mt-20' : ''}>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#1a1a1a]">
              <h2 className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em]">
                Recent Sessions
              </h2>
              {!showUpload && (
                <button
                  onClick={() => setShowUpload(true)}
                  className="text-xs font-bold text-[#d97706] hover:text-amber-500 transition-colors uppercase tracking-widest"
                >
                  + New Session
                </button>
              )}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {debates.map(d => <DebateCard key={d.id} debate={d} />)}
            </div>
          </div>
        )}

      </main>

      <footer className="border-t border-[#1a1a1a] py-10 text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col items-center gap-4">
          <div className="font-serif text-[#d97706] text-xl font-bold italic">DebateRank</div>
          <p className="text-xs text-stone-500 font-sans uppercase tracking-[0.1em] opacity-60">
            Powered by Claude 4.6 · Evaluating mechanics, not ideology
          </p>
        </div>
      </footer>
    </div>
  );
}
