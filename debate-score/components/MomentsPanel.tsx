'use client';

import { Moment } from '@/types';

interface MomentsPanelProps {
  moments: Moment[];
  debaterA: string;
  debaterB: string;
}

const MOMENT_CONFIG = {
  strong_claim: { label: 'Strong Claim', icon: '💥', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-700/40' },
  contradiction: { label: 'Contradiction', icon: '⚡', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-700/40' },
  ad_hominem: { label: 'Ad Hominem', icon: '⚠️', color: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-900/20 dark:border-rose-700/40' },
  interruption: { label: 'Interruption', icon: '✋', color: 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-700/40' },
  concession: { label: 'Concession', icon: '🤝', color: 'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-400 dark:bg-sky-900/20 dark:border-sky-700/40' },
} as const;

export default function MomentsPanel({ moments, debaterA, debaterB }: MomentsPanelProps) {
  if (moments.length === 0) {
    return (
      <div className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-4">
        No key moments detected yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {moments.map(moment => {
        const config = MOMENT_CONFIG[moment.type] || {
          label: moment.type,
          icon: '📍',
          color: 'text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800/50 dark:border-slate-600/40',
        };
        const debaterName =
          moment.debater === 'A' ? debaterA :
          moment.debater === 'B' ? debaterB :
          'Both';

        return (
          <div
            key={moment.id}
            className={`flex items-start gap-2 p-2 rounded border text-xs ${config.color}`}
          >
            <span className="text-base flex-shrink-0 mt-0.5">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold">{config.label}</span>
                <span className="opacity-40">·</span>
                <span className="opacity-80">{debaterName}</span>
                {moment.timestamp && (
                  <>
                    <span className="opacity-40">·</span>
                    <span className="font-mono opacity-70">{moment.timestamp}</span>
                  </>
                )}
              </div>
              <p className="opacity-90 leading-relaxed">{moment.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
