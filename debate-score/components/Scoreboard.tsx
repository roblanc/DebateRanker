'use client';

import { Segment, Score } from '@/types';
import { useTheme } from './ThemeProvider';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

interface ScoreboardProps {
  debaterA: string;
  debaterB: string;
  totalA: number;
  totalB: number;
  segments: (Segment & { scores: Score[] })[];
}

const METRIC_KEYS = [
  { key: 'evidence_score', label: 'Evidence' },
  { key: 'logic_score', label: 'Logic' },
  { key: 'claim_support_score', label: 'Claim' },
  { key: 'definition_clarity_score', label: 'Clarity' },
  { key: 'policy_relevance_score', label: 'Policy' },
  { key: 'rhetorical_composure_score', label: 'Rhetoric' },
  { key: 'debate_discipline_score', label: 'Discipline' },
  { key: 'framing_control_score', label: 'Framing' },
] as const;

export default function Scoreboard({ debaterA, debaterB, totalA, totalB, segments }: ScoreboardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const winner =
    totalA > totalB ? debaterA :
    totalB > totalA ? debaterB : 'Tie';

  // Chart color tokens
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const tickColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#475569' : '#e2e8f0';

  // Radar chart data
  const radarData = METRIC_KEYS.map(({ key, label }) => {
    let aSum = 0, bSum = 0, count = 0;
    for (const seg of segments) {
      const sA = seg.scores.find(s => s.debater === 'A');
      const sB = seg.scores.find(s => s.debater === 'B');
      if (sA && sB) {
        aSum += sA[key] as number;
        bSum += sB[key] as number;
        count++;
      }
    }
    return {
      metric: label,
      [debaterA]: count > 0 ? Math.round((aSum / count) * 10) / 10 : 0,
      [debaterB]: count > 0 ? Math.round((bSum / count) * 10) / 10 : 0,
    };
  });

  // Line chart: round-by-round progression
  const lineData = segments.map(seg => {
    const sA = seg.scores.find(s => s.debater === 'A');
    const sB = seg.scores.find(s => s.debater === 'B');
    return {
      name: `R${seg.round_number}`,
      [debaterA]: sA?.total_score ?? null,
      [debaterB]: sB?.total_score ?? null,
    };
  });

  return (
    <div className="space-y-4">
      {/* Cumulative scoreboard */}
      <div className="bg-white border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50 rounded-lg p-4">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Cumulative Scoreboard
        </h3>
        <div className="flex gap-4">
          {[
            { name: debaterA, score: totalA, isWinner: winner === debaterA, color: 'blue' },
            { name: debaterB, score: totalB, isWinner: winner === debaterB, color: 'violet' },
          ].map(d => (
            <div
              key={d.name}
              className={`flex-1 rounded-lg p-3 border ${
                d.isWinner
                  ? 'bg-emerald-50 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700/50'
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-700/30 dark:border-slate-600/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className={`text-sm font-bold truncate ${
                      d.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-violet-600 dark:text-violet-400'
                    }`}
                  >
                    {d.name}
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {d.score.toFixed(1)}
                    <span className="text-xs text-slate-400 font-normal ml-1">/ 10</span>
                  </p>
                </div>
                {d.isWinner && (
                  <span className="text-lg" title="Leading">🏆</span>
                )}
              </div>
              <div className="mt-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    d.color === 'blue' ? 'bg-blue-500' : 'bg-violet-500'
                  }`}
                  style={{ width: `${(d.score / 10) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Line chart: round progression */}
      {lineData.length > 1 && (
        <div className="bg-white border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Round Progression
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={lineData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fill: tickColor, fontSize: 10 }} />
              <YAxis domain={[0, 10]} tick={{ fill: tickColor, fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '6px' }}
                labelStyle={{ color: tickColor, fontSize: '11px' }}
                itemStyle={{ fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Line
                type="monotone"
                dataKey={debaterA}
                stroke="#60a5fa"
                strokeWidth={2}
                dot={{ fill: '#60a5fa', r: 3 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey={debaterB}
                stroke="#a78bfa"
                strokeWidth={2}
                dot={{ fill: '#a78bfa', r: 3 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Radar chart */}
      {radarData.length > 0 && (
        <div className="bg-white border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Performance Profile
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={gridColor} />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: tickColor, fontSize: 9 }}
              />
              <Radar
                name={debaterA}
                dataKey={debaterA}
                stroke="#60a5fa"
                fill="#60a5fa"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
              <Radar
                name={debaterB}
                dataKey={debaterB}
                stroke="#a78bfa"
                fill="#a78bfa"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '6px' }}
                itemStyle={{ fontSize: '11px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
