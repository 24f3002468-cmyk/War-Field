// removed shell wrapper line
import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Zap, Brain, Briefcase, ArrowRight, CheckCircle2, ListTodo
} from 'lucide-react'
import {
  getDayType, DAY_CHECKLISTS, DAY_TYPE_COLORS,
  MOTIVATORS, getScoreColor, DAY_SCHEDULE
} from '../lib/utils'
import { useAnalytics, useDSA, useApplications } from '../hooks/useData'
import { useStore } from '../store'
import { ProgressBar, WarnBanner, OkBanner } from '../components/UI'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { fmtTimer } from '../lib/utils'

// Today's schedule blocks from weekly planner
function TodaySchedule() {
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const dayName = dayNames[new Date().getDay()]
  const dayData = DAY_SCHEDULE[dayName]
  if (!dayData) return null
  const total = dayData.blocks.reduce((s, b) => s + (parseFloat(b.hours) || 0), 0)
  const BLOCK_COLORS = [
    'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    'bg-signal/20 border-signal/30 text-signal',
    'bg-purple-500/20 border-purple-500/30 text-purple-300',
    'bg-amber-500/20 border-amber-500/30 text-amber-300'
  ]
  return (
    <div className="exec-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-ghost uppercase tracking-widest">Today's Schedule</span>
        <span className="text-xs font-mono text-ghost">{total}H TOTAL</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {dayData.blocks.map((block, i) => (
          <div key={i} className={`rounded-lg border px-3 py-2.5 ${BLOCK_COLORS[i % BLOCK_COLORS.length]}`}>
            <div className="text-sm font-medium">{block.task}</div>
            <div className="text-xs font-mono opacity-70 mt-0.5">{block.hours}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Motivator banner
function MotivatorBanner({ energy, weekDSA, weekApps }) {
  const msg = React.useMemo(() => {
    if (energy <= 4) return MOTIVATORS.lowEnergy[Math.floor(Math.random() * MOTIVATORS.lowEnergy.length)]
    if (weekDSA >= 18) return MOTIVATORS.onFire[Math.floor(Math.random() * MOTIVATORS.onFire.length)]
    if (weekApps < 30) return MOTIVATORS.appTarget[Math.floor(Math.random() * MOTIVATORS.appTarget.length)]
    return MOTIVATORS.morning[Math.floor(Math.random() * MOTIVATORS.morning.length)]
  }, [energy, weekDSA, weekApps])
  const isWarn = energy <= 4 || weekApps < 30
  return isWarn ? <WarnBanner message={msg} /> : <OkBanner message={msg} />
}

// Pomodoro widget on dashboard — customisable
function DashboardPomodoro() {
  const [workMin, setWorkMin] = React.useState(25)
  const [breakMin, setBreakMin] = React.useState(5)
  const [showSettings, setShowSettings] = React.useState(false)
  const [localPhase, setLocalPhase] = React.useState('idle')
  const [timeLeft, setTimeLeft] = React.useState(25 * 60)
  const [sessions, setSessions] = React.useState(0)
  const intervalRef = React.useRef(null)
  const { setActiveTimer } = useStore()

  const WORK = workMin * 60
  const BREAK = breakMin * 60

React.useEffect(() => {
  const today = new Date().toISOString().split('T')[0]
  const id = setInterval(() => {
    try {
      let tasks = JSON.parse(localStorage.getItem('execos_tasks_v2') || '[]')
      // Auto-reset repeating tasks
      const dayOfWeek = new Date().getDay()
      tasks = tasks.map(task => {
        if (!task.done || task.repeat === 'None' || !task.lastCompleted) return task
        if (task.lastCompleted === today) return task
        const shouldReset = task.repeat === 'Daily' ||
          (task.repeat === 'Weekdays' && dayOfWeek >= 1 && dayOfWeek <= 5) ||
          (task.repeat === 'Weekly' && (new Date() - new Date(task.lastCompleted)) >= 7 * 86400000) ||
          (task.repeat === 'Monthly' && new Date(task.lastCompleted).getDate() !== new Date().getDate())
        return shouldReset ? { ...task, done: false } : task
      })
      localStorage.setItem('execos_tasks_v2', JSON.stringify(tasks))
      setAllTasks(tasks)
    } catch {}
  }, 3000)
  return () => clearInterval(id)
}, [])

  React.useEffect(() => {
    if (localPhase === 'work' || localPhase === 'break') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current)
            if (localPhase === 'work') { setSessions(s => s + 1); setLocalPhase('break'); return BREAK }
            else { setLocalPhase('idle'); return WORK }
          }
          return t - 1
        })
      }, 1000)
    } else { clearInterval(intervalRef.current) }
    return () => clearInterval(intervalRef.current)
  }, [localPhase, WORK, BREAK])

  React.useEffect(() => {
    if (localPhase === 'work' || localPhase === 'break' || localPhase === 'paused') {
      setActiveTimer({ id: 'dashboard-pomodoro', name: 'Focus Timer', phase: localPhase, timeLeft, workSessions: sessions })
    } else { setActiveTimer(null) }
  }, [localPhase, timeLeft, sessions])

  const pct = Math.round((timeLeft / (localPhase === 'break' ? BREAK : WORK)) * 100)
  const circ = 2 * Math.PI * 48

  const toggle = () => { if (localPhase === 'idle' || localPhase === 'paused') setLocalPhase('work'); else setLocalPhase('paused') }
  const reset = () => { clearInterval(intervalRef.current); setLocalPhase('idle'); setTimeLeft(WORK); setSessions(0); setActiveTimer(null) }
  const skip = () => { clearInterval(intervalRef.current); if (localPhase === 'work') { setSessions(s => s + 1); setLocalPhase('break'); setTimeLeft(BREAK) } else { setLocalPhase('idle'); setTimeLeft(WORK) } }

  return (
    <div className="exec-card flex flex-col items-center gap-3">
      <div className="text-xs font-mono text-ghost uppercase tracking-widest">Focus Timer — Pomodoro</div>
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 108 108">
          <circle cx="54" cy="54" r="48" fill="none" stroke="#1a1f2e" strokeWidth="6" />
          <circle cx="54" cy="54" r="48" fill="none"
            stroke={localPhase === 'break' ? '#22c55e' : localPhase === 'paused' ? '#f59e0b' : '#00e5ff'}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            style={{ transition: localPhase === 'idle' ? 'none' : 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-bold text-xl text-white">{fmtTimer(timeLeft)}</span>
          <span className={`text-[9px] font-mono ${localPhase === 'break' ? 'text-emerald-400' : localPhase === 'work' ? 'text-signal' : 'text-ghost'}`}>
            {localPhase === 'idle' ? 'READY' : localPhase === 'work' ? 'FOCUS' : localPhase === 'break' ? 'BREAK' : 'PAUSED'}
          </span>
        </div>
      </div>
      <div className="flex gap-1.5">
        {[0,1,2,3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < sessions % 4 ? 'bg-signal' : 'bg-surface border border-border'}`} />)}
      </div>
      {showSettings && (
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="text-ghost">Work:</span>
            <select className="bg-void border border-border rounded px-2 py-1 text-white text-xs"
              value={workMin} onChange={e => { setWorkMin(parseInt(e.target.value)); setLocalPhase('idle') }}>
              {[15,20,25,30,35,40,45,50,55,60].map(m => <option key={m}>{m}</option>)}
            </select>
            <span className="text-ghost">min</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-ghost">Break:</span>
            <select className="bg-void border border-border rounded px-2 py-1 text-white text-xs"
              value={breakMin} onChange={e => setBreakMin(parseInt(e.target.value))}>
              {[3,5,7,10,15].map(m => <option key={m}>{m}</option>)}
            </select>
            <span className="text-ghost">min</span>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={toggle} className="btn-signal px-4 py-1.5 text-xs flex items-center gap-1">
          {localPhase === 'work' ? '⏸ Pause' : '▶ Start'}
        </button>
        <button onClick={reset} className="btn-ghost px-3 py-1.5 text-xs">↺</button>
        <button onClick={skip} className="btn-ghost px-3 py-1.5 text-xs">⏭</button>
      </div>
      <button onClick={() => setShowSettings(s => !s)} className="text-[10px] font-mono text-ghost hover:text-white transition-colors">
        {showSettings ? '▲ hide settings' : '⚙ customise timer'}
      </button>
    </div>
  )
}

// Today's execution checklist
function TodayChecklist({ dayType }) {
  const { checklist, toggleCheck } = useStore()
  const items = DAY_CHECKLISTS[dayType] || []
  const done = items.filter((_, i) => checklist[i]).length
  const pct = Math.round((done / items.length) * 100)
  const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-accent' : 'bg-kill'
  return (
    <div className="exec-card border-accent/20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-ghost uppercase tracking-widest">Today's Execution</span>
        <span className={`font-mono font-bold text-sm ${pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-accent' : 'text-kill'}`}>{done}/{items.length}</span>
      </div>
      <ProgressBar value={done} max={items.length} color={barColor} height="h-1" />
      <div className="mt-3 space-y-0">
        {items.map((item, i) => (
          <div key={i} className="check-row" onClick={() => toggleCheck(i)}>
            <div className={`check-box ${checklist[i] ? 'done' : ''}`}>
              {checklist[i] && <CheckCircle2 size={12} className="text-void" />}
            </div>
            <span className={`text-sm leading-relaxed ${checklist[i] ? 'text-ghost line-through' : 'text-slate-300'}`}>{item}</span>
          </div>
        ))}
      </div>
      {pct === 100 && (
        <div className="mt-3 bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 text-accent text-xs font-mono">
          ✦ FULL EXECUTION. This is what ₹1Cr looks like.
        </div>
      )}
    </div>
  )
}

// Score chart
function ScoreChart({ scores }) {
  const data = [...scores].reverse().map(s => ({ date: format(new Date(s.log_date), 'EEE'), score: s.total_score }))
  if (!data.length) return <div className="flex items-center justify-center h-20 text-ghost text-xs font-mono">No score data yet</div>
  return (
    <ResponsiveContainer width="100%" height={80}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: -30, bottom: 0 }}>
        <defs>
          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#e8ff47" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#e8ff47" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: '#0f1219', border: '1px solid #1a1f2e', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: '#64748b' }} itemStyle={{ color: '#e8ff47' }} />
        <Area type="monotone" dataKey="score" stroke="#e8ff47" strokeWidth={2} fill="url(#sg)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Today's tasks — checkable, synced with Tasks page via localStorage
function TodayTasks() {
  const today = new Date().toISOString().split('T')[0]
  const [allTasks, setAllTasks] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('execos_tasks_v2') || '[]') } catch { return [] }
  })

  React.useEffect(() => {
    const id = setInterval(() => {
      try { setAllTasks(JSON.parse(localStorage.getItem('execos_tasks_v2') || '[]')) } catch {}
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const toggle = (id) => {
    const updated = allTasks.map(t => t.id === id ? { ...t, done: !t.done } : t)
    setAllTasks(updated)
    localStorage.setItem('execos_tasks_v2', JSON.stringify(updated))
  }

  const overdue = allTasks.filter(t => !t.done && t.deadline && t.deadline < today)
  const due = allTasks.filter(t => !t.done && t.deadline === today)
  const noDl = allTasks.filter(t => !t.done && !t.deadline)
  const all = [...overdue, ...due, ...noDl]

  if (!all.length) return (
    <div className="text-ghost text-xs font-mono py-1">
      No tasks. <Link to="/tasks" className="text-accent underline">Add tasks →</Link>
    </div>
  )

  return (
    <div className="space-y-0.5">
      {all.slice(0, 6).map(t => {
        const isOverdue = t.deadline && t.deadline < today
        return (
          <div key={t.id} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0 cursor-pointer" onClick={() => toggle(t.id)}>
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${t.done ? 'bg-accent border-accent' : isOverdue ? 'border-kill' : 'border-border hover:border-slate-400'}`}>
              {t.done && <CheckCircle2 size={10} className="text-void" />}
            </div>
            <span className={`text-sm flex-1 ${t.done ? 'text-ghost line-through' : isOverdue ? 'text-kill' : 'text-slate-200'}`}>{t.name}</span>
            <span className="text-[10px] font-mono text-ghost">{t.category}</span>
            {isOverdue && <span className="text-[10px] font-mono text-kill">OVERDUE</span>}
          </div>
        )
      })}
    </div>
  )
}

// Readiness checklist — auto-synced from Semester Roadmap (localStorage)
function ReadinessChecklist() {
  const [roadmapData, setRoadmapData] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('execos_roadmap_v1') || '{}') } catch { return {} }
  })

  React.useEffect(() => {
    const id = setInterval(() => {
      try { setRoadmapData(JSON.parse(localStorage.getItem('execos_roadmap_v1') || '{}')) } catch {}
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const sem4 = roadmapData.semesters?.find(s => s.id === 'S4')
  const outcomes = sem4?.outcomes || []
  const milestones = sem4?.milestones || []
  const doneMilestones = milestones.filter(m => m.done).length
  const totalMilestones = milestones.length

  if (!outcomes.length && !milestones.length) return (
    <div className="exec-card">
      <div className="text-xs font-mono text-ghost uppercase tracking-widest mb-2">Sem 4 Internship Readiness Checklist</div>
      <p className="text-ghost text-xs font-mono">
        No roadmap goals yet.{' '}
        <Link to="/roadmap" className="text-accent underline">Open Semester Roadmap to add goals →</Link>
      </p>
    </div>
  )

  return (
    <div className="exec-card">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono text-ghost uppercase tracking-widest">Sem 4 Internship Readiness</div>
        <div className="flex items-center gap-3">
          {totalMilestones > 0 && (
            <span className={`text-xs font-mono ${doneMilestones === totalMilestones ? 'text-emerald-400' : 'text-ghost'}`}>
              {doneMilestones}/{totalMilestones} milestones
            </span>
          )}
          <Link to="/roadmap" className="text-xs font-mono text-accent hover:underline">Edit in Roadmap →</Link>
        </div>
      </div>

      {outcomes.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] font-mono text-ghost uppercase tracking-widest mb-2">Outcomes</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {outcomes.map((o, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 leading-snug">{o}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {milestones.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-ghost uppercase tracking-widest mb-2">Milestones</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${m.done ? 'bg-emerald-500/20 border-emerald-500/40' : 'border-border'}`}>
                  {m.done && <CheckCircle2 size={9} className="text-emerald-400" />}
                </div>
                <span className={`text-xs ${m.done ? 'text-ghost line-through' : 'text-slate-300'}`}>{m.label}</span>
              </div>
            ))}
          </div>
          {totalMilestones > 0 && (
            <div className="mt-3 h-1 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${(doneMilestones / totalMilestones) * 100}%` }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const dayType = getDayType()
  const dtColors = DAY_TYPE_COLORS[dayType]
  const { scores, weekAvg, loading: aLoading } = useAnalytics()
  const { weekCount, topics } = useDSA()
  const { weekTotal, stats } = useApplications()
  const { energy } = useStore()

  const todayScore = scores[0]?.total_score || 0
  const totalDSA = topics?.reduce((s, t) => s + (t.total_solved || 0), 0) || 0
  const dsaTarget = 22

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const currentDayName = dayNames[new Date().getDay()]
  const daySchedule = DAY_SCHEDULE[currentDayName]
  const dayLabel = format(new Date(), 'EEEE, d MMMM yyyy').toUpperCase()
  const greetHour = new Date().getHours()
  const greeting = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening'
  const userName = useStore(s => s.user?.name || 'Sahil')

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-mono text-ghost uppercase tracking-widest mb-1">{dayLabel}</div>
          <h1 className="font-display font-bold text-3xl text-white leading-tight">
            {greeting},<br />
            <span className="text-accent">{userName}. Let's execute.</span>
          </h1>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono text-ghost uppercase tracking-widest mb-1">Today's Score</div>
          <div className={`font-display font-bold text-3xl ${getScoreColor(todayScore, 40)}`}>{todayScore}<span className="text-ghost text-lg">/40</span></div>
        </div>
      </div>

      {/* Day type banner */}
      {daySchedule && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${dtColors.bg} ${dtColors.border}`}>
          <div className={`w-2 h-2 rounded-full ${dtColors.dot} animate-pulse-fast flex-shrink-0`} />
          <div className="flex-1">
            <span className={`font-display font-bold text-sm ${dtColors.text}`}>
              {currentDayName} — {daySchedule.label.toUpperCase()}
            </span>
            <span className="text-ghost text-xs ml-3">
              {daySchedule.blocks.map(b => b.task).join(' → ')} ({daySchedule.blocks.reduce((s, b) => s + (parseFloat(b.hours) || 0), 0)}h total)
            </span>
          </div>
          <span className={`text-xs font-mono font-bold px-3 py-1 rounded-lg ${dtColors.bg} ${dtColors.text} border ${dtColors.border}`}>
            {daySchedule.label.toUpperCase()}
          </span>
        </div>
      )}

      {/* Motivator */}
      <MotivatorBanner energy={energy} weekDSA={weekCount} weekApps={weekTotal || 0} />

      {/* Today's schedule blocks */}
      <TodaySchedule />

      {/* Main content grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Tasks + Checklist */}
        <div className="space-y-4">
          <div className="exec-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-ghost uppercase tracking-widest">Today's Tasks</span>
              <Link to="/tasks" className="text-xs font-mono text-accent hover:underline">Add tasks →</Link>
            </div>
            <TodayTasks />
          </div>
          <TodayChecklist dayType={dayType} />
        </div>

        {/* Right: Pomodoro + Stats */}
        <div className="space-y-4">
          <DashboardPomodoro />

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="exec-card text-center">
              <div className={`font-display font-bold text-3xl ${totalDSA >= 120 ? 'text-emerald-400' : 'text-amber-400'}`}>{totalDSA}</div>
              <div className="text-xs font-mono text-ghost mt-1">DSA Problems<br />target: 120–150</div>
            </div>
            <div className="exec-card text-center">
              <div className={`font-display font-bold text-3xl ${stats?.total >= 1 ? 'text-signal' : 'text-ghost'}`}>{stats?.total || 0}</div>
              <div className="text-xs font-mono text-ghost mt-1">Applications Sent</div>
            </div>
            <div className="exec-card text-center">
              <div className={`font-display font-bold text-3xl ${energy >= 7 ? 'text-emerald-400' : energy >= 5 ? 'text-amber-400' : 'text-kill'}`}>{energy * 10}%</div>
              <div className="text-xs font-mono text-ghost mt-1">Energy Today</div>
            </div>
            <div className="exec-card text-center">
              <div className={`font-display font-bold text-3xl ${weekCount >= dsaTarget ? 'text-emerald-400' : 'text-ghost'}`}>{weekCount}</div>
              <div className="text-xs font-mono text-ghost mt-1">DSA This Week<br />target: {dsaTarget}+</div>
            </div>
          </div>

          {/* Score trend */}
          <div className="exec-card">
            <div className="text-xs font-mono text-ghost uppercase tracking-widest mb-3">7-Day Score Trend</div>
            {aLoading ? <div className="h-20 flex items-center justify-center text-ghost text-xs font-mono">Loading...</div> : <ScoreChart scores={scores} />}
          </div>
        </div>
      </div>

      {/* Readiness checklist — auto-synced from Semester Roadmap */}
      <ReadinessChecklist />

      {/* Quick Nav */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { to: '/daily', icon: CheckCircle2, label: 'Log Today', sub: 'Record execution', color: 'text-accent' },
          { to: '/dsa', icon: Brain, label: 'DSA Tracker', sub: `${weekCount} this week`, color: 'text-emerald-400' },
          { to: '/applications', icon: Briefcase, label: 'Applications', sub: `${weekTotal || 0} this week`, color: 'text-purple-400' },
          { to: '/tasks', icon: ListTodo, label: 'Tasks', sub: 'Manage your list', color: 'text-signal' },
        ].map(({ to, icon: Icon, label, sub, color }) => (
          <Link key={to} to={to}
            className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-border/50 border border-border hover:border-slate-600 transition-all group">
            <Icon size={15} className={color} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200">{label}</div>
              <div className="text-xs text-ghost truncate">{sub}</div>
            </div>
            <ArrowRight size={13} className="text-ghost group-hover:text-white transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
// removed trailing shell commands
