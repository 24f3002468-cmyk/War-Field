import React from 'react'
import { X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { STATUS_COLORS } from '../lib/utils'

// Badge
export function Badge({ label, status, className = '' }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS[label] || 'bg-slate-500/10 text-slate-400'
  return (
    <span className={`badge border ${color} ${className}`}>
      {label || status}
    </span>
  )
}

// Modal
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface text-ghost hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Form group
export function Field({ label, children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && <label className="block text-xs font-mono text-ghost uppercase tracking-wider mb-1.5">{label}</label>}
      {children}
    </div>
  )
}

// Input
export function Input({ ...props }) {
  return <input className="exec-input" {...props} />
}

// Select
export function Select({ children, ...props }) {
  return (
    <select className="exec-input appearance-none cursor-pointer" {...props}>
      {children}
    </select>
  )
}

// Textarea
export function Textarea({ ...props }) {
  return <textarea className="exec-input resize-none min-h-[80px]" {...props} />
}

// ProgressBar
export function ProgressBar({ value, max = 100, color = 'bg-accent', height = 'h-1.5' }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className={`prog-track ${height}`}>
      <div className={`prog-fill ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// StatBlock
export function StatBlock({ value, label, delta, deltaUp, color = 'text-white', icon: Icon }) {
  return (
    <div className="stat-block">
      {Icon && <Icon size={16} className="text-ghost mb-1" />}
      <div className={`stat-value ${color}`}>{value}</div>
      <div className="stat-label">{label}</div>
      {delta && (
        <div className={`stat-delta ${deltaUp ? 'text-emerald-400' : 'text-kill'}`}>
          {deltaUp ? '↑' : '↓'} {delta}
        </div>
      )}
    </div>
  )
}

// Spinner
export function Spinner({ size = 20 }) {
  return <Loader2 size={size} className="animate-spin text-ghost" />
}

// Loading state
export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size={28} />
    </div>
  )
}

// Empty state
export function EmptyState({ icon: Icon, message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      {Icon && <Icon size={32} className="text-border mb-3" />}
      <p className="text-slate-300 font-display font-semibold text-base">{message}</p>
      {sub && <p className="text-ghost text-sm mt-1">{sub}</p>}
    </div>
  )
}

// Warning banner
export function WarnBanner({ message }) {
  return (
    <div className="warn-banner">
      <AlertTriangle size={16} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// OK banner
export function OkBanner({ message }) {
  return (
    <div className="ok-banner">
      <CheckCircle2 size={16} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// Section title
export function SectionTitle({ children, sub, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">{children}</h1>
        {sub && <p className="text-ghost text-sm mt-1">{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Card header
export function CardHeader({ title, dot, action, sub }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="flex items-center gap-2">
          {dot && <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
          <span className="text-xs font-mono text-ghost uppercase tracking-widest">{title}</span>
        </div>
        {sub && <p className="text-xs text-ghost/60 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}
