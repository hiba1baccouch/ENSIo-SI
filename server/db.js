import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { quizStations } from '../content/quizStations.js'
import { restoreTeamStore } from './teamStore.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isVercel = Boolean(process.env.VERCEL)
const DB_PATH = process.env.DB_PATH || (isVercel ? path.join('/tmp', 'eniso_game.db') : path.join(__dirname, '..', 'data', 'eniso_game.db'))

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Always overwrite station quiz data from content/quizStations.js
export function applyQuizContentFromCode() {
  const upsertStation = db.prepare(`
    INSERT INTO stations (id, name, game_type, is_enabled, order_index, hint_text, next_station_id, points_reward)
    VALUES (?, ?, ?, 1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      game_type = excluded.game_type,
      order_index = excluded.order_index,
      hint_text = excluded.hint_text,
      next_station_id = excluded.next_station_id,
      points_reward = excluded.points_reward
  `)
  const upsertConfig = db.prepare(`
    INSERT INTO game_configs (station_id, config_json, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(station_id) DO UPDATE SET
      config_json = excluded.config_json,
      updated_at = datetime('now')
  `)

  for (let i = 0; i < quizStations.length; i++) {
    const s = quizStations[i]
    const nextId = i < quizStations.length - 1 ? quizStations[i + 1].id : null
    upsertStation.run(
      s.id,
      s.name,
      s.game_type,
      s.order_index ?? i + 1,
      s.hint_text || '',
      nextId,
      s.points_reward ?? 100
    )
    upsertConfig.run(s.id, JSON.stringify(s.config || {}))
  }
}

// ─── SCHEMA ───────────────────────────────────────────────
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      avatar TEXT DEFAULT '⚡',
      current_station INTEGER DEFAULT 1,
      score INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS stations (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      game_type TEXT NOT NULL,
      is_enabled INTEGER DEFAULT 1,
      order_index INTEGER NOT NULL,
      hint_text TEXT DEFAULT '',
      next_station_id INTEGER,
      points_reward INTEGER DEFAULT 100,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id INTEGER NOT NULL UNIQUE,
      config_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS team_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id TEXT NOT NULL,
      station_id INTEGER NOT NULL,
      status TEXT DEFAULT 'locked',
      attempts_used INTEGER DEFAULT 0,
      score_earned INTEGER DEFAULT 0,
      started_at TEXT,
      completed_at TEXT,
      hint_unlocked INTEGER DEFAULT 0,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
      UNIQUE(team_id, station_id)
    );

    CREATE TABLE IF NOT EXISTS game_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id TEXT NOT NULL,
      station_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_data TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
      data BLOB NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  // Check if we need to seed or update teams to 10 and stations to 7 (or update French defaults to English)
  const teamCount = db.prepare('SELECT COUNT(*) as count FROM teams').get().count
  const stationCount = db.prepare('SELECT COUNT(*) as count FROM stations').get().count
  const s1 = db.prepare('SELECT hint_text FROM stations WHERE id = 1').get()
  if (teamCount < 10 || stationCount < 7 || (s1?.hint_text && s1.hint_text.includes('prochaine'))) {
    seedDefaultData()
  }

  applyQuizContentFromCode()
  restoreTeamStore(db)
}

export function seedDefaultData() {
  // Clear and reseed fresh 10 teams and 7 stations
  db.exec(`
    DELETE FROM team_progress;
    DELETE FROM game_configs;
    DELETE FROM stations;
    DELETE FROM teams;
  `)

  const defaultTeams = [
    { id: 'team-1',  name: 'Team1',  color: '#4f46e5', avatar: 'T1' },
    { id: 'team-2',  name: 'Team2',  color: '#0891b2', avatar: 'T2' },
    { id: 'team-3',  name: 'Team3',  color: '#059669', avatar: 'T3' },
    { id: 'team-4',  name: 'Team4',  color: '#d97706', avatar: 'T4' },
    { id: 'team-5',  name: 'Team5',  color: '#dc2626', avatar: 'T5' },
    { id: 'team-6',  name: 'Team6',  color: '#7c3aed', avatar: 'T6' },
    { id: 'team-7',  name: 'Team7',  color: '#0d9488', avatar: 'T7' },
    { id: 'team-8',  name: 'Team8',  color: '#b45309', avatar: 'T8' },
    { id: 'team-9',  name: 'Team9',  color: '#be123c', avatar: 'T9' },
    { id: 'team-10', name: 'Team10', color: '#6d28d9', avatar: 'T10' },
  ]

  const insertTeam = db.prepare(
    'INSERT INTO teams (id, name, color, avatar) VALUES (?, ?, ?, ?)'
  )
  for (const team of defaultTeams) {
    insertTeam.run(team.id, team.name, team.color, team.avatar)
  }

  const defaultStations = quizStations.map((s, i) => ({
    id: s.id,
    name: s.name,
    game_type: s.game_type,
    order_index: s.order_index ?? i + 1,
    hint_text: s.hint_text || '',
    points_reward: s.points_reward ?? 100,
  }))

  const insertStation = db.prepare(
    'INSERT INTO stations (id, name, game_type, order_index, hint_text, points_reward, next_station_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  for (let i = 0; i < defaultStations.length; i++) {
    const s = defaultStations[i]
    const nextId = i < defaultStations.length - 1 ? defaultStations[i + 1].id : null
    insertStation.run(s.id, s.name, s.game_type, s.order_index, s.hint_text, s.points_reward, nextId)
  }

  const insertConfig = db.prepare(
    'INSERT INTO game_configs (station_id, config_json) VALUES (?, ?)'
  )
  for (const station of quizStations) {
    insertConfig.run(station.id, JSON.stringify(station.config || {}))
  }

  // Initialize team progress — station 1 is 'available', rest are 'locked'
  const teams = db.prepare('SELECT id FROM teams').all()
  const stations = db.prepare('SELECT id, order_index FROM stations ORDER BY order_index').all()
  const insertProgress = db.prepare(
    'INSERT INTO team_progress (team_id, station_id, status) VALUES (?, ?, ?)'
  )
  for (const team of teams) {
    for (const station of stations) {
      const status = station.order_index === 1 ? 'available' : 'locked'
      insertProgress.run(team.id, station.id, status)
    }
  }

  // Admin settings
  const insertSetting = db.prepare('INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)')
  insertSetting.run('admin_password', 'eniso2026')
  insertSetting.run('sequential_mode', 'true')
  insertSetting.run('game_active', 'true')
}
