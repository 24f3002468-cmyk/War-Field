import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, Play, Pause, RotateCcw, Timer, SkipForward } from 'lucide-react'
import { useTimers } from '../hooks/useData'
import api from '../lib/api'
import { SectionTitle, Modal, Field, Input, Select, EmptyState, LoadingState } from '../components/UI'
import { fmtTimer, deadlineCountdown } from '../lib/utils'
import { useStore } from '../store'

// Global persistent pomodoro — shared across pages via store
export function GlobalTimerBar() {
  const { activeTimer, setActiveTimer } = useStore()
  if (!activeTimer) return null
  const { name, timeLeft, phase, workSessions } = activeTimer
  const phaseColor = phase === 'break' ? 'text-emerald-400' : phase === 'work' ? 'text-signal' : 'text-ghost'
  const isRunning = phase === 'work' || phase === 'break'
  return (
    <div className="fixed top-0 left-56 right-0 z-50 h-8 bg-void/95 border-b border-border flex items-center px-4 gap-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <Timer size={11} className="text-signal" />
        <span className="text-xs font-mono text-ghost">{name}</span>
        <span className={`text-xs font-mono font-bold ${phaseColor}`}>{fmtTimer(timeLeft)}</span>
        <span className={`text-[10px] font-mono ${phaseColor}`}>
          {phase === 'work' ? '⬤ FOCUS' : phase === 'break' ? '⬤ BREAK' : phase === 'paused' ? '⏸ PAUSED' : ''}
        </span>
      </div>
      <span className="text-[10px] font-mono text-ghost">Sessions: {workSessions}</span>
      <button onClick={() => setActiveTimer(null)} className="ml-auto text-[10px] font-mono text-ghost hover:text-white">✕ dismiss</button>
    </div>
  )
}

