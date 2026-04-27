import React, { useState } from 'react'
import { CheckCircle2, Circle, MapPin, Star, Zap, Target } from 'lucide-react'
import { SectionTitle } from '../components/UI'
const STORAGE_KEY = 'execos_roadmap_v1'

function loadRoadmap() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const data = {
      semesters: saved.semesters || SEMESTERS_DEFAULT,
      yearlyGoals: saved.yearlyGoals || YEARLY_GOALS_DEFAULT,
    }
    // Write defaults to localStorage on first load so Command Centre can read them
    if (!saved.semesters) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
    return data
  } catch {
    const data = { semesters: SEMESTERS_DEFAULT, yearlyGoals: YEARLY_GOALS_DEFAULT }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return data
  }
}

function saveRoadmap(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
const SEMESTERS_DEFAULT = [
  {
    id: 'S4', label: 'Sem 4', title: 'Internship Readiness', emoji: '🟦',
    theme: 'Academic Lock → Foundation Build',
    identity: 'Hireable Candidate',
    period: 'Now → May 2026',
    color: 'border-blue-500/40 bg-blue-500/5',
    dotColor: 'bg-blue-500',
    textColor: 'text-blue-400',
    isNow: true,
    outcomes: [
      'Strong Python for real work',
      'Solid DSA foundation (120–150 problems)',
      '1 deployed backend system',
      '1 applied ML project',
      'Resume v1 ready',
      'Actively applying for internships',
    ],
    milestones: [
      { label: 'Week 1–2: Arrays + Strings + Hashing (40–50 problems)', done: false },
      { label: 'Week 3–4: Sliding Window + Two Pointers + Binary Search', done: false },
      { label: 'Week 5–6: Recursion + Trees intro + End-to-end ML project', done: false },
      { label: 'Final: 120–150 DSA + 1 ML project + 1 backend + Resume v1', done: false },
    ],
  },
  {
    id: 'S5', label: 'Sem 5', title: 'Selection + Acceleration', emoji: '🟨',
    theme: 'Solve + Build + Apply',
    identity: 'Selection Machine',
    period: 'Jul – Nov 2026',
    color: 'border-amber-500/40 bg-amber-500/5',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    isNow: false,
    outcomes: [
      '300 DSA (topic-covered)',
      '1 strong production system project',
      'Internship #1 secured',
      'Resume v2 ready',
    ],
    milestones: [
      { label: 'Month 1 (Jul): Trees + Graphs + Async processing + 20–25 apps/week', done: false },
      { label: 'Month 2 (Aug): Graphs + Heaps + Caching + DB scaling + Open Source PRs', done: false },
      { label: 'Month 3 (Sep): DP + Deployment + API design + Internship secured', done: false },
    ],
  },
  {
    id: 'S6', label: 'Sem 6', title: 'Placement Domination', emoji: '🟧',
    theme: 'Convert interviews → offers',
    identity: 'Closer',
    period: '2027',
    color: 'border-orange-500/40 bg-orange-500/5',
    dotColor: 'bg-orange-500',
    textColor: 'text-orange-400',
    isNow: false,
    outcomes: [
      '500+ DSA solved',
      'System design mastery',
      'Internship #2 / PPO',
      '₹50 LPA+ offer',
    ],
    milestones: [
      { label: 'Month 1: 3–4 DSA/day + Load balancing + Caching + Queues', done: false },
      { label: 'Month 2: 3 mock interviews/week + System design drills', done: false },
      { label: 'Month 3: Real interviews + Offer conversion → ₹50 LPA+', done: false },
    ],
  },
  {
    id: 'S7', label: 'Sem 7', title: 'Offer Conversion', emoji: '🟪',
    theme: 'Global roles + negotiation',
    identity: 'Candidate with Leverage',
    period: '2027–28',
    color: 'border-purple-500/40 bg-purple-500/5',
    dotColor: 'bg-purple-500',
    textColor: 'text-purple-400',
    isNow: false,
    outcomes: [
      '₹1 Cr+ offer secured',
      'Global exposure',
      'Strong negotiation position',
      'No major skill gaps',
    ],
    milestones: [
      { label: 'Month 1: Fix weak areas from Sem 6', done: false },
      { label: 'Month 2: Global applications + off-campus', done: false },
      { label: 'Month 3: Offer upgrade + negotiation', done: false },
    ],
  },
  {
    id: 'S8', label: 'Sem 8', title: 'Startup Execution', emoji: '🟥',
    theme: 'MVP + Users + Validation',
    identity: 'Founder-Engineer with Safety Net',
    period: '2028',
    color: 'border-rose-500/40 bg-rose-500/5',
    dotColor: 'bg-rose-500',
    textColor: 'text-rose-400',
    isNow: false,
    outcomes: [
      'Real product with users',
      'Initial validation signals',
      'Startup credibility',
      'MVP shipped',
    ],
    milestones: [
      { label: 'Build MVP from production experience', done: false },
      { label: 'Get first users', done: false },
      { label: 'Validate product-market fit', done: false },
    ],
  },
]

const YEARLY_GOALS_DEFAULT = [
  {
    year: '2026', label: 'Foundation Year',
    color: 'text-blue-400', border: 'border-blue-500/30',
    goals: [
      { text: 'Complete Sem 4 academics cleanly', icon: '🎓' },
      { text: 'Build foundation: 120–150 DSA problems', icon: '🧠' },
      { text: '1 deployed backend project + 1 ML project', icon: '🚀' },
      { text: 'Resume v1 ready by May 2026', icon: '📄' },
      { text: 'Start Sem 5 strong: 20+ apps/week from July', icon: '💼' },
      { text: 'Get Internship #1 by Nov 2026', icon: '🏆' },
    ]
  },
  {
    year: '2027', label: 'Execution Year',
    color: 'text-amber-400', border: 'border-amber-500/30',
    goals: [
      { text: '300+ DSA solved (topic-mastered)', icon: '⚡' },
      { text: '500+ DSA by Sem 6 end', icon: '🔥' },
      { text: 'System design mastery', icon: '🏗️' },
      { text: '₹50 LPA+ offer secured', icon: '💰' },
      { text: 'Internship #2 / PPO', icon: '🎯' },
      { text: 'Production system deployed + maintained', icon: '🛠️' },
    ]
  },
  {
    year: '2028', label: 'Upgrade Year',
    color: 'text-purple-400', border: 'border-purple-500/30',
    goals: [
      { text: '₹1 Cr+ offer (global/off-campus)', icon: '🌍' },
      { text: 'Strong negotiation position', icon: '💪' },
      { text: 'Startup MVP launched', icon: '🚀' },
      { text: 'First users on product', icon: '👥' },
      { text: 'Full financial independence path locked', icon: '🔓' },
    ]
  },
]

export default function Roadmap() {
  const [expanded, setExpanded] = useState('S4')
  const [data, setData] = useState(loadRoadmap)
  const [editingSem, setEditingSem] = useState(null)   // { semId, field: 'outcomes'|'milestones', idx }
  const [editingYear, setEditingYear] = useState(null) // { yearIdx, goalIdx }
  const [newOutcome, setNewOutcome] = useState('')
  const [newMilestone, setNewMilestone] = useState('')
  const [newYearGoal, setNewYearGoal] = useState('')

  const save = (next) => { setData(next); saveRoadmap(next) }

  // Semester: add outcome
  const addOutcome = (semId) => {
    if (!newOutcome.trim()) return
    const next = { ...data, semesters: data.semesters.map(s => s.id === semId ? { ...s, outcomes: [...s.outcomes, newOutcome.trim()] } : s) }
    save(next); setNewOutcome('')
  }

  // Semester: delete outcome
  const delOutcome = (semId, idx) => {
    const next = { ...data, semesters: data.semesters.map(s => s.id === semId ? { ...s, outcomes: s.outcomes.filter((_, i) => i !== idx) } : s) }
    save(next)
  }

  // Semester: add milestone
  const addMilestone = (semId) => {
    if (!newMilestone.trim()) return
    const next = { ...data, semesters: data.semesters.map(s => s.id === semId ? { ...s, milestones: [...s.milestones, { label: newMilestone.trim(), done: false }] } : s) }
    save(next); setNewMilestone('')
  }

  // Semester: delete milestone
  const delMilestone = (semId, idx) => {
    const next = { ...data, semesters: data.semesters.map(s => s.id === semId ? { ...s, milestones: s.milestones.filter((_, i) => i !== idx) } : s) }
    save(next)
  }

  // Milestone: toggle done
  const toggleMilestone = (semId, idx) => {
    const next = { ...data, semesters: data.semesters.map(s => s.id === semId ? { ...s, milestones: s.milestones.map((m, i) => i === idx ? { ...m, done: !m.done } : m) } : s) }
    save(next)
  }

  // Yearly goal: add
  const addYearGoal = (yearIdx) => {
    if (!newYearGoal.trim()) return
    const next = { ...data, yearlyGoals: data.yearlyGoals.map((y, i) => i === yearIdx ? { ...y, goals: [...y.goals, { text: newYearGoal.trim(), icon: '🎯' }] } : y) }
    save(next); setNewYearGoal('')
  }

  // Yearly goal: delete
  const delYearGoal = (yearIdx, goalIdx) => {
    const next = { ...data, yearlyGoals: data.yearlyGoals.map((y, i) => i === yearIdx ? { ...y, goals: y.goals.filter((_, j) => j !== goalIdx) } : y) }
    save(next)
  }

  return (
    <div className="p-6 space-y-8 page-enter">
      <SectionTitle sub="Your full journey: Sem 4 → ₹1Cr+ package → Startup. Stay on identity.">
        Semester Roadmap
      </SectionTitle>

      {/* Semester Timeline */}
      <div className="space-y-3">
        {data.semesters.map((sem) => (
          <div key={sem.id}
            className={`exec-card border cursor-pointer transition-all ${sem.color} ${expanded === sem.id ? 'ring-1 ring-inset ring-white/10' : ''}`}
            onClick={() => setExpanded(expanded === sem.id ? null : sem.id)}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm ${sem.isNow ? 'bg-accent text-void' : 'bg-surface border border-border text-ghost'}`}>
                  {sem.id}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-display font-bold text-white">{sem.emoji} {sem.title}</span>
                    {sem.isNow && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 animate-pulse-fast">
                        ✦ YOU ARE HERE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-xs font-mono ${sem.textColor}`}>Identity: {sem.identity}</span>
                    <span className="text-xs text-ghost font-mono">{sem.period}</span>
                  </div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full ${sem.dotColor} opacity-70`} />
            </div>

            {/* Expanded */}
            {expanded === sem.id && (
              <div className="mt-5 border-t border-white/5 pt-5" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-6">
                  {/* Outcomes */}
                  <div>
                    <div className="text-xs font-mono text-ghost uppercase tracking-widest mb-3">Outcomes</div>
                    <div className="space-y-2">
                      {sem.outcomes.map((o, i) => (
                        <div key={i} className="flex items-start gap-2 group">
                          <CheckCircle2 size={13} className={`${sem.textColor} mt-0.5 flex-shrink-0`} />
                          <span className="text-sm text-slate-300 flex-1">{o}</span>
                          <button onClick={() => delOutcome(sem.id, i)} className="opacity-0 group-hover:opacity-100 text-ghost hover:text-kill transition-all text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <input
                        className="flex-1 bg-void border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-accent/50"
                        placeholder="Add outcome..."
                        value={newOutcome}
                        onChange={e => setNewOutcome(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addOutcome(sem.id)}
                        onClick={e => e.stopPropagation()}
                      />
                      <button onClick={e => { e.stopPropagation(); addOutcome(sem.id) }} className="px-2 py-1 text-xs bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20">+ Add</button>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <div className="text-xs font-mono text-ghost uppercase tracking-widest mb-3">Milestones</div>
                    <div className="space-y-2">
                      {sem.milestones.map((m, i) => (
                        <div key={i} className="flex items-start gap-2 group cursor-pointer" onClick={() => toggleMilestone(sem.id, i)}>
                          <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 transition-all ${m.done ? 'bg-emerald-500/20 border-emerald-500/40' : 'border-border'}`}>
                            {m.done && <CheckCircle2 size={11} className="text-emerald-400" />}
                          </div>
                          <span className={`text-sm flex-1 ${m.done ? 'text-ghost line-through' : 'text-slate-300'}`}>{m.label}</span>
                          <button onClick={e => { e.stopPropagation(); delMilestone(sem.id, i) }} className="opacity-0 group-hover:opacity-100 text-ghost hover:text-kill transition-all text-xs">✕</button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <input
                        className="flex-1 bg-void border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-accent/50"
                        placeholder="Add milestone..."
                        value={newMilestone}
                        onChange={e => setNewMilestone(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addMilestone(sem.id)}
                        onClick={e => e.stopPropagation()}
                      />
                      <button onClick={e => { e.stopPropagation(); addMilestone(sem.id) }} className="px-2 py-1 text-xs bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20">+ Add</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Year-wise Goals */}
      <div>
        <div className="text-xs font-mono text-ghost uppercase tracking-widest mb-4">Year-Wise Goals</div>
        <div className="grid grid-cols-3 gap-4">
          {data.yearlyGoals.map((y, yearIdx) => (
            <div key={y.year} className={`exec-card border ${y.border}`}>
              <div className="flex items-center gap-2 mb-4">
                <Star size={14} className={y.color} />
                <span className={`font-display font-bold ${y.color}`}>{y.year}</span>
                <span className="text-xs text-ghost font-mono">— {y.label}</span>
              </div>
              <div className="space-y-2.5">
                {y.goals.map((g, goalIdx) => (
                  <div key={goalIdx} className="flex items-start gap-2 group">
                    <span className="text-base leading-none mt-0.5 flex-shrink-0">{g.icon}</span>
                    <span className="text-sm text-slate-300 leading-snug flex-1">{g.text}</span>
                    <button onClick={() => delYearGoal(yearIdx, goalIdx)} className="opacity-0 group-hover:opacity-100 text-ghost hover:text-kill transition-all text-xs flex-shrink-0">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input
                  className="flex-1 bg-void border border-border rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-accent/50"
                  placeholder="Add goal..."
                  value={editingYear?.yearIdx === yearIdx ? newYearGoal : ''}
                  onChange={e => { setEditingYear({ yearIdx }); setNewYearGoal(e.target.value) }}
                  onKeyDown={e => e.key === 'Enter' && addYearGoal(yearIdx)}
                />
                <button onClick={() => addYearGoal(yearIdx)} className="px-2 py-1 text-xs bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20">+ Add</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Master Trajectory Banner */}
      <div className="exec-card border border-accent/20 bg-accent/5">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-accent" />
          <span className="text-xs font-mono text-accent uppercase tracking-widest">Master Trajectory</span>
        </div>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div><span className="text-ghost font-mono text-xs">Sem 5 →</span><br /><span className="text-white font-medium">Internship #1 (top-tier)</span></div>
          <div><span className="text-ghost font-mono text-xs">Sem 6 →</span><br /><span className="text-white font-medium">Internship #2 + ₹50 LPA+</span></div>
          <div><span className="text-ghost font-mono text-xs">Sem 7 →</span><br /><span className="text-white font-medium">₹1 Cr+ upgrade (global)</span></div>
          <div><span className="text-ghost font-mono text-xs">Sem 8 →</span><br /><span className="text-white font-medium">Startup + MVP + Users</span></div>
        </div>
      </div>
    </div>
  )
}
