import { format, startOfWeek, differenceInDays } from 'date-fns'

// Day types per planner: Mon/Wed/Fri = A (DSA), Tue/Thu = B (Build), Sat = C (Career/Build), Sun = D (Recovery)
export const getDayType = (date = new Date()) => {
  const cycle = { 0: 'D', 1: 'A', 2: 'B', 3: 'A', 4: 'B', 5: 'C', 6: 'D' }
  return cycle[date.getDay()]
}

export const DAY_TYPE_LABELS = {
  A: 'DSA Heavy',
  B: 'Build Day',
  C: 'Career Day',
  D: 'Recovery',
}

export const DAY_SCHEDULE = {
  Mon: { type: 'A', label: 'DSA Heavy', blocks: [{ task: 'Python + DSA', hours: '2h' }, { task: 'Backend / FastAPI', hours: '2h' }, { task: 'IITM BS Work', hours: '2h' }, { task: 'B.Tech Tasks', hours: '1h' }] },
  Tue: { type: 'B', label: 'ML+Acad', blocks: [{ task: 'IITM Deep Work', hours: '2h' }, { task: 'ML Practice', hours: '2.5h' }, { task: 'Python Implementation', hours: '1.5h' }, { task: 'DSA (light) + B.Tech', hours: '1h' }] },
  Wed: { type: 'A', label: 'DSA Heavy', blocks: [{ task: 'Python + DSA', hours: '2h' }, { task: 'Backend / Projects', hours: '2h' }, { task: 'IITM BS Work', hours: '2h' }, { task: 'B.Tech Tasks', hours: '1h' }] },
  Thu: { type: 'B', label: 'ML+Acad', blocks: [{ task: 'IITM Deep Work', hours: '2h' }, { task: 'ML Practice', hours: '2.5h' }, { task: 'Python Implementation', hours: '1.5h' }, { task: 'DSA (light) + B.Tech', hours: '1h' }] },
  Fri: { type: 'A', label: 'Tech Core', blocks: [{ task: 'Python + DSA', hours: '2h' }, { task: 'Backend / Projects', hours: '2h' }, { task: 'IITM BS Work', hours: '2h' }, { task: 'B.Tech Tasks', hours: '1h' }] },
  Sat: { type: 'C', label: 'Build Day', blocks: [{ task: 'Project Progress', hours: '2h' }, { task: 'Deployment / GitHub', hours: '1.5h' }, { task: 'Resume / Portfolio', hours: '1h' }, { task: 'Pending Tasks', hours: '0.5h' }] },
  Sun: { type: 'D', label: 'Recovery', blocks: [{ task: 'Weekly Audit', hours: '1h' }, { task: 'Plan Next Week', hours: '0.5h' }, { task: 'Light Revision', hours: '1h' }, { task: 'Rest', hours: 'rest' }] },
}

export const DAY_CHECKLISTS = {
  A: [
    'Solve 2 medium problems OR 1 hard problem',
    'Write pattern notes — not just solution',
    'Revise 1 weak topic for 20 minutes',
    'Light project work — 30 minutes max',
    'Academic block — 60 minutes (IITM BS)',
    'Explain today\'s solution out loud',
  ],
  B: [
    'IITM Deep Work — 2 hours focused',
    'ML practice / implementation',
    'Ship 1 project feature or module',
    'Apply system design concept in code',
    '1 DSA problem — minimum viable',
    'Push to GitHub — no commit = failed',
  ],
  C: [
    'Project progress — 2 hours build',
    'Deployment / GitHub cleanup',
    'Resume & portfolio update',
    'Submit 5–10 applications if ready',
    'Clear pending tasks backlog',
    'Plan next week\'s execution',
  ],
  D: [
    'Weekly audit — cold honest numbers',
    'Plan next week\'s schedule',
    'Light revision — no heavy work',
    'Rest — protect energy for Mon',
  ],
}

export const DAY_TYPE_COLORS = {
  A: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  B: { bg: 'bg-signal/10', border: 'border-signal/30', text: 'text-signal', dot: 'bg-signal' },
  C: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-500' },
  D: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400', dot: 'bg-slate-500' },
}

