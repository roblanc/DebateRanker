'use client';

import { useState, useRef, DragEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function DebateUpload() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.debater_a.trim() || !form.debater_b.trim() || !form.transcript.trim()) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    try {
      // Create debate
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

      // Start analysis
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
      {/* Debate metadata */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3">
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Debate Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Presidential Debate 2024 — Round 1"
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Debater A Name
          </label>
          <input
            type="text"
            value={form.debater_a}
            onChange={e => setForm(f => ({ ...f, debater_a: e.target.value }))}
            placeholder="e.g. Alice"
            className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Debater B Name
          </label>
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

      {/* Transcript input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-slate-400">Transcript</label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Upload file
          </button>
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
            placeholder={`Paste debate transcript here or drag & drop a .txt file...\n\nExample format:\nALICE: My position is that...\nBOB: I disagree because...\n\nOr with timestamps:\n[00:00] ALICE: Welcome to...\n[02:30] BOB: Thank you...`}
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
