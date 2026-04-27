# ExecOS — Sahil's ₹1Cr Execution System

A production-grade personal execution dashboard. Full-stack. SQLite database. Deployable in 10 minutes.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Charts | Recharts |
| State | Zustand + React Query pattern |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) — zero config, file-based |
| Auth | JWT (30-day tokens) |
| Fonts | Syne (display) + DM Sans (body) + JetBrains Mono |

---

## Local Setup (5 minutes)

```bash
# 1. Clone / download the project
cd execos

# 2. Install all dependencies
npm run install:all

# 3. Setup server environment
cd server
cp .env.example .env
# Edit .env — change JWT_SECRET to something long and random

# 4. Run dev (both server + client)
cd ..
npm run dev
```

App runs at: `http://localhost:5173`
API runs at: `http://localhost:3001`

Database file auto-created at: `server/data/execos.db`

---

## Deployment Options

### Option A: Railway (Recommended — Free tier available)

1. Push to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Set environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-long-random-secret-here
   PORT=3001
   ```
4. Railway auto-detects Node.js — set start command: `npm start`
5. Build command: `npm run build`

Railway will serve both API and frontend from the same process.

### Option B: Render (Free tier)

1. Push to GitHub
2. New Web Service on render.com
3. Build Command: `npm run install:all && npm run build`
4. Start Command: `npm start`
5. Add env vars same as above

### Option C: VPS (DigitalOcean / Hetzner)

```bash
# On your server
git clone <your-repo>
cd execos
npm run install:all
npm run build

# Set env
cd server
cp .env.example .env
nano .env  # set JWT_SECRET and NODE_ENV=production

# Run with PM2
npm install -g pm2
pm2 start server/index.js --name execos
pm2 save
pm2 startup

# Nginx reverse proxy (optional)
# Point domain to localhost:3001
```

---

## Environment Variables

```env
# server/.env
PORT=3001
NODE_ENV=production          # changes to production disables CORS and serves static files
JWT_SECRET=<random 64-char string>   # CRITICAL: change this
CLIENT_URL=http://localhost:5173     # dev only, ignored in production
```

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Database

**SQLite** — no setup, no external service, no cost.

- File: `server/data/execos.db`
- Auto-created on first run
- To back up: just copy the `.db` file
- To reset: delete the file and restart

**Tables:**
- `users` — auth
- `dsa_problems` + `dsa_topics` — DSA tracking
- `projects` — project tracker
- `applications` — job applications
- `network_contacts` — networking log
- `daily_logs` — daily execution logs + scores
- `timers` — countdown/pomodoro timers
- `goals` — goals and milestones
- `system_design` — system design notes
- `weekly_audits` — Sunday audit records
- `checklist_items` — daily checklist state

---

## API Routes

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/dsa                   — problems + topics + week count
POST   /api/dsa                   — log problem
DELETE /api/dsa/:id
PATCH  /api/dsa/:id/revision

GET    /api/applications
POST   /api/applications
PATCH  /api/applications/:id
DELETE /api/applications/:id

GET    /api/logs                  — last 30 daily logs
GET    /api/logs/today
POST   /api/logs                  — save/update today's log
POST   /api/logs/checklist
GET    /api/logs/analytics        — 14-day scores + week avg

GET    /api/projects
POST   /api/projects
PATCH  /api/projects/:id
DELETE /api/projects/:id

GET    /api/network
POST   /api/network
PATCH  /api/network/:id
DELETE /api/network/:id

GET    /api/goals
POST   /api/goals
PATCH  /api/goals/:id
DELETE /api/goals/:id

GET    /api/timers
POST   /api/timers
DELETE /api/timers/:id

GET    /api/audit
POST   /api/audit
```

---

## Pages

| Route | Page |
|-------|------|
| `/` | Command Center — daily overview, checklist, score |
| `/daily` | Daily Log — score input, reflection |
| `/dsa` | DSA Tracker — problems, topic mastery |
| `/projects` | Project Tracker — roadmap phases |
| `/applications` | Application Tracker — pipeline + table |
| `/network` | Networking Tracker |
| `/timers` | Pomodoro + countdown timers |
| `/schedule` | A/B/C rotation schedule |
| `/goals` | Goals + career milestones |
| `/analytics` | Charts: scores, DSA radar, app funnel |
| `/audit` | Weekly audit with failure analysis |
| `/principles` | 12 operating principles |

---

## Scoring System

**Daily score = /40**

| Category | Max | Criteria |
|----------|-----|----------|
| DSA | 10 | 2 medium = 8, 1 hard = 10, 1 medium = 6 |
| Project | 10 | Feature + deploy + explain = 10 |
| Career | 10 | 15+ apps + 3 networking = 10 |
| Discipline | 10 | 8+ hrs deep work + no distractions = 10 |

**Weekly targets:**
- DSA: 20–25 problems
- Applications: 50+
- Energy: avg ≥ 7

---

## The Rotational System

```
Mon → Type B (Build Day)
Tue → Type C (Career Day)
Wed → Type A (DSA Day)
Thu → Type B (Build Day)
Fri → Type C (Career Day)
Sat → Type A (DSA Day)
Sun → Type B (Build Day) + Weekly Audit
```

Zero decision-making. Open the app → see the type → execute the checklist.
