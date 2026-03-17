'use client';

import { Moment } from '@/types';

interface MomentsPanelProps {
  moments: Moment[];
  debaterA: string;
  debaterB: string;
}

const MOMENT_CONFIG = {
  strong_claim: { label: 'Strong Claim', icon: '💥', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/40' },
  contradiction: { label: 'Contradiction', icon: '⚡', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/40' },
  ad_hominem: { label: 'Ad Hominem', icon: '⚠️', color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700/40' },
  interruption: { label: 'Interruption', icon: '✋', color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700/40' },
  concession: { label: 'Concession', icon: '🤝', color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700/40' },
} as const;

export default function MomentsPanel({ moments, debaterA, debaterB }: MomentsPanelProps) {
  if (moments.length === 0) {
    return (
      <div className="text-xs text-stone-400 dark:text-stone-500 italic text-center py-8 font-serif">
        Analytical highlights will appear as the session concludes.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {moments.map(moment => {
        const config = MOMENT_CONFIG[moment.type] || {
          label: moment.type,
          icon: '📍',
          color: 'text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-600/40',
        };
        const debaterName =
          moment.debater === 'A' ? debaterA :
          moment.debater === 'B' ? debaterB :
          'Both Participants';

        return (
          <div
            key={moment.id}
            className={`flex items-start gap-3 p-3 rounded-xl border text-xs shadow-sm transition-all hover:scale-[1.01] ${config.color}`}
          >
            <span className="text-base flex-shrink-0 mt-0.5 grayscale opacity-70">{config.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold uppercase tracking-wider text-[10px]">{config.label}</span>
                <span className="opacity-30">|</span>
                <span className="font-medium opacity-80">{debaterName}</span>
                {moment.timestamp && (
                  <>
                    <span className="opacity-30">|</span>
                    <span className="font-mono opacity-60 text-[10px]">{moment.timestamp}</span>
                  </>
                )}
              </div>
              <p className="opacity-90 leading-relaxed font-sans">{moment.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
