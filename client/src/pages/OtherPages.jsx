// Projects page
import React, { useState } from 'react'
import { Plus, Trash2, Edit2, ExternalLink, Github, FolderGit2, Target } from 'lucide-react'
import { useProjects, useGoals } from '../hooks/useData'
import api from '../lib/api'
import { SectionTitle, StatBlock, Modal, Field, Input, Select, Textarea, Badge, EmptyState, LoadingState, CardHeader, ProgressBar } from '../components/UI'
import { PHASES } from '../lib/utils'

function ProjectModal({ open, onClose, onSaved, editing }) {
  const [form, setForm] = useState(editing || { name: '', description: '', tech_stack: '', deployment_url: '', github_url: '', status: 'In Progress', phase_index: 0, interview_explanation: '', core_feature: '', optional_feature: '', system_design_applied: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      if (editing?.id) await api.patch(`/projects/${editing.id}`, { ...form, current_phase: PHASES[form.phase_index] })
      else await api.post('/projects', { ...form, current_phase: PHASES[form.phase_index] })
      onSaved(); onClose()
    } catch {}
    setSaving(false)
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Project' : 'New Project'}>
      <Field label="Project Name"><Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. DevOps Pipeline Platform" /></Field>
      <Field label="Description"><Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does it do?" /></Field>
      <Field label="Tech Stack"><Input value={form.tech_stack} onChange={e => set('tech_stack', e.target.value)} placeholder="Node.js, PostgreSQL, Redis, Docker" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="GitHub URL"><Input value={form.github_url} onChange={e => set('github_url', e.target.value)} placeholder="https://github.com/..." /></Field>
        <Field label="Deployment URL"><Input value={form.deployment_url} onChange={e => set('deployment_url', e.target.value)} placeholder="https://..." /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <Select value={form.status} onChange={e => set('status', e.target.value)}>
            <option>Planned</option><option>In Progress</option><option>Done</option>
          </Select>
        </Field>
        <Field label="Current Phase">
          <Select value={form.phase_index} onChange={e => set('phase_index', parseInt(e.target.value))}>
            {PHASES.map((p, i) => <option key={p} value={i}>{p}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Core Feature This Week"><Input value={form.core_feature} onChange={e => set('core_feature', e.target.value)} placeholder="e.g. JWT Auth middleware" /></Field>
      <Field label="System Design Applied"><Input value={form.system_design_applied} onChange={e => set('system_design_applied', e.target.value)} placeholder="e.g. Rate limiting, Token bucket" /></Field>
      <Field label="Interview Explanation (30 seconds)">
        <Textarea value={form.interview_explanation} onChange={e => set('interview_explanation', e.target.value)} placeholder="How would you describe this project in a real interview? Write it now." style={{ minHeight: 80 }} />
      </Field>
      <button onClick={save} disabled={saving} className="btn-exec w-full justify-center py-3">
        {saving ? 'Saving...' : editing ? 'Update Project' : 'Create Project'}
      </button>
    </Modal>
  )
}

export function Projects() {
  const { projects, loading, refetch } = useProjects()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const del = async (id) => { if (confirm('Delete?')) { await api.delete(`/projects/${id}`); refetch() } }
  if (loading) return <LoadingState />

  return (
    <div className="p-6 space-y-6 page-enter">
      <SectionTitle sub="1 production-grade system. Feature-locked weeks. Ship, don't plan." action={
        <button onClick={() => { setEditing(null); setModal(true) }} className="btn-exec"><Plus size={15} /> New Project</button>
      }>Projects</SectionTitle>

      {projects.length === 0 && <EmptyState icon={FolderGit2} message="No projects yet" sub="Create your production project. This is what gets you hired." />}

      <div className="space-y-4">
        {projects.map(p => (
          <div key={p.id} className="exec-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-display font-bold text-lg text-white">{p.name}</h3>
                  <Badge status={p.status} label={p.status} />
                </div>
                <div className="text-ghost text-sm">{p.description}</div>
                {p.tech_stack && <div className="text-xs font-mono text-signal mt-1">{p.tech_stack}</div>}
              </div>
              <div className="flex gap-2">
                {p.github_url && <a href={p.github_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-surface border border-border text-ghost hover:text-white transition-colors"><Github size={14} /></a>}
                {p.deployment_url && <a href={p.deployment_url} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-surface border border-border text-ghost hover:text-white transition-colors"><ExternalLink size={14} /></a>}
                <button onClick={() => { setEditing(p); setModal(true) }} className="p-2 rounded-lg bg-surface border border-border text-ghost hover:text-white transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => del(p.id)} className="p-2 rounded-lg bg-surface border border-border text-ghost hover:text-kill transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>

            {/* Roadmap progress */}
            <div className="mb-4">
              <div className="section-label">Build Roadmap</div>
              <div className="flex gap-1.5">
                {PHASES.map((phase, i) => (
                  <div key={phase} className={`flex-1 text-center px-1 py-1.5 rounded text-[9px] font-mono transition-all ${i < p.phase_index ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : i === p.phase_index ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-surface border border-border text-ghost/40'}`}>
                    {phase.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              {p.core_feature && <div><div className="section-label">Core Feature</div><div className="text-slate-300">{p.core_feature}</div></div>}
              {p.system_design_applied && <div><div className="section-label">Design Applied</div><div className="text-slate-300">{p.system_design_applied}</div></div>}
              {p.interview_explanation && (
                <div><div className="section-label">30s Pitch</div>
                  <div className="text-slate-300 text-xs leading-relaxed">{p.interview_explanation}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <ProjectModal open={modal} onClose={() => { setModal(false); setEditing(null) }} onSaved={refetch} editing={editing} />
    </div>
  )
}

function GoalModal({ open, onClose, onSaved, editing }) {
  const [form, setForm] = React.useState(editing || { title: '', description: '', target_date: '', progress_pct: 0, status: 'Active', category: 'Career' })
  const [saving, setSaving] = React.useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  React.useEffect(() => { setForm(editing || { title: '', description: '', target_date: '', progress_pct: 0, status: 'Active', category: 'Career' }) }, [editing])
  const save = async () => {
    if (!form.title) return
    setSaving(true)
    try {
      if (editing?.id) await api.patch('/goals/' + editing.id, form)
      else await api.post('/goals', form)
      onSaved(); onClose()
    } catch {}
    setSaving(false)
  }
  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Goal' : 'New Goal'}>
      <Field label="Goal Title"><Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Get Internship #1 by Nov 2026" /></Field>
      <Field label="Description"><Textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does achieving this look like?" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Target Date"><Input type="date" value={form.target_date} onChange={e => set('target_date', e.target.value)} /></Field>
        <Field label="Category">
          <Select value={form.category} onChange={e => set('category', e.target.value)}>
            <option>Career</option><option>DSA</option><option>Project</option><option>Academic</option><option>Health</option>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Progress (%)"><Input type="number" min="0" max="100" value={form.progress_pct} onChange={e => set('progress_pct', parseInt(e.target.value) || 0)} /></Field>
        <Field label="Status">
          <Select value={form.status} onChange={e => set('status', e.target.value)}>
            <option>Active</option><option>Paused</option><option>Done</option>
          </Select>
        </Field>
      </div>
      <button onClick={save} disabled={saving} className="btn-exec w-full justify-center py-3">{saving ? 'Saving...' : editing ? 'Update Goal' : 'Create Goal'}</button>
    </Modal>
  )
}


export function Goals() {
  const { goals, loading, refetch } = useGoals()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const del = async (id) => { if (confirm('Delete goal?')) { await api.delete(`/goals/${id}`); refetch() } }
  if (loading) return <LoadingState />

  const milestones = [
    { label: 'Internship #1', sub: 'Top-tier / high-growth', target: 'Sem 5', status: 'active' },
    { label: '₹50 LPA+', sub: 'Internship #2 / PPO', target: 'Sem 6', status: 'future' },
    { label: '₹1 Cr+ Upgrade', sub: 'Global / off-campus', target: 'Sem 7', status: 'future' },
    { label: 'Startup', sub: 'MVP + Users + Validation', target: 'Sem 8', status: 'future' },
  ]

  return (
    <div className="p-6 space-y-6 page-enter">
      <SectionTitle sub="Every goal is a contract with your future self. No vague wishes." action={
        <button onClick={() => { setEditing(null); setModal(true) }} className="btn-exec"><Plus size={15} /> New Goal</button>
      }>Goals & Milestones</SectionTitle>

      {/* Career milestones */}
      <div className="exec-card">
        <CardHeader title="Career Trajectory" dot="bg-accent" />
        <div className="flex gap-3">
          {milestones.map((m, i) => (
            <div key={m.label} className={`flex-1 p-4 rounded-xl border ${m.status === 'active' ? 'border-accent/30 bg-accent/5' : 'border-border bg-surface'}`}>
              <div className={`text-2xl font-display font-bold mb-1 ${m.status === 'active' ? 'text-accent' : 'text-ghost'}`}>{m.target}</div>
              <div className={`font-semibold text-sm mb-0.5 ${m.status === 'active' ? 'text-white' : 'text-slate-400'}`}>{m.label}</div>
              <div className="text-ghost text-xs">{m.sub}</div>
              {m.status === 'active' && <div className="mt-2 text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded inline-block">ACTIVE</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Custom goals */}
      <div className="exec-card">
        <CardHeader title="Your Goals" dot="bg-purple-500" action={goals.length > 0 ? undefined : null} />
        {goals.length === 0 ? <EmptyState icon={Target} message="No goals defined" sub="Set concrete, dated goals. Vague ambitions don't ship." /> : (
          <div className="space-y-3">
            {goals.map(g => (
              <div key={g.id} className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{g.title}</span>
                    <Badge status={g.status} label={g.status} />
                    <Badge status={g.category} label={g.category} />
                  </div>
                  {g.description && <div className="text-ghost text-xs mb-2">{g.description}</div>}
                  <div className="flex items-center gap-3">
                    <ProgressBar value={g.progress_pct} max={100} color={g.progress_pct >= 80 ? 'bg-emerald-500' : g.progress_pct >= 50 ? 'bg-accent' : 'bg-amber-500'} />
                    <span className="text-xs font-mono text-ghost flex-shrink-0">{g.progress_pct}%</span>
                    {g.target_date && <span className="text-xs font-mono text-ghost flex-shrink-0">→ {g.target_date}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(g); setModal(true) }} className="p-1.5 text-ghost hover:text-white transition-colors"><Edit2 size={13} /></button>
                  <button onClick={() => del(g.id)} className="p-1.5 text-ghost hover:text-kill transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <GoalModal open={modal} onClose={() => { setModal(false); setEditing(null) }} onSaved={refetch} editing={editing} />
    </div>
  )
}


// Weekly Audit page
import { useAudit } from '../hooks/useData'
import { SearchCode } from 'lucide-react'

export function Audit() {
  const { computed, saved, weekStart, loading, refetch } = useAudit()
  const [form, setForm] = useState({ what_failed: '', root_cause: '', fix_next_week: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    setSaving(true)
    try { await api.post('/audit', { ...form, week_start: weekStart }); refetch() } catch {}
    setSaving(false)
  }

  if (loading) return <LoadingState />

  const dsaOk = (computed?.dsa_total || 0) >= 20
  const appsOk = (computed?.apps_total || 0) >= 20
  const scoreOk = (computed?.avg_score || 0) >= 25

  return (
    <div className="p-6 space-y-6 page-enter">
      <SectionTitle sub="Sunday review. Cold numbers. Brutal honesty. Next week's contract.">Weekly Audit</SectionTitle>

      <div className="grid grid-cols-4 gap-4">
        <StatBlock value={computed?.dsa_total || 0} label="DSA Problems" color={dsaOk ? 'text-emerald-400' : 'text-kill'} delta={`Target: 20–25/week ${dsaOk ? '✓' : '— FAILED'}`} deltaUp={dsaOk} />
        <StatBlock value={computed?.apps_total || 0} label="Applications" color={appsOk ? 'text-emerald-400' : 'text-kill'} delta={`Target: 20+/week ${appsOk ? '✓' : '— FAILED'}`} deltaUp={appsOk} />
        <StatBlock value={Math.round(computed?.avg_score || 0) + '/40'} label="Avg Score" color={scoreOk ? 'text-emerald-400' : 'text-amber-400'} delta={scoreOk ? 'On track' : 'Below target'} deltaUp={scoreOk} />
        <StatBlock value={Math.round(computed?.avg_energy || 0) + '/10'} label="Avg Energy" color={(computed?.avg_energy || 0) >= 6 ? 'text-emerald-400' : 'text-kill'} delta={(computed?.avg_energy || 0) <= 4 ? '⚠ Burnout risk' : 'Stable'} deltaUp={(computed?.avg_energy || 0) >= 6} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="exec-card">
          <CardHeader title="This Week's Audit" dot="bg-kill" />
          <Field label="What failed this week — be brutal">
            <Textarea value={form.what_failed} onChange={e => set('what_failed', e.target.value)} placeholder="No sugarcoating. What did you not execute on? Where did you fall short?" style={{ minHeight: 80 }} />
          </Field>
          <Field label="Root cause — why did it fail?">
            <Textarea value={form.root_cause} onChange={e => set('root_cause', e.target.value)} placeholder="Discipline? Confusion? Distraction? Be specific." style={{ minHeight: 60 }} />
          </Field>
          <Field label="Concrete fix for next week">
            <Textarea value={form.fix_next_week} onChange={e => set('fix_next_week', e.target.value)} placeholder="1 specific, measurable change you will make. Not vague intentions." style={{ minHeight: 60 }} />
          </Field>
          <button onClick={submit} disabled={saving} className="btn-exec">
            {saving ? 'Saving...' : 'Lock In Audit'}
          </button>
        </div>

        <div className="exec-card">
          <CardHeader title="Past Audits" dot="bg-ghost" />
          {saved.length === 0 ? <EmptyState icon={SearchCode} message="No past audits" sub="Your first audit will appear here after you save." /> : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {saved.map(a => (
                <div key={a.id} className="p-3 bg-surface rounded-lg border border-border">
                  <div className="text-xs font-mono text-ghost mb-2">Week of {a.week_start}</div>
                  <div className="flex gap-3 mb-2 text-xs font-mono">
                    <span className={a.dsa_total >= 20 ? 'text-emerald-400' : 'text-kill'}>DSA: {a.dsa_total}</span>
                    <span className={a.apps_total >= 50 ? 'text-emerald-400' : 'text-kill'}>Apps: {a.apps_total}</span>
                    <span className="text-amber-400">Avg: {Math.round(a.avg_score)}/40</span>
                  </div>
                  {a.what_failed && <div className="text-xs text-ghost leading-relaxed">{a.what_failed.substring(0, 120)}{a.what_failed.length > 120 ? '...' : ''}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// Principles page
import { Zap as ZapIcon } from 'lucide-react'

const PRINCIPLES = [
  { n: '01', text: 'Build in depth, not breadth. One production project done completely beats ten half-built repos in an interview.', accent: true },
  { n: '02', text: 'Apply before you feel ready. Waiting for the "right time" is waiting to fail. The application IS the preparation.' },
  { n: '03', text: 'Every day without a GitHub commit is a day that happened to you, not a day you built your future.' },
  { n: '04', text: '50 applications is the floor. Not a goal. High quality + high volume = interview. You need both.', accent: true },
  { n: '05', text: 'If you cannot explain it in 30 seconds to a stranger, you do not understand it well enough to put it on your resume.' },
  { n: '06', text: 'Energy management IS performance management. Low energy = low output. Track it, protect it, don\'t romanticize grinding.' },
  { n: '07', text: 'DSA is a skill with patterns, not a ritual with random problems. Learn the 15 patterns. The rest is application.', accent: true },
  { n: '08', text: 'Rejection data is more valuable than silence. Log every rejection. Analyze the pattern. Adjust the system. Never personalize.' },
  { n: '09', text: 'Discipline is your future self\'s plan being executed by your present self. Your present self is not in charge of direction.' },
  { n: '10', text: 'The internship is not the destination. ₹1Cr is a checkpoint. The actual goal is building systems that cannot be ignored.', accent: true },
  { n: '11', text: 'Referrals increase interview rate by 5–10x. Networking is not socializing — it is a systematic job search multiplier.' },
  { n: '12', text: 'The score you give yourself tonight is the forecast for the engineer you become. Score honestly. Always.' },
]

export function Principles() {
  return (
    <div className="p-6 space-y-6 page-enter">
      <SectionTitle sub="Read these every morning. They are not motivational quotes. They are operating instructions.">
        Operating Principles
      </SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {PRINCIPLES.map(p => (
          <div key={p.n} className={`exec-card border-l-2 ${p.accent ? 'border-l-accent bg-accent/[0.03]' : 'border-l-border'}`}>
            <div className={`text-xs font-mono font-bold mb-2 ${p.accent ? 'text-accent' : 'text-ghost'}`}>— {p.n}</div>
            <p className="text-slate-300 text-sm leading-relaxed">{p.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
