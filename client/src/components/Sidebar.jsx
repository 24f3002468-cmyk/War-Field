import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardCheck, Brain, FolderGit2,
  Briefcase, Timer, CalendarDays, Target,
  BarChart3, SearchCode, Zap, LogOut, ListTodo, Map
} from 'lucide-react'
import { useStore } from '../store'
import { getDayType, DAY_TYPE_COLORS, DAY_TYPE_LABELS } from '../lib/utils'

const NAV = [
  { group: 'EXECUTE', items: [
    { to: '/', icon: LayoutDashboard, label: 'Command Center' },
    { to: '/daily', icon: ClipboardCheck, label: 'Daily Log' },
    { to: '/tasks', icon: ListTodo, label: 'Tasks' },
    { to: '/timers', icon: Timer, label: 'Timers' },
  ]},
  { group: 'TRACK', items: [
    { to: '/dsa', icon: Brain, label: 'DSA Tracker' },
    { to: '/projects', icon: FolderGit2, label: 'Projects' },
    { to: '/applications', icon: Briefcase, label: 'Applications' },
  ]},
  { group: 'REVIEW', items: [
    { to: '/schedule', icon: CalendarDays, label: 'Schedule' },
    { to: '/goals', icon: Target, label: 'Goals' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/audit', icon: SearchCode, label: 'Weekly Audit' },
    { to: '/roadmap', icon: Map, label: 'Semester Roadmap' },
    { to: '/principles', icon: Zap, label: 'Principles' },
  ]},
]

export default function Sidebar() {
  const { user, logout, energy, setEnergy } = useStore()
  const navigate = useNavigate()
  const dayType = getDayType()
  const dtColors = DAY_TYPE_COLORS[dayType]
  const energyColor = energy >= 7 ? 'bg-emerald-500' : energy >= 5 ? 'bg-amber-500' : 'bg-kill'

  return (
    <aside className="w-56 min-w-56 bg-surface border-r border-border flex flex-col h-screen sticky top-0 overflow-y-auto">
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-void" fill="currentColor" />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-white tracking-wide">ExecOS</div>
            <div className="text-ghost text-xs font-mono">{user?.name || 'Sahil'}</div>
          </div>
        </div>
      </div>

      <div className={`mx-3 mt-3 px-3 py-2 rounded-lg border ${dtColors.bg} ${dtColors.border}`}>
        <div className="text-xs font-mono text-ghost uppercase tracking-widest">Today</div>
        <div className={`font-display font-bold text-sm ${dtColors.text} mt-0.5`}>
          {DAY_TYPE_LABELS[dayType]}
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-4">
        {NAV.map(group => (
          <div key={group.group}>
            <div className="px-2 mb-1.5 text-[10px] font-mono text-ghost/50 uppercase tracking-widest">{group.group}</div>
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink key={to} to={to} end={to === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Icon size={15} />
                  <span className="text-sm">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-mono text-ghost">ENERGY</span>
          <span className={`text-xs font-mono font-bold ${energy >= 7 ? 'text-emerald-400' : energy >= 5 ? 'text-amber-400' : 'text-kill'}`}>{energy}/10</span>
        </div>
        <div className="prog-track h-2 mb-2">
          <div className={`prog-fill ${energyColor}`} style={{ width: `${energy * 10}%` }} />
        </div>
        <input type="range" min="1" max="10" value={energy} onChange={e => setEnergy(parseInt(e.target.value))} className="w-full accent-accent cursor-pointer" />
        {energy <= 4 && <p className="text-kill text-[10px] font-mono mt-1.5">⚠ BURNOUT RISK — Log lighter day</p>}
      </div>

      <button onClick={() => { logout(); navigate('/login') }}
        className="flex items-center gap-2 px-4 py-3 text-ghost hover:text-kill text-sm transition-colors border-t border-border">
        <LogOut size={14} /><span className="font-mono text-xs">Sign out</span>
      </button>
    </aside>
  )
}
