'use client';

import { useState, useRef, DragEvent } from 'react';
import { useRouter } from 'next/navigation';

type InputMode = 'paste' | 'youtube';

export default function DebateUpload() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<InputMode>('paste');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [form, setForm] = useState({
    title: '',
    debater_a: '',
    debater_b: '',
    transcript: '',
  });

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      setForm(f => ({ ...f, transcript: e.target?.result as string }));
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md'))) {
      handleFile(file);
    } else {
      setError('Please drop a .txt or .md file');
    }
  };

  const fetchYouTubeTranscript = async () => {
    if (!youtubeUrl.trim()) return;
    setFetching(true);
    setError('');
    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch transcript');
      setForm(f => ({ ...f, transcript: data.transcript }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transcript');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.debater_a.trim() || !form.debater_b.trim() || !form.transcript.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/debates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create debate');
      }

      const { id } = await res.json();

      await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ debate_id: id }),
      });

      router.push(`/debate/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-sans">
      {/* Debater metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Debate Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Presidential Debate 2024 — Round 1"
            className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Debater A</label>
          <input
            type="text"
            value={form.debater_a}
            onChange={e => setForm(f => ({ ...f, debater_a: e.target.value }))}
            placeholder="e.g. Alice"
            className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-2">Debater B</label>
          <input
            type="text"
            value={form.debater_b}
            onChange={e => setForm(f => ({ ...f, debater_b: e.target.value }))}
            placeholder="e.g. Bob"
            className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, debater_a: 'Debater A', debater_b: 'Debater B', title: f.title || 'Untitled Debate' }))}
            className="w-full text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-800 rounded-xl px-2 py-3.5 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Use defaults
          </button>
        </div>
      </div>

      {/* Input mode toggle */}
      <div>
        <div className="flex items-center gap-1 mb-4 bg-stone-100 dark:bg-stone-900 rounded-full p-1 w-fit border border-stone-200 dark:border-stone-800 shadow-inner">
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-all ${
              mode === 'paste'
                ? 'bg-[#d97706] text-white'
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            Paste / Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('youtube')}
            className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full flex items-center gap-2 transition-all ${
              mode === 'youtube'
                ? 'bg-red-600 text-white'
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            YouTube
          </button>
        </div>

        {/* YouTube URL input */}
        {mode === 'youtube' && (
          <div className="space-y-3 mb-4">
            <div className="flex flex-col xs:flex-row gap-2">
              <input
                type="url"
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:border-red-500 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={fetchYouTubeTranscript}
                disabled={fetching || !youtubeUrl.trim()}
                className={`text-[10px] font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition-all whitespace-nowrap flex-shrink-0 ${
                  fetching || !youtubeUrl.trim()
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/10'
                }`}
              >
                {fetching ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Fetching...
                  </span>
                ) : 'Fetch Transcript'}
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 italic">
              * Works with videos that have auto-generated or manual captions.
            </p>
          </div>
        )}

        {/* Transcript textarea (shared) */}
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest px-1">
            Transcript Content
            {form.transcript && mode === 'youtube' && (
              <span className="ml-2 text-emerald-600 dark:text-emerald-500">✓ Fetched</span>
            )}
          </label>
          {mode === 'paste' && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-[10px] font-bold text-amber-600 dark:text-amber-500 hover:underline uppercase tracking-widest"
            >
              Upload file
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
            dragging
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/10'
              : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50 dark:bg-stone-950/20 shadow-inner'
          }`}
        >
          <textarea
            value={form.transcript}
            onChange={e => setForm(f => ({ ...f, transcript: e.target.value }))}
            placeholder={
              mode === 'youtube'
                ? 'Transcript will appear here after fetching...'
                : `Paste debate transcript here or drag & drop a .txt file...\n\nExample format:\nALICE: My position is that...\nBOB: I disagree because...\n\nOr with timestamps:\n[00:00] ALICE: Welcome to...\n[02:30] BOB: Thank you...`
            }
            rows={12}
            className="w-full bg-transparent px-4 py-4 text-sm text-stone-700 dark:text-stone-300 placeholder-stone-300 dark:placeholder-stone-700 focus:outline-none resize-none font-mono leading-relaxed"
          />
          {dragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-amber-50/80 dark:bg-stone-900/80 backdrop-blur-[2px] rounded pointer-events-none">
              <p className="text-amber-600 font-bold uppercase tracking-widest text-xs">Drop transcript here</p>
            </div>
          )}
        </div>
        {form.transcript && (
          <p className="text-[10px] text-stone-400 font-mono mt-2 px-1">
            {form.transcript.split(/\s+/).filter(Boolean).length} WORDS DETECTED
          </p>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl px-4 py-3 font-medium">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300 ${
          loading
            ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
            : 'bg-[#d97706] hover:bg-[#b45309] text-white shadow-xl shadow-amber-900/10 hover:scale-[1.01]'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Initiating Analysis...
          </span>
        ) : (
          'Begin Analysis'
        )}
      </button>
    </form>
  );
}
