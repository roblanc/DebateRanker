'use client';

import { Segment, Score } from '@/types';
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
  const winner =
    totalA > totalB ? debaterA :
    totalB > totalA ? debaterB : 'Tie';

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
    <div className="space-y-6">
      {/* Cumulative scoreboard */}
      <div className="bg-[#111] rounded-2xl border border-[#222] p-5 shadow-sm">
        <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mb-4">
          Scholarly Standing
        </h3>
        <div className="flex flex-col sm:flex-row gap-4">
          {[
            { name: debaterA, score: totalA, isWinner: winner === debaterA, color: 'amber' },
            { name: debaterB, score: totalB, isWinner: winner === debaterB, color: 'stone' },
          ].map(d => (
            <div
              key={d.name}
              className={`flex-1 rounded-xl p-4 border transition-all duration-500 ${
                d.isWinner
                  ? 'bg-amber-900/5 border-amber-900/30'
                  : 'bg-[#1a1a1a] border-[#2a2a2a]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-bold uppercase tracking-widest truncate ${
                      d.color === 'amber' ? 'text-amber-500' : 'text-stone-400'
                    }`}
                  >
                    {d.name}
                  </p>
                  <p className="text-3xl font-serif text-white mt-1">
                    {d.score.toFixed(1)}
                    <span className="text-[10px] text-stone-600 font-sans font-normal ml-1">/ 10</span>
                  </p>
                </div>
                {d.isWinner && (
                  <span className="text-lg opacity-80" title="Leading">🏆</span>
                )}
              </div>
              <div className="mt-3 h-1 bg-[#222] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    d.color === 'amber' ? 'bg-amber-600' : 'bg-stone-500'
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
        <div className="bg-[#111] rounded-2xl border border-[#222] p-5 shadow-sm">
          <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mb-4">
            Argumentative Progression
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={lineData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#57534e', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fill: '#57534e', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#151515', border: '1px solid #222', borderRadius: '12px', fontSize: '11px', fontFamily: 'var(--sans)' }}
                itemStyle={{ padding: '2px 0' }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} iconType="circle" />
              <Line
                type="monotone"
                dataKey={debaterA}
                stroke="#d97706"
                strokeWidth={2.5}
                dot={{ fill: '#d97706', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey={debaterB}
                stroke="#57534e"
                strokeWidth={2.5}
                dot={{ fill: '#57534e', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Radar chart */}
      {radarData.length > 0 && (
        <div className="bg-[#111] rounded-2xl border border-[#222] p-5 shadow-sm">
          <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mb-4">
            Intellectual Profile
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1a1a1a" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fill: '#57534e', fontSize: 9, fontWeight: 'bold' }}
              />
              <Radar
                name={debaterA}
                dataKey={debaterA}
                stroke="#d97706"
                fill="#d97706"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar
                name={debaterB}
                dataKey={debaterB}
                stroke="#57534e"
                fill="#57534e"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} iconType="circle" />
              <Tooltip
                contentStyle={{ backgroundColor: '#151515', border: '1px solid #222', borderRadius: '12px', fontSize: '11px' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
