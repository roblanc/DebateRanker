'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { Debate } from '@/types';

const LOADING_MESSAGES = [
  'Watching the debate...',
  'Identifying speakers...',
  'Evaluating arguments...',
  'Scoring rhetoric...',
  'Mapping argument structure...',
  'Analyzing framing...',
  'Almost there...',
];

export default function HomePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
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

  // Cycle through loading messages
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setError('');
    setLoading(true);
    setMsgIndex(0);

    try {
      // Validate URL + get title
      const ytRes = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const ytData = await ytRes.json();
      if (!ytRes.ok) throw new Error(ytData.error || 'Invalid YouTube URL');

      // Create debate — store the YouTube URL as transcript
      const debateRes = await fetch('/api/debates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ytData.title || 'YouTube Debate',
          debater_a: 'Debater A',
          debater_b: 'Debater B',
          transcript: ytData.url, // YouTube URL — Gemini will watch it directly
        }),
      });
      const debateData = await debateRes.json();
      if (!debateRes.ok) throw new Error(debateData.error || 'Failed to create debate');

      // Trigger analysis (Gemini watches the video)
      fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debate_id: debateData.id }),
      });

      router.push(`/debate/${debateData.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

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

          {!loading ? (
            <>
              <h1 className="font-serif text-4xl sm:text-5xl text-stone-900 dark:text-white text-center mb-3 leading-tight tracking-tight">
                Analyze any debate.
              </h1>
              <p className="text-center text-stone-400 dark:text-stone-500 text-sm mb-10">
                Paste a YouTube link. AI watches it and scores every argument.
              </p>

              <form onSubmit={handleSubmit} className="relative">
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-white dark:bg-[#111] border border-stone-200 dark:border-[#2a2a2a] rounded-2xl px-5 py-4 pr-[120px] text-sm text-stone-900 dark:text-white placeholder-stone-300 dark:placeholder-stone-600 focus:outline-none focus:border-[#d97706] dark:focus:border-[#d97706] transition-all shadow-sm"
                />
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#d97706] hover:bg-[#b45309] disabled:bg-stone-200 dark:disabled:bg-stone-800 disabled:text-stone-400 text-white text-[11px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all"
                >
                  Analyze
                </button>
              </form>

              {error && (
                <p className="text-center text-xs text-rose-500 mt-3">{error}</p>
              )}
            </>
          ) : (
            <div className="text-center">
              {/* Animated orb */}
              <div className="relative w-20 h-20 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-[#d97706]/20 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-[#d97706]/30 animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-[#d97706] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
              </div>

              <h2 className="font-serif text-2xl text-stone-900 dark:text-white mb-2">
                Analyzing debate
              </h2>
              <p
                key={msgIndex}
                className="text-sm text-stone-400 dark:text-stone-500 animate-pulse transition-all"
              >
                {LOADING_MESSAGES[msgIndex]}
              </p>
            </div>
          )}
        </div>
      </main>

      {!loading && debates.length > 0 && (
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
