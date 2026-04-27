import React, { useState, useEffect } from 'react'
import { Plus, X, Edit3, Check } from 'lucide-react'
import { SectionTitle } from '../components/UI'
import { DAY_TYPE_COLORS } from '../lib/utils'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_META = {
  Mon: { type: 'A', typeLabel: 'Tech Core', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' },
  Tue: { type: 'B', typeLabel: 'ML+Acad', color: 'text-signal', badge: 'bg-signal/20 border-signal/30 text-signal' },
  Wed: { type: 'A', typeLabel: 'Tech Core', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' },
  Thu: { type: 'B', typeLabel: 'ML+Acad', color: 'text-signal', badge: 'bg-signal/20 border-signal/30 text-signal' },
  Fri: { type: 'A', typeLabel: 'Tech Core', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' },
  Sat: { type: 'C', typeLabel: 'Build Day', color: 'text-purple-400', badge: 'bg-purple-500/20 border-purple-500/30 text-purple-400' },
  Sun: { type: 'D', typeLabel: 'Recovery', color: 'text-slate-400', badge: 'bg-slate-500/20 border-slate-500/30 text-slate-400' },
}

const DEFAULT_BLOCKS = {
  Mon: [{ task: 'Python + DSA', hours: '2h' }, { task: 'Backend / FastAPI', hours: '2h' }, { task: 'IITM BS Work', hours: '2h' }, { task: 'B.Tech Tasks', hours: '1h' }],
  Tue: [{ task: 'IITM Deep Work', hours: '2h' }, { task: 'ML Practice', hours: '2.5h' }, { task: 'Python Implementation', hours: '1.5h' }, { task: 'DSA (light) + B.Tech', hours: '1h' }],
  Wed: [{ task: 'Python + DSA', hours: '2h' }, { task: 'Backend / Projects', hours: '2h' }, { task: 'IITM BS Work', hours: '2h' }, { task: 'B.Tech Tasks', hours: '1h' }],
  Thu: [{ task: 'IITM Deep Work', hours: '2h' }, { task: 'ML Practice', hours: '2.5h' }, { task: 'Python Implementation', hours: '1.5h' }, { task: 'DSA (light) + B.Tech', hours: '1h' }],
  Fri: [{ task: 'Python + DSA', hours: '2h' }, { task: 'Backend / Projects', hours: '2h' }, { task: 'IITM BS Work', hours: '2h' }, { task: 'B.Tech Tasks', hours: '1h' }],
  Sat: [{ task: 'Project Progress', hours: '2h' }, { task: 'Deployment / GitHub', hours: '1.5h' }, { task: 'Resume / Portfolio', hours: '1h' }, { task: 'Pending Tasks', hours: '0.5h' }],
  Sun: [{ task: 'Weekly Audit', hours: '1h' }, { task: 'Plan Next Week', hours: '0.5h' }, { task: 'Light Revision', hours: '1h' }, { task: 'Rest', hours: 'rest' }],
}

const HOURS_OPTIONS = ['0.5h', '1h', '1.5h', '2h', '2.5h', '3h', 'rest', 'flexible']

const STORAGE_KEY = 'execos_schedule_v2'

function loadSchedule() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return Object.keys(DEFAULT_BLOCKS).reduce((acc, day) => {
      acc[day] = saved[day] || DEFAULT_BLOCKS[day].map((b, i) => ({ ...b, id: `${day}-${i}` }))
      return acc
    }, {})
  } catch {
    return Object.keys(DEFAULT_BLOCKS).reduce((acc, day) => {
      acc[day] = DEFAULT_BLOCKS[day].map((b, i) => ({ ...b, id: `${day}-${i}` }))
      return acc
    }, {})
  }
}

const todayDay = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]

