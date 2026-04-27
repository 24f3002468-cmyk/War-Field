const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'execos.db');
const dataDir = path.join(__dirname, '..', 'data');

let dbInstance = null;

class Database {
  constructor(sql) {
    this.sql = sql;
    this.db = null;
  }

  prepare(sql) {
    const db = this.db;
    return {
      run: (...params) => {
        try {
          db.run(sql, params);
          saveDatabase();
          return { changes: 1 };
        } catch (e) {
          console.error('DB run error:', e, sql, params);
          throw e;
        }
      },
      get: (...params) => {
        try {
          const result = db.exec(sql, params);
          if (result.length > 0 && result[0].values.length > 0) {
            const row = result[0].values[0];
            const columns = result[0].columns;
            const obj = {};
            columns.forEach((col, i) => obj[col] = row[i]);
            return obj;
          }
          return null;
        } catch (e) {
          console.error('DB get error:', e, sql, params);
          throw e;
        }
      },
      all: (...params) => {
        try {
          const result = db.exec(sql, params);
          if (result.length > 0) {
            return result[0].values.map(row => {
              const obj = {};
              result[0].columns.forEach((col, i) => obj[col] = row[i]);
              return obj;
            });
          }
          return [];
        } catch (e) {
          console.error('DB all error:', e, sql, params);
          throw e;
        }
      }
    };
  }

  exec(sql) {
    try {
      this.db.run(sql);
      saveDatabase();
    } catch (e) {
      console.error('DB exec error:', e, sql);
      throw e;
    }
  }

  run(sql, params = []) {
    try {
      this.db.run(sql, params);
      saveDatabase();
    } catch (e) {
      console.error('DB run error:', e, sql, params);
      throw e;
    }
  }
}

const initSchema = async () => {
  const SQL = await initSqlJs();

  let filebuffer = null;
  if (fs.existsSync(DB_PATH)) {
    filebuffer = fs.readFileSync(DB_PATH);
  }

  const sql = new SQL.Database(filebuffer);
  dbInstance = new Database(SQL);
  dbInstance.db = sql;

  sql.run('PRAGMA foreign_keys = ON');

  sql.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

  sql.run(`CREATE TABLE IF NOT EXISTS dsa_problems (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    difficulty TEXT CHECK(difficulty IN ('Easy','Medium','Hard')) NOT NULL,
    topic TEXT NOT NULL,
    insight TEXT,
    needs_revision INTEGER DEFAULT 0,
    solved_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  sql.run(`CREATE TABLE IF NOT EXISTS dsa_topics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    total_solved INTEGER DEFAULT 0,
    easy_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    hard_count INTEGER DEFAULT 0,
    mastery_score INTEGER DEFAULT 0,
    last_practiced TEXT,
    last_updated TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, topic),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  sql.run(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
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
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  sql.run(`CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    quality TEXT DEFAULT 'Normal',
    referral TEXT DEFAULT 'None',
    status TEXT DEFAULT 'Applied',
    applied_at TEXT DEFAULT (datetime('now')),
    followup_date TEXT,
    notes TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  sql.run(`CREATE TABLE IF NOT EXISTS network_contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    role TEXT,
    platform TEXT,
    message_sent INTEGER DEFAULT 0,
    referral_requested INTEGER DEFAULT 0,
    referral_received INTEGER DEFAULT 0,
    response_received INTEGER DEFAULT 0,
    followup_date TEXT,
    notes TEXT,
    contacted_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  sql.run(`CREATE TABLE IF NOT EXISTS daily_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
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
    deep_work_hours REAL DEFAULT 0,
    notes TEXT,
    reflection TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, log_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  sql.run(`CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    log_date TEXT NOT NULL,
    item_index INTEGER DEFAULT 0,
    item_text TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  sql.run(`CREATE TABLE IF NOT EXISTS timers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT,
    type TEXT DEFAULT 'Pomodoro',
    duration_seconds INTEGER DEFAULT 1500,
    deadline_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  sql.run(`CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_date TEXT,
    progress_pct INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active',
    category TEXT DEFAULT 'Career',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  sql.run(`CREATE TABLE IF NOT EXISTS system_design (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  sql.run(`CREATE TABLE IF NOT EXISTS weekly_audits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    week_start TEXT NOT NULL,
    dsa_total INTEGER DEFAULT 0,
    apps_total INTEGER DEFAULT 0,
    avg_score REAL DEFAULT 0,
    avg_energy REAL DEFAULT 0,
    what_failed TEXT,
    root_cause TEXT,
    fix_next_week TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, week_start),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  saveDatabase();
  return dbInstance;
};

const saveDatabase = () => {
  if (dbInstance && dbInstance.db) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const data = dbInstance.db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
};

const getDb = () => dbInstance;

module.exports = { initSchema, getDb, saveDatabase, db: dbInstance };
