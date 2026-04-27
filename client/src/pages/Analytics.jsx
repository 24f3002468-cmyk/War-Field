import React from 'react'
import { format } from 'date-fns'
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts'
import { useAnalytics, useDSA, useApplications } from '../hooks/useData'
import { SectionTitle, StatBlock, LoadingState, CardHeader } from '../components/UI'
import { getMastery } from '../lib/utils'

const TT = ({ contentStyle, labelStyle, ...props }) => (
  <Tooltip
    contentStyle={{ background: '#0f1219', border: '1px solid #1a1f2e', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono' }}
    labelStyle={{ color: '#64748b' }}
    {...props}
  />
)

export default function Analytics() {
  const { scores, weekAvg, loading: aLoading } = useAnalytics()
  const { topics, loading: dsaLoading } = useDSA()
  const { stats, loading: appLoading } = useApplications()

  if (aLoading || dsaLoading || appLoading) return <LoadingState />

  const scoreData = [...scores].reverse().map(s => ({
    date: format(new Date(s.log_date), 'EEE dd'),
    total: s.total_score,
    dsa: s.dsa_score,
    project: s.project_score,
    career: s.career_score,
    energy: s.energy_score,
  }))

  const topicRadar = topics.slice(0, 8).map(t => ({
    topic: t.topic.substring(0, 10),
    mastery: t.mastery_score,
    fullMark: 100,
  }))

  const funnelData = [
    { stage: 'Applied', count: stats.total || 0, color: '#64748b' },
    { stage: 'In Review', count: stats.in_review || 0, color: '#3b82f6' },
    { stage: 'OA', count: stats.oa || 0, color: '#f59e0b' },
    { stage: 'Interview', count: stats.interview || 0, color: '#22c55e' },
    { stage: 'Offer', count: stats.offer || 0, color: '#e8ff47' },
  ]

  return (
    <div className="p-6 space-y-6 page-enter">
      <SectionTitle sub="Numbers don't lie. Your data tells the truth.">
        Analytics
      </SectionTitle>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <StatBlock
          value={Math.round(weekAvg?.avg_score || 0) + '/40'}
          label="Avg Score (7d)"
          color={weekAvg?.avg_score >= 28 ? 'text-emerald-400' : 'text-amber-400'}
        />
        <StatBlock
          value={Math.round(weekAvg?.avg_energy || 0) + '/10'}
          label="Avg Energy"
          color={weekAvg?.avg_energy >= 7 ? 'text-emerald-400' : weekAvg?.avg_energy >= 5 ? 'text-amber-400' : 'text-kill'}
        />
        <StatBlock value={weekAvg?.total_dsa || 0} label="DSA This Week" color="text-white" />
        <StatBlock value={weekAvg?.total_apps || 0} label="Apps This Week" color="text-white" />
      </div>

      {/* Score + Energy trend */}
      <div className="exec-card">
        <CardHeader title="Score & Energy Trend (Last 14 Days)" dot="bg-accent" />
        {scoreData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-ghost text-sm font-mono">
            Log at least 1 day to see your trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={scoreData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="totalG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e8ff47" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#e8ff47" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="energyG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <TT />
              <Area type="monotone" dataKey="total" name="Total Score" stroke="#e8ff47" strokeWidth={2} fill="url(#totalG)" dot={false} />
              <Area type="monotone" dataKey="energy" name="Energy" stroke="#00e5ff" strokeWidth={1.5} fill="url(#energyG)" dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Score breakdown */}
        <div className="exec-card">
          <CardHeader title="Score Breakdown by Category" dot="bg-purple-500" />
          {scoreData.length === 0 ? (
            <div className="text-ghost text-xs font-mono text-center py-10">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreData.slice(-7)} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <TT />
                <Bar dataKey="dsa" name="DSA" stackId="a" fill="#22c55e" radius={[0,0,0,0]} />
                <Bar dataKey="project" name="Project" stackId="a" fill="#00e5ff" />
                <Bar dataKey="career" name="Career" stackId="a" fill="#a855f7" />
                <Bar dataKey="energy" name="Discipline" stackId="a" fill="#e8ff47" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Topic mastery radar */}
        <div className="exec-card">
          <CardHeader title="DSA Topic Mastery" dot="bg-emerald-500" />
          {topicRadar.length === 0 ? (
            <div className="text-ghost text-xs font-mono text-center py-10">No topics yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={topicRadar}>
                <PolarGrid stroke="#1a1f2e" />
                <PolarAngleAxis dataKey="topic" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Mastery" dataKey="mastery" stroke="#e8ff47" fill="#e8ff47" fillOpacity={0.15} strokeWidth={2} />
                <TT />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Application funnel */}
      <div className="exec-card">
        <CardHeader title="Application Funnel" dot="bg-signal" />
        <div className="flex items-end gap-4 h-32">
          {funnelData.map((d, i) => {
            const pct = funnelData[0].count > 0 ? Math.round((d.count / funnelData[0].count) * 100) : 0
            return (
              <div key={d.stage} className="flex-1 flex flex-col items-center gap-2">
                <div className="font-mono text-xs font-bold" style={{ color: d.color }}>{d.count}</div>
                <div className="w-full rounded-t" style={{ height: `${Math.max(4, pct)}%`, background: d.color, opacity: 0.8 }} />
                <div className="text-[10px] font-mono text-ghost text-center">{d.stage}</div>
                <div className="text-[10px] font-mono text-ghost/50">{pct}%</div>
              </div>
            )
          })}
        </div>
        {stats.total > 0 && stats.offer === 0 && (
          <p className="text-ghost text-xs font-mono mt-4">
            Conversion to interview: {stats.total > 0 ? Math.round((stats.interview / stats.total) * 100) : 0}%.
            Industry avg is 3–8%. Keep volume high and quality up.
          </p>
        )}
      </div>
    </div>
  )
}