export default function Schedule() {
  const [schedule, setSchedule] = useState(loadSchedule)
  const [editingDay, setEditingDay] = useState(null)
  const [editingBlock, setEditingBlock] = useState(null) // { day, idx }
  const [editVal, setEditVal] = useState({ task: '', hours: '1h' })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schedule))
  }, [schedule])

  const addBlock = (day) => {
    const newBlock = { task: 'New Block', hours: '1h', id: `${day}-${Date.now()}` }
    setSchedule(s => ({ ...s, [day]: [...(s[day] || []), newBlock] }))
  }

  const removeBlock = (day, idx) => {
    setSchedule(s => ({ ...s, [day]: s[day].filter((_, i) => i !== idx) }))
  }

  const startEdit = (day, idx) => {
    setEditingBlock({ day, idx })
    setEditVal({ task: schedule[day][idx].task, hours: schedule[day][idx].hours })
  }

  const saveEdit = () => {
    if (!editingBlock) return
    const { day, idx } = editingBlock
    setSchedule(s => ({
      ...s,
      [day]: s[day].map((b, i) => i === idx ? { ...b, ...editVal } : b)
    }))
    setEditingBlock(null)
  }

  const totalHours = (day) => {
    return schedule[day]?.reduce((sum, b) => {
      const h = parseFloat(b.hours) || 0
      return sum + h
    }, 0) || 0
  }

  const BLOCK_BORDER_COLORS = ['border-l-emerald-500', 'border-l-signal', 'border-l-purple-500', 'border-l-amber-500']

  return (
    <div className="p-6 space-y-6 page-enter">
      <SectionTitle sub="Your fixed weekly structure from the planner. 7 hours/day max. Customize each day's blocks below.">
        Weekly Schedule
      </SectionTitle>

      {/* Planner note */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-signal/20 bg-signal/5">
        <span className="text-signal text-sm">→</span>
        <div>
          <span className="text-xs font-mono text-signal uppercase tracking-widest">From Your Planner — Fixed Structure</span>
          <p className="text-xs text-ghost mt-1">Mon/Wed/Fri = Tech Core (Python+DSA, Backend, IITM, B.Tech). Tue/Thu = ML + Academics (IITM deep work, ML, Python impl, DSA light). Saturday = Build Day (project, deploy, GitHub). Sunday = Recovery + Review (2–3h max).</p>
        </div>
      </div>

      {/* Weekly grid — 7 columns */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS.map(day => {
          const meta = DAY_META[day]
          const isToday = day === todayDay
          const hours = totalHours(day)
          return (
            <div key={day} className={`rounded-xl border p-3 ${isToday ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20' : 'border-border bg-surface'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-mono font-bold ${isToday ? 'text-accent' : 'text-white'}`}>{day.toUpperCase()}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${meta.badge}`}>{meta.typeLabel}</span>
              </div>
              <div className="space-y-1.5">
                {schedule[day]?.map((block, i) => (
                  <div key={block.id || i} className={`pl-2 border-l-2 ${BLOCK_BORDER_COLORS[i % BLOCK_BORDER_COLORS.length]}`}>
                    <div className="text-xs text-slate-200 leading-tight">{block.task}</div>
                    <div className="text-[10px] font-mono text-ghost">{block.hours}</div>
                  </div>
                ))}
              </div>
              {isToday && <div className="mt-2 text-[10px] font-mono text-accent">● TODAY</div>}
              <div className="mt-2 text-[10px] font-mono text-ghost">{hours > 0 ? `${hours}h total` : ''}</div>
            </div>
          )
        })}
      </div>

      {/* Edit section — per day */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono text-ghost uppercase tracking-widest">Customize Day Blocks</div>
        <div className="text-xs font-mono text-ghost">Click + to add custom tasks to any day</div>
      </div>

      <div className="space-y-4">
        {DAYS.map(day => {
          const meta = DAY_META[day]
          return (
            <div key={day} className="exec-card">
              {/* Day header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold text-sm ${meta.color}`}>{day.toUpperCase()} — {meta.typeLabel.toUpperCase()}</span>
                  <span className="text-xs font-mono text-ghost">{totalHours(day)}h / 7h max</span>
                </div>
                <button onClick={() => addBlock(day)} className="flex items-center gap-1.5 text-xs font-mono text-ghost hover:text-white border border-border hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all">
                  <Plus size={11} /> Add Block
                </button>
              </div>

              {/* Block rows */}
              <div className="space-y-2">
                {schedule[day]?.map((block, idx) => {
                  const isEditingThis = editingBlock?.day === day && editingBlock?.idx === idx
                  return (
                    <div key={block.id || idx} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-ghost w-14">Block {idx + 1}</span>
                      {isEditingThis ? (
                        <>
                          <input
                            className="flex-1 bg-void border border-accent/40 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-accent/80"
                            value={editVal.task}
                            onChange={e => setEditVal(v => ({ ...v, task: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && saveEdit()}
                            autoFocus
                          />
                          <select
                            className="w-24 bg-void border border-border rounded-lg px-2 py-2 text-sm text-white outline-none"
                            value={editVal.hours}
                            onChange={e => setEditVal(v => ({ ...v, hours: e.target.value }))}
                          >
                            {HOURS_OPTIONS.map(h => <option key={h}>{h}</option>)}
                          </select>
                          <button onClick={saveEdit} className="p-2 text-emerald-400 hover:text-emerald-300"><Check size={14} /></button>
                          <button onClick={() => setEditingBlock(null)} className="p-2 text-ghost hover:text-white"><X size={14} /></button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 bg-void border border-border rounded-lg px-3 py-2 text-sm text-slate-300">{block.task}</div>
                          <div className="w-24 bg-void border border-border rounded-lg px-3 py-2 text-sm text-ghost text-center">{block.hours}</div>
                          <button onClick={() => startEdit(day, idx)} className="p-2 text-ghost hover:text-white transition-colors"><Edit3 size={13} /></button>
                          <button onClick={() => removeBlock(day, idx)} className="p-2 text-ghost hover:text-kill transition-colors"><X size={13} /></button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
