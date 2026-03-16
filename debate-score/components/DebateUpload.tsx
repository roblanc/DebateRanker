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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Debater metadata */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3">
          <label className="block text-xs font-medium text-slate-400 mb-1">Debate Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Presidential Debate 2024 — Round 1"
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Debater A Name</label>
          <input
            type="text"
            value={form.debater_a}
            onChange={e => setForm(f => ({ ...f, debater_a: e.target.value }))}
            placeholder="e.g. Alice"
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Debater B Name</label>
          <input
            type="text"
            value={form.debater_b}
            onChange={e => setForm(f => ({ ...f, debater_b: e.target.value }))}
            placeholder="e.g. Bob"
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, debater_a: 'Debater A', debater_b: 'Debater B', title: f.title || 'Untitled Debate' }))}
            className="w-full text-xs text-slate-400 border border-slate-600 rounded px-2 py-2 hover:bg-slate-700 transition-colors"
          >
            Use defaults
          </button>
        </div>
      </div>

      {/* Input mode toggle */}
      <div>
        <div className="flex items-center gap-1 mb-3 bg-slate-800/60 rounded-lg p-1 w-fit">
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
              mode === 'paste'
                ? 'bg-slate-600 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Paste / Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('youtube')}
            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              mode === 'youtube'
                ? 'bg-red-700/80 text-white'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube
          </button>
        </div>

        {/* YouTube URL input */}
        {mode === 'youtube' && (
          <div className="space-y-3 mb-3">
            <div className="flex gap-2">
              <input
                type="url"
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              <button
                type="button"
                onClick={fetchYouTubeTranscript}
                disabled={fetching || !youtubeUrl.trim()}
                className={`text-sm font-medium px-4 py-2 rounded transition-colors whitespace-nowrap ${
                  fetching || !youtubeUrl.trim()
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-red-700 hover:bg-red-600 text-white'
                }`}
              >
                {fetching ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Fetching...
                  </span>
                ) : 'Fetch Transcript'}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Works with videos that have auto-generated or manual captions enabled.
            </p>
          </div>
        )}

        {/* Transcript textarea (shared) */}
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-slate-400">
            Transcript
            {form.transcript && mode === 'youtube' && (
              <span className="ml-2 text-emerald-400">✓ fetched</span>
            )}
          </label>
          {mode === 'paste' && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
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
          className={`relative rounded border-2 border-dashed transition-colors ${
            dragging
              ? 'border-blue-500 bg-blue-950/20'
              : 'border-slate-600 hover:border-slate-500'
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
            className="w-full bg-transparent px-3 py-2.5 text-sm text-slate-300 placeholder-slate-600 focus:outline-none resize-none font-mono"
          />
          {dragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-950/50 rounded pointer-events-none">
              <p className="text-blue-300 font-medium">Drop transcript file here</p>
            </div>
          )}
        </div>
        {form.transcript && (
          <p className="text-xs text-slate-500 mt-1">
            {form.transcript.split(/\s+/).filter(Boolean).length} words
          </p>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-400 bg-rose-900/20 border border-rose-700/40 rounded px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2.5 rounded font-semibold text-sm transition-all ${
          loading
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Creating debate session...
          </span>
        ) : (
          'Analyze Debate'
        )}
      </button>
    </form>
  );
}
