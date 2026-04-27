import { Link } from 'react-router-dom'
import React, { useState } from 'react'
import { format } from 'date-fns'
import { Save, ChevronDown } from 'lucide-react'
import { getDayType, DAY_TYPE_LABELS, DAY_TYPE_COLORS, today } from '../lib/utils'
import { useToday } from '../hooks/useData'
import api from '../lib/api'
import { SectionTitle, Field, Input, Select, Textarea, ProgressBar, WarnBanner, OkBanner, LoadingState } from '../components/UI'

const SCORE_RULES = {
  dsa: [
    { label: '0 problems', value: 0 },
    { label: '1 easy', value: 3 },
    { label: '1 medium or 2 easy', value: 6 },
    { label: '2 medium', value: 8 },
    { label: '1 hard or 2 medium+', value: 10 },
  ],
  project: [
    { label: 'No work', value: 0 },
    { label: 'Minor fix / small task', value: 3 },
    { label: 'Feature started', value: 6 },
    { label: 'Feature completed', value: 8 },
    { label: 'Feature + deployed + explained', value: 10 },
  ],
  career: [
    { label: 'No applications', value: 0 },
    { label: '1–5 applications', value: 3 },
    { label: '5–10 applications', value: 6 },
    { label: '10–15 + 1 networking', value: 8 },
    { label: '15+ + 3 networking + referral', value: 10 },
  ],
  discipline: [
    { label: 'Scattered / distracted day', value: 0 },
    { label: '2–3 hrs deep work', value: 4 },
    { label: '4–5 hrs deep work', value: 6 },
    { label: '6–7 hrs deep work', value: 8 },
    { label: '8+ hrs focused + no social media', value: 10 },
  ],
}

function ScoreSelector({ label, field, value, onChange }) {
  const rules = SCORE_RULES[field]
  return (
    <div className="exec-card">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono text-ghost uppercase tracking-widest">{label}</div>
        <div className={`font-display font-bold text-2xl ${value >= 8 ? 'text-emerald-400' : value >= 5 ? 'text-amber-400' : 'text-kill'}`}>
          {value}<span className="text-ghost text-sm">/10</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {rules.map(rule => (
          <button
            key={rule.value}
            onClick={() => onChange(rule.value)}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-all border
              ${value === rule.value
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-surface border-border text-ghost hover:text-slate-300 hover:border-slate-600'
              }`}
          >
            <div className="flex items-center justify-between">
              <span>{rule.label}</span>
              <span className={`font-mono text-xs font-bold ${value === rule.value ? 'text-accent' : 'text-ghost'}`}>
                +{rule.value}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}


function TodayTasksList() {
  const today = new Date().toISOString().split('T')[0]
  const [tasks, setTasks] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('execos_tasks_v2') || '[]') } catch { return [] }
  })
  const toggle = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setTasks(updated)
    localStorage.setItem('execos_tasks_v2', JSON.stringify(updated))
  }
  const due = tasks.filter(t => !t.done && (t.deadline === today || (!t.deadline)))
  const overdue = tasks.filter(t => !t.done && t.deadline && t.deadline < today)
  const all = [...overdue, ...due]
  if (!all.length) return (
    <div className="text-ghost text-xs font-mono">
      No tasks for today. <Link to="/tasks" className="text-accent hover:underline">Add tasks →</Link>
    </div>
  )
  return (
    <div className="space-y-1.5">
      {all.slice(0, 8).map(t => {
        const isOverdue = t.deadline && t.deadline < today
        return (
          <div key={t.id} className="flex items-center gap-3 cursor-pointer py-1" onClick={() => toggle(t.id)}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${t.done ? 'bg-emerald-500/20 border-emerald-500/40' : 'border-border hover:border-slate-400'}`}>
              {t.done && <span className="text-emerald-400 text-[10px]">✓</span>}
            </div>
            <span className={`text-sm flex-1 ${t.done ? 'text-ghost line-through' : isOverdue ? 'text-kill' : 'text-slate-300'}`}>{t.name}</span>
            <span className="text-[10px] font-mono text-ghost">{t.category}</span>
            {isOverdue && <span className="text-[10px] font-mono text-kill">OVERDUE</span>}
          </div>
        )
      })}
    </div>
  )
}

