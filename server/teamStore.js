import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STORE_PATH = process.env.VERCEL
  ? path.join('/tmp', 'eniso_team_store.json')
  : path.join(__dirname, '..', 'data', 'team_store.json')

const MAX_SCORE = 2500

let memory = { teams: {} }

function clampScore(n) {
  const v = Number(n)
  if (!Number.isFinite(v) || v < 0) return 0
  return Math.min(Math.round(v), MAX_SCORE)
}

function loadFromDisk() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'))
      if (parsed?.teams) memory = parsed
    }
  } catch (err) {
    console.warn('Could not load team score store', err.message)
  }
}

function saveToDisk() {
  try {
    const dir = path.dirname(STORE_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(STORE_PATH, JSON.stringify(memory))
  } catch (err) {
    console.warn('Could not persist team score store', err.message)
  }
}

loadFromDisk()

export function snapshotTeam(db, teamId) {
  if (!teamId) return
  const team = db.prepare('SELECT id, score, current_station FROM teams WHERE id = ?').get(teamId)
  if (!team) return
  const progress = db.prepare(
    'SELECT station_id, status, attempts_used, score_earned, hint_unlocked FROM team_progress WHERE team_id = ?'
  ).all(teamId)
  memory.teams[teamId] = {
    score: team.score || 0,
    current_station: team.current_station || 1,
    progress,
  }
  saveToDisk()
}

export function snapshotAllTeams(db) {
  const teams = db.prepare('SELECT id FROM teams').all()
  for (const t of teams) snapshotTeam(db, t.id)
}

export function clearTeamSnapshot(teamId) {
  delete memory.teams[teamId]
  saveToDisk()
}

export function clearAllSnapshots() {
  memory = { teams: {} }
  saveToDisk()
}

function mergeProgress(serverRow, incoming) {
  if (!incoming) return null
  const statusRank = { locked: 0, available: 1, in_progress: 2, completed: 3 }
  const serverRank = statusRank[serverRow?.status] ?? 0
  const incomingRank = statusRank[incoming.status] ?? 0
  if (incomingRank < serverRank) return null

  return {
    status: incomingRank >= serverRank ? incoming.status : serverRow.status,
    attempts_used: Math.max(serverRow?.attempts_used || 0, incoming.attempts_used || 0),
    score_earned: Math.max(serverRow?.score_earned || 0, incoming.score_earned || 0),
    hint_unlocked: (serverRow?.hint_unlocked || incoming.hint_unlocked) ? 1 : 0,
  }
}

export function applySnapshotToDb(db, teamId, snap) {
  if (!teamId || !snap) return
  const current = db.prepare('SELECT score, current_station FROM teams WHERE id = ?').get(teamId)
  if (!current) return

  const score = Math.max(current.score || 0, clampScore(snap.score))
  const station = Math.max(current.current_station || 1, Math.min(Number(snap.current_station) || 1, 7))
  db.prepare(
    "UPDATE teams SET score = ?, current_station = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(score, station, teamId)

  for (const p of snap.progress || []) {
    const stationId = parseInt(p.station_id)
    if (!stationId) continue
    const row = db.prepare(
      'SELECT status, attempts_used, score_earned, hint_unlocked FROM team_progress WHERE team_id = ? AND station_id = ?'
    ).get(teamId, stationId)
    if (!row) continue
    const merged = mergeProgress(row, p)
    if (!merged) continue
    db.prepare(
      `UPDATE team_progress
       SET status = ?, attempts_used = ?, score_earned = ?, hint_unlocked = ?
       WHERE team_id = ? AND station_id = ?`
    ).run(merged.status, merged.attempts_used, merged.score_earned, merged.hint_unlocked, teamId, stationId)
  }

  snapshotTeam(db, teamId)
}

export function restoreTeamStore(db) {
  loadFromDisk()
  for (const [teamId, snap] of Object.entries(memory.teams || {})) {
    applySnapshotToDb(db, teamId, snap)
  }
}