function PomodoroTimer({ timer, onDelete }) {
  const { activeTimer, setActiveTimer } = useStore()
  const isActive = activeTimer?.id === timer.id
  const [phase, setPhase] = useState(isActive ? activeTimer.phase : 'idle')
  const [timeLeft, setTimeLeft] = useState(isActive ? activeTimer.timeLeft : 25 * 60)
  const [workSessions, setWorkSessions] = useState(isActive ? activeTimer.workSessions : 0)
  const intervalRef = useRef(null)
  const WORK = 25 * 60
  const BREAK = 5 * 60

  // Sync to global store when running
  useEffect(() => {
    if (phase === 'work' || phase === 'break' || phase === 'paused') {
      setActiveTimer({ id: timer.id, name: timer.name, phase, timeLeft, workSessions })
    } else if (isActive) {
      setActiveTimer(null)
    }
  }, [phase, timeLeft, workSessions])

  useEffect(() => {
    if (phase === 'work' || phase === 'break') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current)
            if (phase === 'work') {
              setWorkSessions(s => s + 1)
              setPhase('break')
              // Play notification sound
              try { new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAA').play() } catch {}
              return BREAK
            } else {
              setPhase('idle')
              return WORK
            }
          }
          return t - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [phase])

  const toggle = () => {
    if (phase === 'idle' || phase === 'paused') setPhase('work')
    else setPhase('paused')
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    setPhase('idle')
    setTimeLeft(WORK)
    setWorkSessions(0)
    setActiveTimer(null)
  }

  const skip = () => {
    clearInterval(intervalRef.current)
    if (phase === 'work') {
      setWorkSessions(s => s + 1)
      setPhase('break')
      setTimeLeft(BREAK)
    } else {
      setPhase('idle')
      setTimeLeft(WORK)
    }
  }

  const phasePct = Math.round((timeLeft / (phase === 'break' ? BREAK : WORK)) * 100)
  const circumference = 2 * Math.PI * 54

  return (
    <div className="exec-card flex flex-col items-center gap-4 relative">
      <button onClick={() => onDelete(timer.id)} className="absolute top-3 right-3 p-1 text-border hover:text-kill transition-colors">
        <Trash2 size={13} />
      </button>

      <div className="text-xs font-mono text-ghost uppercase tracking-widest">{timer.name || 'Pomodoro'}</div>

      {/* Circular progress */}
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1f2e" strokeWidth="6" />
          <circle cx="60" cy="60" r="54" fill="none"
            stroke={phase === 'break' ? '#22c55e' : phase === 'paused' ? '#f59e0b' : '#00e5ff'}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - phasePct / 100)}
            style={{ transition: phase === 'idle' ? 'none' : 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-bold text-2xl text-white tracking-tight">{fmtTimer(timeLeft)}</span>
          <span className={`text-[10px] font-mono mt-0.5 ${phase === 'break' ? 'text-emerald-400' : phase === 'work' ? 'text-signal' : phase === 'paused' ? 'text-amber-400' : 'text-ghost'}`}>
            {phase === 'idle' ? 'READY' : phase === 'work' ? 'FOCUS' : phase === 'break' ? 'BREAK' : 'PAUSED'}
          </span>
        </div>
      </div>

      {/* Session dots */}
      <div className="flex gap-1.5">
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-2 h-2 rounded-full ${i < workSessions % 4 ? 'bg-signal' : 'bg-surface border border-border'}`} />
        ))}
      </div>

      <div className="flex gap-2">
        <button onClick={toggle} className="flex items-center gap-1.5 btn-signal px-5 py-2 text-sm">
          {phase === 'work' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> {phase === 'break' ? 'Break' : 'Start'}</>}
        </button>
        <button onClick={reset} className="btn-ghost px-3 py-2" title="Reset"><RotateCcw size={14} /></button>
        <button onClick={skip} className="btn-ghost px-3 py-2" title="Skip"><SkipForward size={14} /></button>
      </div>

      <div className="text-xs font-mono text-ghost text-center">
        Sessions: <span className="text-accent font-bold">{workSessions}</span>
        {workSessions >= 4 && <span className="text-emerald-400 ml-2">⚡ Deep work achieved</span>}
      </div>
    </div>
  )
}

function CountdownTimer({ timer, onDelete }) {
  const [remaining, setRemaining] = useState(deadlineCountdown(timer.deadline_at))
  useEffect(() => {
    if (!timer.deadline_at) return
    const id = setInterval(() => setRemaining(deadlineCountdown(timer.deadline_at)), 1000)
    return () => clearInterval(id)
  }, [timer.deadline_at])
  const isExpired = remaining === 'Expired'
  return (
    <div className={`exec-card flex flex-col items-center gap-3 relative ${isExpired ? 'border-kill/30' : ''}`}>
      <button onClick={() => onDelete(timer.id)} className="absolute top-3 right-3 p-1 text-border hover:text-kill transition-colors"><Trash2 size={13} /></button>
      <div className="text-xs font-mono text-ghost uppercase tracking-widest">{timer.name}</div>
      <div className={`font-display font-bold text-4xl ${isExpired ? 'text-kill' : 'text-signal'}`}>{remaining}</div>
      <div className="text-xs font-mono text-ghost">
        {timer.deadline_at ? new Date(timer.deadline_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
      </div>
      {isExpired && <div className="text-kill text-xs font-mono">This deadline has passed.</div>}
    </div>
  )
}

function AddTimerModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', type: 'Countdown', deadline_at: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = async () => {
    if (!form.name) return
    setSaving(true)
    try {
      await api.post('/timers', {
        name: form.name, type: form.type,
        deadline_at: form.type !== 'Pomodoro' && form.deadline_at ? new Date(form.deadline_at).toISOString() : undefined,
        duration_seconds: form.type === 'Pomodoro' ? 25 * 60 : null,
      })
      onSaved(); onClose()
      setForm({ name: '', type: 'Pomodoro', deadline_at: '' })
    } catch {}
    setSaving(false)
  }
  return (
  <Modal open={open} onClose={onClose} title="New Timer">
    <Field label="Timer Name"><Input placeholder="e.g. 4th Sem Exams / OA Deadline" value={form.name} onChange={e => set('name', e.target.value)} /></Field>
    <Field label="Type">
      <Select value={form.type} onChange={e => set('type', e.target.value)}>
        <option>Pomodoro</option><option>Countdown</option><option>Deadline</option>
      </Select>
    </Field>
    {form.type !== 'Pomodoro' && (
      <Field label="Target Date & Time (required)">
        <Input type="datetime-local" value={form.deadline_at} onChange={e => set('deadline_at', e.target.value)} />
      </Field>
    )}
    {form.type !== 'Pomodoro' && !form.deadline_at && (
      <p className="text-kill text-xs font-mono">⚠ You must set a deadline date for countdown timers</p>
    )}
    <button onClick={save} disabled={saving || (form.type !== 'Pomodoro' && !form.deadline_at)} className="btn-exec w-full justify-center py-3 disabled:opacity-40">
      {saving ? 'Creating...' : 'Create Timer'}
    </button>
  </Modal>
)
}

const TIMELINE_KEY = 'execos_timelines_v1'

function loadTimelines() {
  try { return JSON.parse(localStorage.getItem(TIMELINE_KEY) || '[]') } catch { return [] }
}

function TimelineTracker() {
  const [timelines, setTimelines] = React.useState(loadTimelines)
  const [form, setForm] = React.useState({ name: '', category: 'DSA', color: 'accent' })
  const [adding, setAdding] = React.useState(false)

  const COLORS = {
    accent: { dot: 'bg-accent', text: 'text-accent', border: 'border-accent/30', bg: 'bg-accent/5' },
    signal: { dot: 'bg-signal', text: 'text-signal', border: 'border-signal/30', bg: 'bg-signal/5' },
    emerald: { dot: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
    purple: { dot: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/30', bg: 'bg-purple-500/5' },
    amber: { dot: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5' },
    kill: { dot: 'bg-kill', text: 'text-kill', border: 'border-kill/30', bg: 'bg-kill/5' },
  }

  const CATEGORIES = ['DSA', 'Python', 'Backend', 'ML', 'Projects', 'Career', 'Fitness', 'Habit', 'Custom']

  const save = (data) => { setTimelines(data); localStorage.setItem(TIMELINE_KEY, JSON.stringify(data)) }

  const add = () => {
    if (!form.name.trim()) return
    const newTimeline = {
      id: Date.now().toString(),
      name: form.name.trim(),
      category: form.category,
      color: form.color,
      startDate: new Date().toISOString().split('T')[0],
      log: [new Date().toISOString().split('T')[0]], // daily check-in log
      note: '',
    }
    save([newTimeline, ...timelines])
    setForm({ name: '', category: 'DSA', color: 'accent' })
    setAdding(false)
  }

  const del = (id) => save(timelines.filter(t => t.id !== id))

  const checkIn = (id) => {
    const today = new Date().toISOString().split('T')[0]
    save(timelines.map(t => {
      if (t.id !== id) return t
      const log = t.log || []
      if (log.includes(today)) return t // already checked in today
      return { ...t, log: [...log, today] }
    }))
  }

  const getDaysElapsed = (startDate) => {
    const start = new Date(startDate)
    const now = new Date()
    start.setHours(0,0,0,0)
    now.setHours(0,0,0,0)
    return Math.floor((now - start) / 86400000)
  }

  const getStreak = (log) => {
    if (!log || !log.length) return 0
    const sorted = [...log].sort().reverse()
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0
    let streak = 0
    let current = new Date(sorted[0])
    for (const d of sorted) {
      const date = new Date(d)
      const diff = Math.floor((current - date) / 86400000)
      if (diff <= 1) { streak++; current = date }
      else break
    }
    return streak
  }

  const getConsistency = (log, daysElapsed) => {
    if (!daysElapsed) return 100
    return Math.round(((log?.length || 0) / (daysElapsed + 1)) * 100)
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-ghost uppercase tracking-widest">Timeline Tracker</div>
        <button onClick={() => setAdding(a => !a)} className="btn-exec text-xs py-1.5 px-3">
          {adding ? '✕ Cancel' : '+ New Timeline'}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="exec-card border border-accent/20 space-y-3">
          <div className="text-xs font-mono text-accent uppercase tracking-widest">Start a New Timeline</div>
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-5">
              <label className="text-[10px] font-mono text-ghost uppercase tracking-widest mb-1 block">Name</label>
              <input
                className="exec-input"
                placeholder="e.g. DSA Grind, Python Habit, Job Hunt..."
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && add()}
                autoFocus
              />
            </div>
            <div className="col-span-3">
              <label className="text-[10px] font-mono text-ghost uppercase tracking-widest mb-1 block">Category</label>
              <select className="exec-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-span-3">
              <label className="text-[10px] font-mono text-ghost uppercase tracking-widest mb-1 block">Color</label>
              <div className="flex gap-2 mt-2">
                {Object.entries(COLORS).map(([key, val]) => (
                  <button key={key} onClick={() => setForm(f => ({ ...f, color: key }))}
                    className={`w-5 h-5 rounded-full ${val.dot} transition-all ${form.color === key ? 'ring-2 ring-white ring-offset-1 ring-offset-void scale-125' : 'opacity-60 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>
            <div className="col-span-1 flex items-end">
              <button onClick={add} className="btn-exec w-full justify-center py-2">Start</button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline cards */}
      {timelines.length === 0 && !adding && (
        <div className="exec-card flex flex-col items-center gap-2 py-8 text-center">
          <div className="text-2xl">⏱</div>
          <div className="text-ghost text-sm font-mono">No timelines yet</div>
          <div className="text-ghost/50 text-xs font-mono">Start tracking your habits, grinds and journeys</div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {timelines.map(tl => {
          const days = getDaysElapsed(tl.startDate)
          const streak = getStreak(tl.log)
          const consistency = getConsistency(tl.log, days)
          const checkedInToday = tl.log?.includes(today)
          const c = COLORS[tl.color] || COLORS.accent

          const dayLabel = days === 0 ? 'Started today' : days === 1 ? '1 day ago' : `${days} days ago`
          const milestone = days >= 365 ? '🏆 1 Year!' : days >= 180 ? '🔥 6 Months' : days >= 90 ? '💪 90 Days' : days >= 30 ? '⚡ 30 Days' : days >= 7 ? '✓ 1 Week' : null

          return (
            <div key={tl.id} className={`exec-card border ${c.border} ${c.bg} relative`}>
              {/* Delete */}
              <button onClick={() => del(tl.id)} className="absolute top-3 right-3 text-ghost hover:text-kill text-xs transition-colors">✕</button>

              {/* Header */}
              <div className="flex items-start gap-3 pr-6">
                <div className={`w-2.5 h-2.5 rounded-full ${c.dot} mt-1.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-white text-sm leading-tight">{tl.name}</div>
                  <div className="text-[10px] font-mono text-ghost mt-0.5">{tl.category}</div>
                </div>
              </div>

              {/* Days counter — big focal point */}
              <div className="mt-4 mb-3">
                <div className={`font-display font-bold text-4xl ${c.text}`}>{days}</div>
                <div className="text-xs font-mono text-ghost mt-0.5">{dayLabel}</div>
                {milestone && (
                  <div className={`text-xs font-mono ${c.text} mt-1`}>{milestone}</div>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                  <div className={`font-mono font-bold text-lg ${streak >= 7 ? 'text-emerald-400' : streak >= 3 ? 'text-amber-400' : 'text-ghost'}`}>{streak}</div>
                  <div className="text-[10px] font-mono text-ghost">streak</div>
                </div>
                <div className="text-center">
                  <div className={`font-mono font-bold text-lg ${consistency >= 80 ? 'text-emerald-400' : consistency >= 50 ? 'text-amber-400' : 'text-kill'}`}>{consistency}%</div>
                  <div className="text-[10px] font-mono text-ghost">consistency</div>
                </div>
                <div className="text-center">
                  <div className="font-mono font-bold text-lg text-ghost">{tl.log?.length || 0}</div>
                  <div className="text-[10px] font-mono text-ghost">check-ins</div>
                </div>
              </div>

              {/* Consistency bar */}
              <div className="h-1 bg-surface rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all duration-700 ${consistency >= 80 ? 'bg-emerald-500' : consistency >= 50 ? 'bg-amber-500' : 'bg-kill'}`}
                  style={{ width: `${consistency}%` }} />
              </div>

              {/* Start date */}
              <div className="text-[10px] font-mono text-ghost mb-3">
                Started {new Date(tl.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>

              {/* Daily check-in button */}
              <button
                onClick={() => checkIn(tl.id)}
                disabled={checkedInToday}
                className={`w-full py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                  checkedInToday
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default'
                    : `${c.bg} border ${c.border} ${c.text} hover:opacity-80 cursor-pointer`
                }`}
              >
                {checkedInToday ? '✓ Checked in today' : '+ Check in today'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Timers() {
  const { timers, loading, refetch } = useTimers()
  const [modal, setModal] = useState(false)
  const deleteTimer = async (id) => { await api.delete(`/timers/${id}`); refetch() }
  const pomodoros = timers.filter(t => t.type === 'Pomodoro')
  const countdowns = timers.filter(t => t.type !== 'Pomodoro')
  if (loading) return <LoadingState />
  return (
    <div className="p-6 space-y-6 page-enter">
      <SectionTitle sub="Protect your focus. Every block of deep work is a brick in the ₹1Cr foundation." action={
        <button onClick={() => setModal(true)} className="btn-exec"><Plus size={15} /> Add Timer</button>
      }>Timer System</SectionTitle>
      {timers.length === 0 && pomodoros.length === 0 && <EmptyState icon={Timer} message="No timers yet" sub="Add a Pomodoro to protect your focus." />}
      {pomodoros.length > 0 && (
        <div>
          <div className="section-label mb-3">Pomodoro Timers</div>
          <div className="grid grid-cols-3 gap-4">
            {pomodoros.map(t => <PomodoroTimer key={t.id} timer={t} onDelete={deleteTimer} />)}
          </div>
        </div>
      )}
      {countdowns.length > 0 && (
        <div>
          <div className="section-label mb-3">Deadlines & Countdowns</div>
          <div className="grid grid-cols-3 gap-4">
            {countdowns.map(t => <CountdownTimer key={t.id} timer={t} onDelete={deleteTimer} />)}
          </div>
        </div>
      )}
      <TimelineTracker />
      <AddTimerModal open={modal} onClose={() => setModal(false)} onSaved={refetch} />
    </div>
  )
}
