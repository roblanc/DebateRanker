'use client';

import { Score, Segment } from '@/types';

interface ScoreTableProps {
  segment: Segment;
  scores: Score[];
  debaterA: string;
  debaterB: string;
}

const METRICS = [
  { key: 'evidence_score', label: 'Evidence / Data', icon: '📊' },
  { key: 'logic_score', label: 'Logical Consistency', icon: '🧠' },
  { key: 'claim_support_score', label: 'Claim Support', icon: '⚖️' },
  { key: 'definition_clarity_score', label: 'Definition Clarity', icon: '📖' },
  { key: 'policy_relevance_score', label: 'Policy Relevance', icon: '🎯' },
  { key: 'rhetorical_composure_score', label: 'Rhetorical Composure', icon: '🎭' },
  { key: 'debate_discipline_score', label: 'Debate Discipline', icon: '🛡️' },
  { key: 'framing_control_score', label: 'Framing Control', icon: '🖼️' },
] as const;

function ScoreBar({ value }: { value: number }) {
  const pct = (value / 10) * 100;
  const color =
    value >= 8
      ? 'bg-emerald-500'
      : value >= 6
      ? 'bg-blue-500'
      : value >= 4
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono w-6 text-right text-slate-300">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default function ScoreTable({ segment, scores, debaterA, debaterB }: ScoreTableProps) {
  const scoreA = scores.find(s => s.debater === 'A');
  const scoreB = scores.find(s => s.debater === 'B');

  if (!scoreA && !scoreB) {
    return (
      <div className="text-xs text-slate-500 italic text-center py-4">
        Scores pending...
      </div>
    );
  }

  const winner =
    !scoreA ? 'B' :
    !scoreB ? 'A' :
    scoreA.total_score > scoreB.total_score ? 'A' :
    scoreB.total_score > scoreA.total_score ? 'B' : 'tie';

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
      {/* Round header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-700/30 border-b border-slate-700/50">
        <div>
          <span className="text-xs font-bold text-slate-200">
            Round {segment.round_number}
          </span>
          {segment.topic && (
            <span className="text-xs text-slate-400 ml-2">— {segment.topic}</span>
          )}
        </div>
        {winner !== 'tie' && (
          <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/50">
            {winner === 'A' ? debaterA : debaterB} leads
          </span>
        )}
      </div>

      {/* Metric rows */}
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-xs text-slate-500 mb-1">
          <span>Metric</span>
          <span className="w-24 text-center text-slate-400 font-medium truncate">{debaterA}</span>
          <span className="w-24 text-center text-slate-400 font-medium truncate">{debaterB}</span>
        </div>

        {METRICS.map(({ key, label, icon }) => (
          <div key={key} className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span>{icon}</span>
              <span className="truncate">{label}</span>
            </span>
            <div className="w-24">
              {scoreA ? (
                <ScoreBar value={scoreA[key] as number} />
              ) : (
                <span className="text-xs text-slate-600">—</span>
              )}
            </div>
            <div className="w-24">
              {scoreB ? (
                <ScoreBar value={scoreB[key] as number} />
              ) : (
                <span className="text-xs text-slate-600">—</span>
              )}
            </div>
          </div>
        ))}

        {/* Round total */}
        <div className="border-t border-slate-700/50 pt-2 mt-2">
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center">
            <span className="text-xs font-bold text-slate-300">Round Score</span>
            <div className="w-24 text-center">
              {scoreA && (
                <span
                  className={`text-sm font-bold ${
                    winner === 'A' ? 'text-emerald-400' : 'text-slate-300'
                  }`}
                >
                  {scoreA.total_score.toFixed(1)}
                </span>
              )}
            </div>
            <div className="w-24 text-center">
              {scoreB && (
                <span
                  className={`text-sm font-bold ${
                    winner === 'B' ? 'text-emerald-400' : 'text-slate-300'
                  }`}
                >
                  {scoreB.total_score.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {(scoreA?.notes || scoreB?.notes) && (
        <div className="px-3 pb-3 space-y-1">
          {scoreA?.notes && (
            <p className="text-xs text-slate-400">
              <span className="text-blue-400 font-medium">{debaterA}:</span> {scoreA.notes}
            </p>
          )}
          {scoreB?.notes && (
            <p className="text-xs text-slate-400">
              <span className="text-violet-400 font-medium">{debaterB}:</span> {scoreB.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
