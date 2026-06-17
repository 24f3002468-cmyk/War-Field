import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, CheckCircle2, Circle, Calendar, Tag, AlertCircle, Clock, RepeatIcon } from 'lucide-react'
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'
import { SectionTitle, Field, Input, Select, Badge, EmptyState } from '../components/UI'
import { TASK_CATEGORIES } from '../lib/utils'

const PRIORITIES = ['P0 — Critical', 'P1 — High', 'P2 — Medium', 'P3 — Low']
const PRIORITY_COLORS = {
  'P0 — Critical': 'text-kill border-kill/40 bg-kill/10',
  'P1 — High': 'text-amber-400 border-amber-400/40 bg-amber-400/10',
  'P2 — Medium': 'text-signal border-signal/40 bg-signal/10',
  'P3 — Low': 'text-slate-400 border-slate-400/40 bg-slate-400/10',
}

const REPEAT_OPTIONS = ['None', 'Daily', 'Weekly', 'Monthly', 'Weekdays', 'Custom']
const REPEAT_COLORS = {
  'None': 'text-ghost',
  'Daily': 'text-signal',
  'Weekly': 'text-emerald-400',
  'Monthly': 'text-purple-400',
  'Weekdays': 'text-amber-400',
  'Custom': 'text-accent',
}

const STORAGE_KEY = 'execos_tasks_v2'

function loadTasks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

function deadlineLabel(dl) {
  if (!dl) return null
  try {
    const d = parseISO(dl)
    if (isPast(d) && !isToday(d)) return { text: 'Overdue', cls: 'text-kill' }
    if (isToday(d)) return { text: 'Due today', cls: 'text-amber-400' }
    if (isTomorrow(d)) return { text: 'Due tomorrow', cls: 'text-signal' }
    return { text: `Due ${format(d, 'dd MMM')}`, cls: 'text-slate-400' }
  } catch { return null }
}

