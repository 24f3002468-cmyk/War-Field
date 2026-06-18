import React, { useState } from 'react'
import { Plus, Trash2, RotateCcw, Brain } from 'lucide-react'
import { useDSA } from '../hooks/useData'
import api from '../lib/api'
import { TOPICS, getMastery } from '../lib/utils'
import {
  SectionTitle, StatBlock, Modal, Field, Input, Select, Textarea,
  Badge, ProgressBar, EmptyState, LoadingState, CardHeader
} from '../components/UI'

function AddProblemModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', difficulty: 'Medium', topic: 'Arrays', insight: '', needs_revision: false })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await api.post('/dsa', form)
      onSaved()
      onClose()
      setForm({ name: '', difficulty: 'Medium', topic: 'Arrays', insight: '', needs_revision: false })
    } catch (err) {
      alert('Failed to save problem: ' + (err.response?.data?.error || err.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Log DSA Problem">
      <Field label="Problem Name">
        <Input placeholder="e.g. Trapping Rain Water" value={form.name} onChange={e => set('name', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Difficulty">
          <Select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </Select>
        </Field>
        <Field label="Topic">
          <Select value={form.topic} onChange={e => set('topic', e.target.value)}>
            {TOPICS.map(t => <option key={t}>{t}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Pattern / Key Insight">
        <Textarea
          placeholder="What pattern does this use? Why does the approach work? Write this as if explaining to an interviewer."
          value={form.insight}
          onChange={e => set('insight', e.target.value)}
        />
      </Field>
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => set('needs_revision', !form.needs_revision)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${form.needs_revision ? 'bg-amber-500 border-amber-500' : 'border-border'}`}
        >
          {form.needs_revision && <span className="text-void text-xs font-bold">✓</span>}
        </button>
        <span className="text-sm text-slate-300">Mark for revision</span>
      </div>
      <button onClick={save} disabled={saving} className="btn-exec w-full justify-center py-3">
        {saving ? 'Saving...' : 'Log Problem'}
      </button>
    </Modal>
  )
}

export default function DSATracker() {
  const { problems, topics, weekCount, loading, refetch } = useDSA()
  const [modal, setModal] = useState(false)
  const [filter, setFilter] = useState('All')

  const filteredProblems = filter === 'All' ? problems
    : filter === 'Revision' ? problems.filter(p => p.needs_revision)
    : problems.filter(p => p.topic === filter)

  const deleteProblem = async (id) => {
    if (!confirm('Delete this problem?')) return
    await api.delete(`/dsa/${id}`)
    refetch()
  }

  const toggleRevision = async (p) => {
    await api.patch(`/dsa/${p.id}/revision`, { needs_revision: !p.needs_revision })
    refetch()
  }

  if (loading) return <LoadingState />

  const revisionDue = problems.filter(p => p.needs_revision).length
  const hardCount = problems.filter(p => p.difficulty === 'Hard').length

  return (
    <div className="p-6 space-y-6 page-enter">
      <SectionTitle
        sub="Topic-based mastery. Deep patterns. Not random grinding."
        action={
          <button onClick={() => setModal(true)} className="btn-exec">
            <Plus size={15} /> Log Problem
          </button>
        }
      >
        DSA Tracker
      </SectionTitle>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatBlock value={weekCount} label="This Week" color={weekCount >= 20 ? 'text-emerald-400' : 'text-amber-400'} delta="Target: 20–25" deltaUp={weekCount >= 20} />
        <StatBlock value={problems.length} label="Total Solved" color="text-white" />
        <StatBlock value={hardCount} label="Hard Problems" color="text-kill" delta="Each one counts x3" deltaUp={false} />
        <StatBlock value={revisionDue} label="Revision Due" color={revisionDue > 5 ? 'text-kill' : 'text-amber-400'} delta={revisionDue > 5 ? 'Overdue!' : 'Stay current'} deltaUp={revisionDue <= 3} />
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* Topic mastery */}
        <div className="col-span-2 exec-card">
          <CardHeader title="Topic Mastery" dot="bg-emerald-500" />
          <div className="space-y-0">
            {topics.map(t => {
              const m = getMastery(t.mastery_score)
              return (
                <div key={t.topic} className="topic-row">
                  <div className="w-28 text-sm text-slate-300 truncate">{t.topic}</div>
                  <div className="flex-1">
                    <ProgressBar value={t.mastery_score} max={100} color={m.bar} height="h-1.5" />
                  </div>
                  <div className="w-12 text-right">
                    <span className={`text-xs font-mono font-bold ${m.color}`}>{m.label}</span>
                  </div>
                  <div className="w-10 text-right text-xs font-mono text-ghost">{t.total_solved}</div>
                </div>
              )
            })}
            {topics.length === 0 && (
              <EmptyState icon={Brain} message="No topics yet" sub="Log your first problem to start tracking mastery" />
            )}
          </div>
        </div>

        {/* Problem log */}
        <div className="col-span-3 exec-card">
          <div className="flex items-center justify-between mb-4">
            <CardHeader title="Recent Problems" dot="bg-signal" />
            <div className="flex gap-1.5 flex-wrap">
              {['All', 'Revision', ...TOPICS.slice(0, 6)].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${filter === f ? 'bg-accent/10 text-accent border border-accent/30' : 'text-ghost hover:text-slate-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filteredProblems.length === 0 ? (
            <EmptyState icon={Brain} message="No problems here yet" sub="Start logging to see your progress" />
          ) : (
            <div className="overflow-auto max-h-[480px]">
              <table className="exec-table">
                <thead>
                  <tr>
                    <th>Problem</th>
                    <th>Topic</th>
                    <th>Difficulty</th>
                    <th>Insight</th>
                    <th>Rev</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.map(p => (
                    <tr key={p.id}>
                      <td className="text-white font-medium">{p.name}</td>
                      <td><Badge status={p.topic} label={p.topic} /></td>
                      <td><Badge status={p.difficulty} label={p.difficulty} /></td>
                      <td className="text-ghost text-xs max-w-[160px] truncate">{p.insight || '—'}</td>
                      <td>
                        <button onClick={() => toggleRevision(p)}
                          className={`p-1 rounded transition-colors ${p.needs_revision ? 'text-amber-400' : 'text-border hover:text-ghost'}`}>
                          <RotateCcw size={13} />
                        </button>
                      </td>
                      <td>
                        <button onClick={() => deleteProblem(p.id)} className="p-1 text-border hover:text-kill rounded transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddProblemModal open={modal} onClose={() => setModal(false)} onSaved={refetch} />
    </div>
  )
}
