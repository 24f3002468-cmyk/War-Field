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
      {timers.length === 0 && <EmptyState icon={Timer} message="No timers yet" sub="Add a Pomodoro to protect your focus." />}
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
      <AddTimerModal open={modal} onClose={() => setModal(false)} onSaved={refetch} />
    </div>
  )
}