export const PHASES = [
  'Auth System', 'Database Layer', 'REST API', 'ML Integration',
  'Async Jobs', 'Caching', 'Logging', 'Optimization',
]

export const TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Sliding Window', 'Two Pointers',
  'Binary Search', 'Recursion', 'Trees', 'Graphs', 'Heaps', 'DP', 'Stack',
]

export const TASK_CATEGORIES = [
  'Python', 'DSA', 'Backend', 'ML', 'IITM BS', 'B.Tech', 'Projects', 'Career',
]

export const STATUS_COLORS = {
  'Applied':      'bg-slate-500/10 text-slate-400 border-slate-500/30',
  'In Review':    'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'OA Received':  'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'Interview':    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'Final Round':  'bg-signal/10 text-signal border-signal/30',
  'Offer':        'bg-accent/10 text-accent border-accent/30',
  'Rejected':     'bg-kill/10 text-kill border-kill/30',
  'Planned':      'bg-slate-500/10 text-slate-400',
  'In Progress':  'bg-signal/10 text-signal',
  'Done':         'bg-emerald-500/10 text-emerald-400',
  'Active':       'bg-signal/10 text-signal',
  'Easy':         'bg-emerald-500/10 text-emerald-400',
  'Medium':       'bg-amber-500/10 text-amber-400',
  'Hard':         'bg-kill/10 text-kill',
  'High Quality': 'bg-accent/10 text-accent',
  'Normal':       'bg-slate-500/10 text-slate-400',
  'P0 - Critical':'bg-kill/10 text-kill border-kill/30',
  'P1 - High':    'bg-amber-500/10 text-amber-400 border-amber-500/30',
  'P2 - Medium':  'bg-signal/10 text-signal border-signal/30',
  'P3 - Low':     'bg-slate-500/10 text-slate-400 border-slate-500/30',
}

export const getMastery = (score) => {
  if (score >= 70) return { label: 'Strong', color: 'text-emerald-400', bar: 'bg-emerald-500' }
  if (score >= 40) return { label: 'Medium', color: 'text-amber-400', bar: 'bg-amber-500' }
  return { label: 'Weak', color: 'text-kill', bar: 'bg-kill' }
}

export const getScoreColor = (score, max = 40) => {
  const pct = score / max
  if (pct >= 0.75) return 'text-emerald-400'
  if (pct >= 0.5) return 'text-amber-400'
  return 'text-kill'
}

export const fmtDate = (d) => format(new Date(d), 'dd MMM')
export const fmtFull = (d) => format(new Date(d), 'dd MMM yyyy')
export const today = () => format(new Date(), 'yyyy-MM-dd')

export const deadlineCountdown = (isoStr) => {
  if (!isoStr) return '—'
  const ms = new Date(isoStr) - Date.now()
  if (ms < 0) return 'Expired'
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export const fmtTimer = (s) => {
  s = Math.max(0, Math.round(s))
  const m = Math.floor(s / 60), sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export const MOTIVATORS = {
  morning: [
    "The ₹1Cr version of you already started 2 hours ago.",
    "Every engineer at Google was once where you are. They just didn't stop.",
    "You don't get the ₹1Cr role by wishing. You get it by outworking.",
    "Comfort is the enemy. Pick up the problem.",
  ],
  lowEnergy: [
    "Low energy is not a reason. It's an excuse wearing a costume.",
    "The competitor you haven't met yet is working right now.",
    "Your future self is watching. Don't make them cringe.",
  ],
  onFire: [
    "This is the version of you that gets the offer. Keep going.",
    "You're building the evidence. Interviewers will feel this energy.",
    "Day by day, problem by problem. This is how ₹1Cr happens.",
  ],
  appTarget: [
    "50 applications is a minimum. Not a goal.",
    "Every rejected application is a referral you haven't found yet.",
    "Quality + Volume = Offer. You need both. Do both.",
  ],
}