export default function DailyLog() {
  const dayType = getDayType()
  const dtColors = DAY_TYPE_COLORS[dayType]
  const { today: existingLog, loading } = useToday()

  const [form, setForm] = useState({
    day_type: dayType,
    dsa_count: '',
    apps_sent: '',
    features_built: '',
    system_design_topic: '',
    deep_work_hours: '',
    notes: '',
    reflection: '',
    dsa_score: 0,
    project_score: 0,
    career_score: 0,
    discipline_score: 0,
  })
  const [energy, setEnergy] = useState(7)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const totalScore = form.dsa_score + form.project_score + form.career_score + form.discipline_score

  const save = async () => {
    setSaving(true)
    try {
      await api.post('/logs', {
        ...form,
        log_date: today(),
        energy_score: energy,
        dsa_count: parseInt(form.dsa_count) || 0,
        apps_sent: parseInt(form.apps_sent) || 0,
        deep_work_hours: parseFloat(form.deep_work_hours) || 0,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    setSaving(false)
  }

  if (loading) return <LoadingState />

  return (
    <div className="p-6 space-y-6 page-enter">
      <SectionTitle
        sub={format(new Date(), 'EEEE, d MMMM yyyy')}
        action={
          <div className={`px-4 py-2 rounded-xl border ${dtColors.bg} ${dtColors.border}`}>
            <span className={`font-display font-bold text-sm ${dtColors.text}`}>
              Type {dayType} — {DAY_TYPE_LABELS[dayType]}
            </span>
          </div>
        }
      >
        Daily Execution Log
      </SectionTitle>


      {/* Today's tasks */}
      <div className="exec-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-ghost uppercase tracking-widest">Today's Tasks</span>
          <Link to="/tasks" className="text-xs font-mono text-accent hover:underline">Manage →</Link>
        </div>
        <TodayTasksList />
      </div>

      {/* Score preview */}
      <div className="exec-card border-accent/20 bg-accent/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-ghost uppercase tracking-widest mb-1">Today's Score</div>
            <div className={`font-display font-bold text-5xl score-glow ${totalScore >= 30 ? 'text-accent' : totalScore >= 20 ? 'text-amber-400' : 'text-kill'}`}>
              {totalScore}<span className="text-2xl text-ghost">/40</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'DSA', val: form.dsa_score },
              { label: 'Project', val: form.project_score },
              { label: 'Career', val: form.career_score },
              { label: 'Discipline', val: form.discipline_score },
            ].map(({ label, val }) => (
              <div key={label}>
                <div className={`font-display font-bold text-2xl ${val >= 8 ? 'text-emerald-400' : val >= 5 ? 'text-amber-400' : 'text-kill'}`}>{val}</div>
                <div className="text-xs font-mono text-ghost">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <ProgressBar value={totalScore} max={40} color={totalScore >= 30 ? 'bg-accent' : 'bg-amber-500'} height="h-2" />
        {totalScore === 40 && (
          <p className="text-accent text-xs font-mono mt-3">✦ PERFECT DAY. You're building the engineer who gets the ₹1Cr offer.</p>
        )}
        {totalScore < 20 && totalScore > 0 && (
          <p className="text-kill text-xs font-mono mt-3">⚠ Score below 20. Not acceptable. What went wrong? Fix it in reflection.</p>
        )}
      </div>

      {/* Score selectors */}
      <div className="grid grid-cols-2 gap-4">
        <ScoreSelector label="DSA Score" field="dsa" value={form.dsa_score} onChange={v => set('dsa_score', v)} />
        <ScoreSelector label="Project Score" field="project" value={form.project_score} onChange={v => set('project_score', v)} />
        <ScoreSelector label="Career Score" field="career" value={form.career_score} onChange={v => set('career_score', v)} />
        <ScoreSelector label="Discipline Score" field="discipline" value={form.discipline_score} onChange={v => set('discipline_score', v)} />
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4">
        <div className="exec-card space-y-4">
          <div className="text-xs font-mono text-ghost uppercase tracking-widest">Execution Details</div>
          <Field label="DSA Problems Solved">
            <Input type="number" min="0" placeholder="0" value={form.dsa_count} onChange={e => set('dsa_count', e.target.value)} />
          </Field>
          <Field label="Applications Sent">
            <Input type="number" min="0" placeholder="0" value={form.apps_sent} onChange={e => set('apps_sent', e.target.value)} />
          </Field>
          <Field label="Feature Built Today">
            <Input placeholder="e.g. JWT auth middleware" value={form.features_built} onChange={e => set('features_built', e.target.value)} />
          </Field>
          <Field label="System Design Applied">
            <Input placeholder="e.g. Rate limiting, caching" value={form.system_design_topic} onChange={e => set('system_design_topic', e.target.value)} />
          </Field>
          <Field label="Deep Work Hours">
            <Input type="number" min="0" max="16" step="0.5" placeholder="0" value={form.deep_work_hours} onChange={e => set('deep_work_hours', e.target.value)} />
          </Field>
        </div>

        <div className="exec-card space-y-4">
          <div className="text-xs font-mono text-ghost uppercase tracking-widest">Energy & Reflection</div>
          <Field label={`Energy Level: ${energy}/10`}>
            <input
              type="range" min="1" max="10" value={energy}
              onChange={e => setEnergy(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
            <div className={`text-xs font-mono mt-1 ${energy >= 7 ? 'text-emerald-400' : energy >= 5 ? 'text-amber-400' : 'text-kill'}`}>
              {energy >= 7 ? '⚡ High output mode' : energy >= 5 ? '→ Manageable — push through' : '⚠ Low — shorten sessions, no skipping'}
            </div>
          </Field>
          <Field label="What did you build / learn?">
            <Textarea
              placeholder="Describe what you actually did today. Be specific."
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              style={{ minHeight: 80 }}
            />
          </Field>
          <Field label="Honest Reflection (mandatory)">
            <Textarea
              placeholder="What failed? Why? What will you change? No excuses — only data."
              value={form.reflection}
              onChange={e => set('reflection', e.target.value)}
              style={{ minHeight: 100 }}
            />
          </Field>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button onClick={save} disabled={saving} className="btn-exec px-6 py-3 disabled:opacity-60">
          <Save size={16} />
          {saving ? 'Saving...' : 'Lock In Today\'s Log'}
        </button>
        {saved && <span className="text-emerald-400 text-sm font-mono">✓ Saved. Day logged.</span>}
        {totalScore === 0 && (
          <span className="text-kill text-sm font-mono">Select scores above before saving.</span>
        )}
      </div>
    </div>
  )
}
