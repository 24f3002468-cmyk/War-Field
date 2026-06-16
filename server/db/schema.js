const { Pool } = require('pg')

let pool = null

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  }
  return pool
}

const initSchema = async () => {
  const client = await getPool().connect()
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`)
    await client.query(`CREATE TABLE IF NOT EXISTS dsa_problems (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      difficulty TEXT CHECK(difficulty IN ('Easy','Medium','Hard')) NOT NULL,
      topic TEXT NOT NULL,
      insight TEXT,
      needs_revision BOOLEAN DEFAULT false,
      solved_at TIMESTAMPTZ DEFAULT NOW()
    )`)
    await client.query(`CREATE TABLE IF NOT EXISTS dsa_topics (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic TEXT NOT NULL,
      total_solved INTEGER DEFAULT 0,
      easy_count INTEGER DEFAULT 0,
      medium_count INTEGER DEFAULT 0,
      hard_count INTEGER DEFAULT 0,
      mastery_score INTEGER DEFAULT 0,
      last_practiced TIMESTAMPTZ,
      last_updated TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, topic)
    )`)
    await client.query(`CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      tech_stack TEXT,
      deployment_url TEXT,
      github_url TEXT,
      status TEXT DEFAULT 'In Progress',
      current_phase TEXT DEFAULT 'Auth',
      phase_index INTEGER DEFAULT 0,
      interview_explanation TEXT,
      core_feature TEXT,
      optional_feature TEXT,
      system_design_applied TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`)
    await client.query(`CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      quality TEXT DEFAULT 'Normal',
      referral TEXT DEFAULT 'None',
      status TEXT DEFAULT 'Applied',
      applied_at TIMESTAMPTZ DEFAULT NOW(),
      followup_date TEXT,
      notes TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`)
    await client.query(`CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      log_date TEXT NOT NULL,
      day_type TEXT,
      energy_score INTEGER DEFAULT 0,
      dsa_score INTEGER DEFAULT 0,
      project_score INTEGER DEFAULT 0,
      career_score INTEGER DEFAULT 0,
      discipline_score INTEGER DEFAULT 0,
      total_score INTEGER DEFAULT 0,
      dsa_count INTEGER DEFAULT 0,
      apps_sent INTEGER DEFAULT 0,
      features_built TEXT,
      system_design_topic TEXT,
      deep_work_hours NUMERIC DEFAULT 0,
      notes TEXT,
      reflection TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, log_date)
    )`)
    await client.query(`CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      log_date TEXT NOT NULL,
      item_index INTEGER DEFAULT 0,
      item_text TEXT NOT NULL,
      completed BOOLEAN DEFAULT false
    )`)
    await client.query(`CREATE TABLE IF NOT EXISTS timers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT,
      type TEXT DEFAULT 'Pomodoro',
      duration_seconds INTEGER DEFAULT 1500,
      deadline_at TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`)
    await client.query(`CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      target_date TEXT,
      progress_pct INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active',
      category TEXT DEFAULT 'Career',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`)
    await client.query(`CREATE TABLE IF NOT EXISTS weekly_audits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_start TEXT NOT NULL,
      dsa_total INTEGER DEFAULT 0,
      apps_total INTEGER DEFAULT 0,
      avg_score NUMERIC DEFAULT 0,
      avg_energy NUMERIC DEFAULT 0,
      what_failed TEXT,
      root_cause TEXT,
      fix_next_week TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, week_start)
    )`)
    await client.query(`CREATE TABLE IF NOT EXISTS network_contacts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      company TEXT,
      role TEXT,
      platform TEXT,
      message_sent BOOLEAN DEFAULT false,
      referral_requested BOOLEAN DEFAULT false,
      referral_received BOOLEAN DEFAULT false,
      response_received BOOLEAN DEFAULT false,
      followup_date TEXT,
      notes TEXT,
      contacted_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`)
    console.log('✅ PostgreSQL schema ready')
  } finally {
    client.release()
  }
}

const getDb = () => getPool()

module.exports = { initSchema, getDb }
