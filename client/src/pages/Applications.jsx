import React, { useState } from 'react'
import { Plus, Trash2, Edit2, Briefcase } from 'lucide-react'
import { useApplications } from '../hooks/useData'
import api from '../lib/api'
import { SectionTitle, StatBlock, Modal, Field, Input, Select, Textarea, Badge, EmptyState, LoadingState, CardHeader, WarnBanner, OkBanner } from '../components/UI'

const STATUSES = ['Applied', 'In Review', 'OA Received', 'Interview', 'Final Round', 'Offer', 'Rejected']
const PIPELINE_COLORS = {
  'Applied':     'border-slate-600',
  'In Review':   'border-blue-600/50',
  'OA Received': 'border-amber-500/50',
  'Interview':   'border-emerald-500/50',
  'Final Round': 'border-signal/50',
  'Offer':       'border-accent/50',
  'Rejected':    'border-kill/30',
}

function AppModal({ open, onClose, onSaved, editing = null }) {
  const [form, setForm] = useState(editing || { company: '', role: '', quality: 'Normal', referral: 'None', status: 'Applied', followup_date: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.company || !form.role) return
    setSaving(true)
    try {
      if (editing?.id) await api.patch(`/applications/${editing.id}`, form)
      else await api.post('/applications', form)
      onSaved()
      onClose()
    } catch (err) {
      alert('Failed to save application: ' + (err.response?.data?.error || err.message))
    } finally {
      setSaving(false)
    }}

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit Application' : 'Add Application'}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company">
          <Input placeholder="Google" value={form.company} onChange={e => set('company', e.target.value)} />
        </Field>
        <Field label="Role">
          <Input placeholder="SWE Intern" value={form.role} onChange={e => set('role', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quality">
          <Select value={form.quality} onChange={e => set('quality', e.target.value)}>
            <option>High Quality</option>
            <option>Normal</option>
          </Select>
        </Field>
        <Field label="Referral">
          <Select value={form.referral} onChange={e => set('referral', e.target.value)}>
            <option>None</option>
            <option>Requested</option>
            <option>Confirmed</option>
          </Select>
        </Field>
      </div>
      <Field label="Status">
        <Select value={form.status} onChange={e => set('status', e.target.value)}>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </Select>
      </Field>
      <Field label="Follow-up Date">
        <Input type="date" value={form.followup_date} onChange={e => set('followup_date', e.target.value)} />
      </Field>
      <Field label="Notes">
        <Textarea placeholder="Referral contact, job URL, notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
      </Field>
      <button onClick={save} disabled={saving} className="btn-exec w-full justify-center py-3">
        {saving ? 'Saving...' : editing ? 'Update' : 'Add Application'}
      </button>
    </Modal>
  )
}

export default function Applications() {
  const { apps, stats, weekTotal, loading, refetch } = useApplications()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [view, setView] = useState('pipeline')

  const deleteApp = async (id) => {
    if (!confirm('Delete this application?')) return
    await api.delete(`/applications/${id}`)
    refetch()
  }

  if (loading) return <LoadingState />

  const conversionRate = stats.total > 0 ? Math.round((stats.interview / stats.total) * 100) : 0

  return (
    <div className="p-6 space-y-6 page-enter">
      <SectionTitle
        sub="50+ applications per week. 5+ high-quality. Referrals are multipliers."
        action={
          <button onClick={() => { setEditing(null); setModal(true) }} className="btn-exec">
            <Plus size={15} /> Add Application
          </button>
        }
      >
        Application Tracker
      </SectionTitle>

      {weekTotal < 30 && (
        <WarnBanner message={`Only ${weekTotal} applications this week. Target is 50+. That's ${50 - weekTotal} more — today.`} />
      )}
      {weekTotal >= 50 && (
        <OkBanner message={`${weekTotal} applications this week. Target hit. Now focus on quality follow-ups.`} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <StatBlock value={weekTotal} label="This Week" color={weekTotal >= 50 ? 'text-emerald-400' : 'text-amber-400'} delta="Target: 50+" deltaUp={weekTotal >= 50} />
        <StatBlock value={stats.total || 0} label="Total Applied" color="text-white" />
        <StatBlock value={stats.interview || 0} label="Interviews" color="text-emerald-400" />
        <StatBlock value={stats.with_referral || 0} label="With Referral" color="text-signal" />
        <StatBlock value={`${conversionRate}%`} label="Conversion" color={conversionRate > 5 ? 'text-emerald-400' : 'text-amber-400'} />
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {['pipeline', 'table'].map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${view === v ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-surface border border-border text-ghost hover:text-white'}`}>
            {v === 'pipeline' ? 'Pipeline View' : 'Table View'}
          </button>
        ))}
      </div>

      {view === 'pipeline' ? (
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-max pb-2">
            {STATUSES.map(status => {
              const items = apps.filter(a => a.status === status)
              return (
                <div key={status} className={`w-44 flex-shrink-0`}>
                  <div className={`border-b-2 mb-3 pb-2 flex items-center justify-between ${PIPELINE_COLORS[status] || 'border-border'}`}>
                    <span className="text-xs font-mono text-ghost uppercase tracking-wider">{status}</span>
                    <span className="text-xs font-mono font-bold text-white">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(a => (
                      <div key={a.id} className="pipe-card">
                        <div className="font-display font-semibold text-sm text-white mb-0.5">{a.company}</div>
                        <div className="text-xs text-ghost mb-2">{a.role}</div>
                        <div className="flex gap-1 flex-wrap">
                          <Badge status={a.quality} label={a.quality === 'High Quality' ? 'HQ' : 'Norm'} />
                          {a.referral !== 'None' && <Badge status={a.referral} label="Ref" />}
                        </div>
                        <div className="flex gap-1 mt-2">
                          <button onClick={() => { setEditing(a); setModal(true) }} className="p-1 text-border hover:text-ghost rounded">
                            <Edit2 size={11} />
                          </button>
                          <button onClick={() => deleteApp(a.id)} className="p-1 text-border hover:text-kill rounded">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-xs text-ghost/40 text-center py-4 font-mono">empty</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="exec-card overflow-auto">
          {apps.length === 0 ? (
            <EmptyState icon={Briefcase} message="No applications yet" sub="Start adding. 50+ per week is the target." />
          ) : (
            <table className="exec-table">
              <thead>
                <tr>
                  <th>Company</th><th>Role</th><th>Quality</th><th>Referral</th>
                  <th>Status</th><th>Follow-up</th><th></th>
                </tr>
              </thead>
              <tbody>
                {apps.map(a => (
                  <tr key={a.id}>
                    <td className="text-white font-semibold">{a.company}</td>
                    <td>{a.role}</td>
                    <td><Badge status={a.quality} label={a.quality} /></td>
                    <td><Badge status={a.referral} label={a.referral} /></td>
                    <td><Badge status={a.status} label={a.status} /></td>
                    <td className="text-ghost text-xs">{a.followup_date || '—'}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(a); setModal(true) }} className="p-1.5 text-ghost hover:text-white rounded transition-colors"><Edit2 size={12} /></button>
                        <button onClick={() => deleteApp(a.id)} className="p-1.5 text-ghost hover:text-kill rounded transition-colors"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <AppModal open={modal} onClose={() => { setModal(false); setEditing(null) }} onSaved={refetch} editing={editing} />
    </div>
  )
}
