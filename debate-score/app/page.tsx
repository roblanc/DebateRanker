'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { Debate } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [status, setStatus] = useState<'idle' | 'fetching' | 'creating'>('idle');
  const [error, setError] = useState('');
  const [debates, setDebates] = useState<Debate[]>([]);

  useEffect(() => {
    fetch('/api/debates')
      .then(r => r.json())
      .then(d => setDebates(d.debates || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (manualMode) textareaRef.current?.focus();
  }, [manualMode]);

  const startAnalysis = async (transcriptText: string, title: string) => {
    setStatus('creating');
    const debateRes = await fetch('/api/debates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        debater_a: 'Debater A',
        debater_b: 'Debater B',
        transcript: transcriptText,
      }),
    });
    const debateData = await debateRes.json();
    if (!debateRes.ok) throw new Error(debateData.error || 'Failed to create debate');

    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ debate_id: debateData.id }),
    });

    router.push(`/debate/${debateData.id}`);
  };

  const handleYouTubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || status !== 'idle') return;
    setError('');
    setStatus('fetching');

    try {
      const ytRes = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const ytData = await ytRes.json();
      if (!ytRes.ok) {
        // YouTube blocked — offer manual fallback
        setStatus('idle');
        setError('');
        setManualMode(true);
        return;
      }
      await startAnalysis(ytData.transcript, ytData.title || 'YouTube Debate');
    } catch {
      setStatus('idle');
      setManualMode(true);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim() || status !== 'idle') return;
    setError('');
    try {
      await startAnalysis(transcript, 'Debate Analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('idle');
    }
  };

  const isLoading = status === 'fetching' || status === 'creating';

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfdfc] dark:bg-[#0a0a0a]">
      <header className="flex items-center justify-between px-6 py-5">
        <span className="font-serif font-medium text-stone-900 dark:text-white text-lg tracking-tight">
          Debate<span className="text-[#d97706]">Rank</span>
        </span>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <div className="w-full max-w-xl">
          <h1 className="font-serif text-4xl sm:text-5xl text-stone-900 dark:text-white text-center mb-3 leading-tight tracking-tight">
            Analyze any debate.
          </h1>
          <p className="text-center text-stone-400 dark:text-stone-500 text-sm mb-10">
            {manualMode
              ? 'Paste the transcript below to continue.'
              : 'Paste a YouTube link and get structured scoring in seconds.'}
          </p>

          {!manualMode ? (
            <form onSubmit={handleYouTubeSubmit} className="relative">
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                disabled={isLoading}
                className="w-full bg-white dark:bg-[#111] border border-stone-200 dark:border-[#2a2a2a] rounded-2xl px-5 py-4 pr-[120px] text-sm text-stone-900 dark:text-white placeholder-stone-300 dark:placeholder-stone-600 focus:outline-none focus:border-[#d97706] dark:focus:border-[#d97706] transition-all shadow-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!url.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#d97706] hover:bg-[#b45309] disabled:bg-stone-200 dark:disabled:bg-stone-800 disabled:text-stone-400 text-white text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all"
              >
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : 'Analyze'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  placeholder="Paste the debate transcript here..."
                  rows={10}
                  disabled={isLoading}
                  className="w-full bg-white dark:bg-[#111] border border-stone-200 dark:border-[#2a2a2a] rounded-2xl px-5 py-4 text-sm text-stone-900 dark:text-white placeholder-stone-300 dark:placeholder-stone-600 focus:outline-none focus:border-[#d97706] dark:focus:border-[#d97706] transition-all shadow-sm resize-none disabled:opacity-50 font-mono"
                />
                {transcript && (
                  <p className="text-[10px] text-stone-400 font-mono mt-1 px-1">
                    {transcript.split(/\s+/).filter(Boolean).length} words
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setManualMode(false); setTranscript(''); setError(''); }}
                  className="flex-1 py-3 rounded-xl border border-stone-200 dark:border-[#2a2a2a] text-stone-500 dark:text-stone-400 text-[11px] font-bold uppercase tracking-widest hover:bg-stone-50 dark:hover:bg-[#151515] transition-all"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={!transcript.trim() || isLoading}
                  className="flex-[3] py-3 rounded-xl bg-[#d97706] hover:bg-[#b45309] disabled:bg-stone-200 dark:disabled:bg-stone-800 disabled:text-stone-400 text-white text-[11px] font-bold uppercase tracking-widest transition-all"
                >
                  {isLoading ? 'Starting analysis...' : 'Analyze'}
                </button>
              </div>
            </form>
          )}

          {status === 'fetching' && (
            <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-3 animate-pulse">
              Fetching transcript...
            </p>
          )}
          {status === 'creating' && (
            <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-3 animate-pulse">
              Starting analysis...
            </p>
          )}
          {error && (
            <p className="text-center text-xs text-rose-500 mt-3">{error}</p>
          )}

          {!manualMode && (
            <p className="text-center text-[11px] text-stone-300 dark:text-stone-600 mt-4">
              or{' '}
              <button
                onClick={() => setManualMode(true)}
                className="underline hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
              >
                paste transcript manually
              </button>
            </p>
          )}
        </div>
      </main>

      {debates.length > 0 && (
        <div className="max-w-xl mx-auto w-full px-4 pb-16">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 dark:text-stone-600 mb-4 text-center">
            Recent
          </p>
          <div className="space-y-2">
            {debates.slice(0, 5).map(d => (
              <Link key={d.id} href={`/debate/${d.id}`}>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-stone-100 dark:hover:bg-[#151515] transition-colors group">
                  <span className="text-sm text-stone-700 dark:text-stone-300 truncate group-hover:text-stone-900 dark:group-hover:text-white">
                    {d.title}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ml-4 flex-shrink-0 ${
                    d.status === 'complete' ? 'text-emerald-500' :
                    d.status === 'analyzing' ? 'text-amber-500 animate-pulse' :
                    d.status === 'error' ? 'text-rose-500' : 'text-stone-400'
                  }`}>
                    {d.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