export default function Tasks() {
  const [tasks, setTasks] = useState(loadTasks)
  const [form, setForm] = useState({ name: '', category: 'DSA', priority: 'P2 — Medium', deadline: '', repeat: 'None', customRepeat: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => { saveTasks(tasks) }, [tasks])
  useEffect(() => {
  const today = new Date().toISOString().split('T')[0]
  const dayOfWeek = new Date().getDay() // 0=Sun, 1=Mon...
  const dayOfMonth = new Date().getDate()

  const reset = tasks.map(task => {
    if (!task.done || task.repeat === 'None' || !task.lastCompleted) return task
    if (task.lastCompleted === today) return task // already handled today

    const shouldReset = (() => {
      if (task.repeat === 'Daily') return true
      if (task.repeat === 'Weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5
      if (task.repeat === 'Weekly') {
        const last = new Date(task.lastCompleted)
        return (new Date() - last) >= 7 * 86400000
      }
      if (task.repeat === 'Monthly') return new Date(task.lastCompleted).getDate() !== dayOfMonth
      return false
    })()

    if (shouldReset) return { ...task, done: false }
    return task
  })

  const hasChange = reset.some((t, i) => t.done !== tasks[i].done)
  if (hasChange) setTasks(reset)
}, []) // runs once on mount

  const add = () => {
    if (!form.name.trim()) return
    const task = {
      id: Date.now().toString(),
      name: form.name.trim(),
      category: form.category,
      priority: form.priority,
      deadline: form.deadline || null,
      repeat: form.repeat || 'None',
      customRepeat: form.customRepeat || '',
      done: false,
      createdAt: new Date().toISOString(),
      lastCompleted: null,
}
    setTasks(t => [task, ...t])
    setForm(f => ({ ...f, name: '', deadline: '' }))
  }

  const toggle = (id) => {
    const today = new Date().toISOString().split('T')[0]
      setTasks(t => t.map(x => {
        if (x.id !== id) return x
        if (!x.done && x.repeat !== 'None') {
          // Mark done but schedule next occurrence
          return { ...x, done: true, lastCompleted: today }
        }
        return { ...x, done: !x.done }
      }))
}
  const del = (id) => setTasks(t => t.filter(x => x.id !== id))

  // Group: today's deadlines, upcoming, no deadline, done
  const today = new Date().toISOString().split('T')[0]
  const todayTasks = tasks.filter(t => !t.done && t.deadline === today)
  const overdue = tasks.filter(t => !t.done && t.deadline && t.deadline < today)
  const upcoming = tasks.filter(t => !t.done && t.deadline && t.deadline > today)
  const noDeadline = tasks.filter(t => !t.done && !t.deadline)
  const done = tasks.filter(t => t.done)

  const TaskRow = ({ task }) => {
    const dl = deadlineLabel(task.deadline)
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${task.done ? 'border-border/30 opacity-50' : 'border-border bg-surface hover:border-slate-600'}`}>
        <button onClick={() => toggle(task.id)} className="flex-shrink-0">
          {task.done
            ? <CheckCircle2 size={16} className="text-emerald-400" />
            : <Circle size={16} className="text-ghost hover:text-white transition-colors" />}
        </button>
        <div className="flex-1 min-w-0">
          <span className={`text-sm ${task.done ? 'line-through text-ghost' : 'text-slate-200'}`}>{task.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-ghost">{task.category}</span>
            {dl && <span className={`text-[10px] font-mono ${dl.cls}`}>{dl.text}</span>}
          </div>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority.split(' ')[0]}
        </span>
          {task.repeat && task.repeat !== 'None' && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border border-current/30 ${REPEAT_COLORS[task.repeat]}`}>
              ↻ {task.repeat === 'Custom' ? task.customRepeat || 'Custom' : task.repeat}
            </span>
          )}
        <button onClick={() => del(task.id)} className="p-1 text-border hover:text-kill transition-colors flex-shrink-0">
          <Trash2 size={12} />
        </button>
      </div>
    )
  }

  const Section = ({ title, tasks, icon: Icon, color }) => {
    if (!tasks.length) return null
    return (
      <div>
        <div className={`flex items-center gap-2 mb-2 text-xs font-mono uppercase tracking-widest ${color}`}>
          <Icon size={12} /> {title} ({tasks.length})
        </div>
        <div className="space-y-1.5">
          {tasks.sort((a,b) => { const po = { 'P0 — Critical':0,'P1 — High':1,'P2 — Medium':2,'P3 — Low':3 }; return po[a.priority]-po[b.priority] }).map(t => <TaskRow key={t.id} task={t} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 page-enter">
      <SectionTitle sub="Break your daily plan into actionable tasks. P0 = must do today.">Tasks</SectionTitle>

      {/* Add Task Form */}
      <div className="exec-card">
        <div className="text-xs font-mono text-ghost uppercase tracking-widest mb-4">Add Task</div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-5">
            <Field label="Task">
              <Input
                placeholder="e.g. Solve 2 array problems on LeetCode"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && add()}
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Category">
              <Select value={form.category} onChange={e => set('category', e.target.value)}>
                {TASK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Priority">
              <Select value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </Select>
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Deadline (optional)">
              <Input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="Repeat">
              <Select value={form.repeat} onChange={e => set('repeat', e.target.value)}>
                {REPEAT_OPTIONS.map(r => <option key={r}>{r}</option>)}
              </Select>
            </Field>
          </div>
          {form.repeat === 'Custom' && (
            <div className="col-span-2">
              <Field label="Custom (e.g. every 3 days)">
                <Input placeholder="e.g. every 3 days" value={form.customRepeat} onChange={e => set('customRepeat', e.target.value)} />
              </Field>
            </div>
          )}

          <div className="col-span-1 flex items-end">
            <button onClick={add} className="btn-exec w-full justify-center py-2 h-10">
              <Plus size={15} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: active tasks */}
        <div className="exec-card space-y-5">
          <div className="text-xs font-mono text-ghost uppercase tracking-widest">All Tasks</div>
          {tasks.filter(t => !t.done).length === 0 && <EmptyState icon={CheckCircle2} message="No tasks yet" sub="Add tasks with deadlines - they will appear in Daily Log." />}
          <Section title="Overdue" tasks={overdue} icon={AlertCircle} color="text-kill" />
          <Section title="Due Today" tasks={todayTasks} icon={Clock} color="text-amber-400" />
          <Section title="Upcoming" tasks={upcoming} icon={Calendar} color="text-signal" />
          <Section title="No Deadline" tasks={noDeadline} icon={Tag} color="text-ghost" />
        </div>

        {/* Right: stats + done */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="exec-card">
            <div className="text-xs font-mono text-ghost uppercase tracking-widest mb-3">Category Breakdown</div>
            <div className="space-y-2">
              {TASK_CATEGORIES.map(cat => {
                const total = tasks.filter(t => t.category === cat).length
                const doneCount = tasks.filter(t => t.category === cat && t.done).length
                if (!total) return null
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-ghost w-20">{cat}</span>
                    <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(doneCount / total) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-ghost w-14 text-right">{doneCount}/{total}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Done */}
          {done.length > 0 && (
            <div className="exec-card">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-mono text-ghost uppercase tracking-widest">Completed ({done.length})</div>
                <button onClick={() => setTasks(t => t.filter(x => !x.done))} className="text-[10px] font-mono text-ghost hover:text-kill transition-colors">Clear all</button>
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {done.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
