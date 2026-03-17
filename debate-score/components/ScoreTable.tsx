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
      ? 'bg-[#d97706]'
      : value >= 6
      ? 'bg-stone-500'
      : value >= 4
      ? 'bg-stone-600'
      : 'bg-stone-700';

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className="flex-1 h-1 bg-[#222] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] sm:text-xs font-mono w-5 sm:w-6 text-right text-stone-400">
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
      <div className="text-xs text-stone-600 italic text-center py-4 font-serif">
        Round analysis in progress...
      </div>
    );
  }

  const winner =
    !scoreA ? 'B' :
    !scoreB ? 'A' :
    scoreA.total_score > scoreB.total_score ? 'A' :
    scoreB.total_score > scoreA.total_score ? 'B' : 'tie';

  return (
    <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden shadow-sm">
      {/* Round header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#151515] border-b border-[#222]">
        <div className="min-w-0 flex-1 mr-4">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] block mb-0.5">
            Round {segment.round_number}
          </span>
          {segment.topic && (
            <h4 className="text-base font-serif text-white truncate leading-tight">
              {segment.topic}
            </h4>
          )}
        </div>
        {winner !== 'tie' && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#d97706] bg-[#d97706]/5 px-3 py-1 rounded-full border border-[#d97706]/20 flex-shrink-0">
            {winner === 'A' ? debaterA : debaterB} leading
          </span>
        )}
      </div>

      {/* Metric rows */}
      <div className="p-3 sm:p-5 space-y-3">
        <div className="grid grid-cols-[1fr_22%_22%] sm:grid-cols-[1fr_100px_100px] md:grid-cols-[1fr_120px_120px] gap-x-4 sm:gap-x-8 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-600 mb-2 px-1">
          <span>Dimension</span>
          <span className="text-center truncate">{debaterA}</span>
          <span className="text-center truncate">{debaterB}</span>
        </div>

        {METRICS.map(({ key, label, icon }) => (
          <div key={key} className="grid grid-cols-[1fr_22%_22%] sm:grid-cols-[1fr_100px_100px] md:grid-cols-[1fr_120px_120px] gap-x-4 sm:gap-x-8 items-center px-1 group">
            <span className="text-[11px] text-stone-400 flex items-center gap-2 min-w-0 group-hover:text-stone-200 transition-colors">
              <span className="flex-shrink-0 opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">{icon}</span>
              <span className="truncate">{label}</span>
            </span>
            <div className="">
              {scoreA ? (
                <ScoreBar value={scoreA[key] as number} />
              ) : (
                <div className="h-1 bg-[#1a1a1a] rounded-full w-full" />
              )}
            </div>
            <div className="">
              {scoreB ? (
                <ScoreBar value={scoreB[key] as number} />
              ) : (
                <div className="h-1 bg-[#1a1a1a] rounded-full w-full" />
              )}
            </div>
          </div>
        ))}

        {/* Round total */}
        <div className="border-t border-[#222] pt-4 mt-4 px-1">
          <div className="grid grid-cols-[1fr_22%_22%] sm:grid-cols-[1fr_100px_100px] md:grid-cols-[1fr_120px_120px] gap-x-4 sm:gap-x-8 items-center">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Aggregate</span>
            <div className="text-center">
              {scoreA && (
                <span
                  className={`text-base font-serif font-medium ${
                    winner === 'A' ? 'text-white' : 'text-stone-500'
                  }`}
                >
                  {scoreA.total_score.toFixed(1)}
                </span>
              )}
            </div>
            <div className="text-center">
              {scoreB && (
                <span
                  className={`text-base font-serif font-medium ${
                    winner === 'B' ? 'text-white' : 'text-stone-500'
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
        <div className="px-5 pb-5 space-y-3">
          {scoreA?.notes && (
            <div className="flex gap-3">
              <span className="text-[10px] font-bold text-stone-600 uppercase tracking-tighter mt-1 w-16 flex-shrink-0">{debaterA}</span>
              <p className="text-xs text-stone-400 leading-relaxed font-sans italic opacity-80">
                "{scoreA.notes}"
              </p>
            </div>
          )}
          {scoreB?.notes && (
            <div className="flex gap-3">
              <span className="text-[10px] font-bold text-stone-600 uppercase tracking-tighter mt-1 w-16 flex-shrink-0">{debaterB}</span>
              <p className="text-xs text-stone-400 leading-relaxed font-sans italic opacity-80">
                "{scoreB.notes}"
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
