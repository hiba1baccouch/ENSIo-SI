import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { db, initializeDatabase } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))
app.use('/placeholders', express.static(path.join(__dirname, '..', 'public', 'placeholders')))

// Initialize database
initializeDatabase()

// ─── PROGRESSIVE SCORING HELPER ──────────────────────────
// Attempt 1: 100 pts, Attempt 2: 75 pts, Attempt 3: 50 pts, 4+: 0 pts
export function calculateProgressivePoints(attemptsUsed) {
  if (attemptsUsed <= 1) return 100
  if (attemptsUsed === 2) return 75
  if (attemptsUsed === 3) return 50
  return 0
}

// ─── ADMIN AUTH MIDDLEWARE ─────────────────────────────────
function adminAuth(req, res, next) {
  const authHeader = req.headers['x-admin-key']
  const storedPassword = db.prepare("SELECT value FROM admin_settings WHERE key = 'admin_password'").get()
  if (!authHeader || authHeader !== storedPassword?.value) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// ─── TEAM ROUTES ──────────────────────────────────────────
// Get public leaderboard standings
app.get('/api/leaderboard', (req, res) => {
  const teams = db.prepare('SELECT id, name, color, avatar, score, current_station, updated_at FROM teams WHERE is_active = 1 ORDER BY score DESC, current_station DESC').all()
  res.json(teams)
})

// Get all teams (for initial 1-time squad registration)
app.get('/api/teams', (req, res) => {
  const teams = db.prepare('SELECT id, name, color, avatar, is_active FROM teams WHERE is_active = 1').all()
  res.json(teams)
})

// Get private squad stats (Strict privacy: player sees ONLY their own rank, score & station)
app.get('/api/teams/:teamId/private-stats', (req, res) => {
  const team = db.prepare('SELECT id, name, color, avatar, current_station, score FROM teams WHERE id = ?').get(req.params.teamId)
  if (!team) return res.status(404).json({ error: 'Team not found' })

  // Calculate team rank privately
  const rankResult = db.prepare('SELECT COUNT(*) as higher_count FROM teams WHERE score > ? AND is_active = 1').get(team.score)
  const rank = (rankResult?.higher_count || 0) + 1

  const completedCount = db.prepare("SELECT COUNT(*) as count FROM team_progress WHERE team_id = ? AND status = 'completed'").get(req.params.teamId).count

  res.json({
    id: team.id,
    name: team.name,
    color: team.color,
    avatar: team.avatar,
    current_station: team.current_station,
    score: team.score,
    rank,
    completed_count: completedCount,
  })
})

// Get team details with progress
app.get('/api/teams/:teamId', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.teamId)
  if (!team) return res.status(404).json({ error: 'Team not found' })

  const progress = db.prepare(`
    SELECT tp.*, s.name as station_name, s.game_type, s.order_index
    FROM team_progress tp
    JOIN stations s ON s.id = tp.station_id
    WHERE tp.team_id = ?
    ORDER BY s.order_index
  `).all(req.params.teamId)

  res.json({ ...team, progress })
})

// ─── STATION ROUTES (QR ONLY ACCESS) ──────────────────────
// Get station info (public, but sanitized & strictly protected)
app.get('/api/stations/:stationId', (req, res) => {
  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(parseInt(req.params.stationId))
  if (!station) return res.status(404).json({ error: 'Station beacon not recognized' })

  const config = db.prepare('SELECT config_json FROM game_configs WHERE station_id = ?').get(station.id)
  const gameConfig = config ? JSON.parse(config.config_json) : {}

  // Sanitize — remove correct answers from frontend
  const sanitized = sanitizeGameConfig(station.game_type, gameConfig)

  res.json({
    id: station.id,
    name: station.name,
    game_type: station.game_type,
    is_enabled: station.is_enabled,
    order_index: station.order_index,
    points_reward: station.points_reward,
    config: sanitized,
  })
})

// Check station access clearance for a team
app.get('/api/stations/:stationId/access/:teamId', (req, res) => {
  const stationId = parseInt(req.params.stationId)
  const teamId = req.params.teamId

  const progress = db.prepare(
    'SELECT * FROM team_progress WHERE team_id = ? AND station_id = ?'
  ).get(teamId, stationId)

  if (!progress) return res.status(404).json({ error: 'No progress record found' })

  const sequentialMode = db.prepare("SELECT value FROM admin_settings WHERE key = 'sequential_mode'").get()
  const isSequential = sequentialMode?.value === 'true'

  if (isSequential && progress.status === 'locked') {
    // Find what station they should actually be at
    const currentProg = db.prepare("SELECT station_id FROM team_progress WHERE team_id = ? AND status != 'locked' ORDER BY station_id DESC LIMIT 1").get(teamId)
    const requiredStation = currentProg ? currentProg.station_id : 1
    return res.json({
      access: false,
      reason: `QR Station Locked. Your squad must complete Station ${requiredStation} first.`,
      required_station: requiredStation
    })
  }

  const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(stationId)
  if (!station?.is_enabled) {
    return res.json({ access: false, reason: 'This QR Station is temporarily inactive.' })
  }

  res.json({
    access: true,
    status: progress.status,
    attempts_used: progress.attempts_used,
    hint_unlocked: progress.hint_unlocked,
    potential_points: calculateProgressivePoints(progress.attempts_used + 1)
  })
})

// ─── GAME VALIDATION ROUTES ──────────────────────────────
// Start a game session
app.post('/api/game/start', (req, res) => {
  const { teamId, stationId } = req.body || {}
  if (!teamId || !stationId) return res.status(400).json({ error: 'Missing teamId or stationId' })

  const progress = db.prepare(
    'SELECT * FROM team_progress WHERE team_id = ? AND station_id = ?'
  ).get(teamId, parseInt(stationId))

  if (!progress) return res.status(404).json({ error: 'No progress record' })
  if (progress.status === 'completed') return res.json({ already_completed: true, hint_unlocked: true })

  const sequentialMode = db.prepare("SELECT value FROM admin_settings WHERE key = 'sequential_mode'").get()
  if (sequentialMode?.value === 'true' && progress.status === 'locked') {
    return res.status(403).json({ error: 'Station is locked' })
  }

  // Mark as in_progress
  db.prepare(
    "UPDATE team_progress SET status = 'in_progress', started_at = datetime('now') WHERE team_id = ? AND station_id = ? AND status != 'completed'"
  ).run(teamId, parseInt(stationId))

  // Log telemetry event
  db.prepare(
    "INSERT INTO game_events (team_id, station_id, event_type, event_data) VALUES (?, ?, 'game_started', '{}')"
  ).run(teamId, parseInt(stationId))

  res.json({
    started: true,
    attempts_used: progress.attempts_used,
    potential_points: calculateProgressivePoints(progress.attempts_used + 1)
  })
})

// Validate a game answer (Progressive scoring: 100 -> 75 -> 50 -> 0)
app.post('/api/game/validate', (req, res) => {
  const { teamId, stationId, gameType, answer } = req.body || {}
  if (!teamId || !stationId || !gameType) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const config = db.prepare('SELECT config_json FROM game_configs WHERE station_id = ?').get(parseInt(stationId))
  if (!config) return res.status(404).json({ error: 'Game config not found' })

  const gameConfig = JSON.parse(config.config_json)
  const progress = db.prepare(
    'SELECT * FROM team_progress WHERE team_id = ? AND station_id = ?'
  ).get(teamId, parseInt(stationId))

  if (!progress) return res.status(404).json({ error: 'No progress record' })
  if (progress.status === 'completed') {
    const station = db.prepare('SELECT hint_text FROM stations WHERE id = ?').get(parseInt(stationId))
    return res.json({ correct: true, already_completed: true, hint: station.hint_text, points_earned: progress.score_earned })
  }

  // Increment attempts counter
  const newAttempts = (progress.attempts_used || 0) + 1
  db.prepare(
    'UPDATE team_progress SET attempts_used = ? WHERE team_id = ? AND station_id = ?'
  ).run(newAttempts, teamId, parseInt(stationId))

  const updatedProgress = { ...progress, attempts_used: newAttempts }

  // Validate based on game type
  const result = validateAnswer(gameType, gameConfig, answer, updatedProgress)

  // Log event
  db.prepare(
    "INSERT INTO game_events (team_id, station_id, event_type, event_data) VALUES (?, ?, 'answer_submitted', ?)"
  ).run(teamId, parseInt(stationId), JSON.stringify({ answer, correct: result.correct, attempt: newAttempts }))

  if (result.correct) {
    const station = db.prepare('SELECT * FROM stations WHERE id = ?').get(parseInt(stationId))
    const progressiveScore = calculateProgressivePoints(newAttempts)

    // Mark completed with progressive points
    db.prepare(`
      UPDATE team_progress 
      SET status = 'completed', hint_unlocked = 1, score_earned = ?, completed_at = datetime('now') 
      WHERE team_id = ? AND station_id = ?
    `).run(progressiveScore, teamId, parseInt(stationId))

    // Update team total score & advance station
    db.prepare(
      'UPDATE teams SET score = score + ?, current_station = current_station + 1, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(progressiveScore, teamId)

    // Unlock next station
    if (station.next_station_id) {
      db.prepare(
        "UPDATE team_progress SET status = 'available' WHERE team_id = ? AND station_id = ? AND status = 'locked'"
      ).run(teamId, station.next_station_id)
    }

    result.hint = station.hint_text
    result.points_earned = progressiveScore
    result.attempts_used = newAttempts
  } else {
    result.attempts_used = newAttempts
    result.next_potential_points = calculateProgressivePoints(newAttempts + 1)
  }

  res.json(result)
})

// Get hint for a completed station ONLY
app.get('/api/game/hint/:stationId/:teamId', (req, res) => {
  const progress = db.prepare(
    'SELECT * FROM team_progress WHERE team_id = ? AND station_id = ?'
  ).get(req.params.teamId, parseInt(req.params.stationId))

  if (!progress || !progress.hint_unlocked) {
    return res.status(403).json({ error: 'Physical hint is sealed until digital challenge is solved.' })
  }

  const station = db.prepare('SELECT hint_text FROM stations WHERE id = ?').get(parseInt(req.params.stationId))
  res.json({ hint: station.hint_text, points_earned: progress.score_earned })
})

// ─── ADMIN ROUTES ─────────────────────────────────────────
// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {}
  const stored = db.prepare("SELECT value FROM admin_settings WHERE key = 'admin_password'").get()
  if (password === stored?.value) {
    return res.json({ success: true, key: stored.value })
  }
  res.status(401).json({ error: 'Invalid password' })
})

// Full global leaderboard (Admin only)
app.get('/api/admin/leaderboard', adminAuth, (req, res) => {
  const teams = db.prepare('SELECT id, name, color, avatar, score, current_station, updated_at FROM teams WHERE is_active = 1 ORDER BY score DESC, current_station DESC').all()
  res.json(teams)
})

// Get all teams with full station matrix (Admin)
app.get('/api/admin/teams', adminAuth, (req, res) => {
  const teams = db.prepare('SELECT * FROM teams ORDER BY score DESC').all()
  const enriched = teams.map(team => {
    const progress = db.prepare(`
      SELECT tp.*, s.name as station_name, s.game_type, s.order_index
      FROM team_progress tp
      JOIN stations s ON s.id = tp.station_id
      WHERE tp.team_id = ?
      ORDER BY s.order_index
    `).all(team.id)
    return { ...team, progress }
  })
  res.json(enriched)
})

// Get all stations with configs (Admin)
app.get('/api/admin/stations', adminAuth, (req, res) => {
  const stations = db.prepare('SELECT * FROM stations ORDER BY order_index').all()
  const enriched = stations.map(station => {
    const config = db.prepare('SELECT config_json FROM game_configs WHERE station_id = ?').get(station.id)
    return { ...station, config: config ? JSON.parse(config.config_json) : {} }
  })
  res.json(enriched)
})

// Update station config (Admin)
app.put('/api/admin/stations/:stationId', adminAuth, (req, res) => {
  const stationId = parseInt(req.params.stationId)
  const { name, hint_text, points_reward, is_enabled, config } = req.body || {}

  if (name || hint_text !== undefined || points_reward !== undefined || is_enabled !== undefined) {
    const updates = []
    const values = []
    if (name) { updates.push('name = ?'); values.push(name) }
    if (hint_text !== undefined) { updates.push('hint_text = ?'); values.push(hint_text) }
    if (points_reward !== undefined) { updates.push('points_reward = ?'); values.push(points_reward) }
    if (is_enabled !== undefined) { updates.push('is_enabled = ?'); values.push(is_enabled ? 1 : 0) }
    values.push(stationId)
    db.prepare(`UPDATE stations SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  }

  if (config) {
    db.prepare(
      "INSERT OR REPLACE INTO game_configs (station_id, config_json, updated_at) VALUES (?, ?, datetime('now'))"
    ).run(stationId, JSON.stringify(config))
  }

  res.json({ success: true })
})

// Update team (Admin)
app.put('/api/admin/teams/:teamId', adminAuth, (req, res) => {
  const { name, color, avatar, score, is_active } = req.body || {}
  const updates = []
  const values = []
  if (name) { updates.push('name = ?'); values.push(name) }
  if (color) { updates.push('color = ?'); values.push(color) }
  if (avatar) { updates.push('avatar = ?'); values.push(avatar) }
  if (score !== undefined) { updates.push('score = ?'); values.push(score) }
  if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0) }
  updates.push("updated_at = datetime('now')")
  values.push(req.params.teamId)
  db.prepare(`UPDATE teams SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  res.json({ success: true })
})

// Reset a team's progress (Admin)
app.post('/api/admin/teams/:teamId/reset', adminAuth, (req, res) => {
  const teamId = req.params.teamId
  db.prepare("UPDATE team_progress SET status = 'locked', attempts_used = 0, score_earned = 0, started_at = NULL, completed_at = NULL, hint_unlocked = 0 WHERE team_id = ?").run(teamId)
  // Unlock station 1
  const firstStation = db.prepare('SELECT id FROM stations ORDER BY order_index LIMIT 1').get()
  if (firstStation) {
    db.prepare("UPDATE team_progress SET status = 'available' WHERE team_id = ? AND station_id = ?").run(teamId, firstStation.id)
  }
  db.prepare("UPDATE teams SET score = 0, current_station = 1, updated_at = datetime('now') WHERE id = ?").run(teamId)
  res.json({ success: true })
})

// Reset all teams (Admin)
app.post('/api/admin/reset-all', adminAuth, (req, res) => {
  db.prepare("UPDATE team_progress SET status = 'locked', attempts_used = 0, score_earned = 0, started_at = NULL, completed_at = NULL, hint_unlocked = 0").run()
  const firstStation = db.prepare('SELECT id FROM stations ORDER BY order_index LIMIT 1').get()
  if (firstStation) {
    db.prepare("UPDATE team_progress SET status = 'available' WHERE station_id = ?").run(firstStation.id)
  }
  db.prepare("UPDATE teams SET score = 0, current_station = 1, updated_at = datetime('now')").run()
  res.json({ success: true })
})

// Get game events telemetry (Admin)
app.get('/api/admin/events', adminAuth, (req, res) => {
  const events = db.prepare(`
    SELECT ge.*, t.name as team_name, s.name as station_name
    FROM game_events ge
    JOIN teams t ON t.id = ge.team_id
    JOIN stations s ON s.id = ge.station_id
    ORDER BY ge.created_at DESC
    LIMIT 100
  `).all()
  res.json(events)
})

// Update admin settings
app.put('/api/admin/settings', adminAuth, (req, res) => {
  const { key, value } = req.body || {}
  db.prepare('INSERT OR REPLACE INTO admin_settings (key, value) VALUES (?, ?)').run(key, value)
  res.json({ success: true })
})

// Get admin settings
app.get('/api/admin/settings', adminAuth, (req, res) => {
  const settings = db.prepare('SELECT * FROM admin_settings').all()
  const obj = {}
  settings.forEach(s => { obj[s.key] = s.value })
  res.json(obj)
})

// ─── ARRIVAL BONUS ENDPOINT ────────────────────────────────
// Admin awards physical arrival points (100 / 75 / 50 / 0)
// POST /api/admin/arrival-bonus
// Body: { stationId, arrivals: [{ teamId, rank }] }
// rank 1 → 100pts, rank 2 → 75pts, rank 3 → 50pts, rank 4+ → 0pts
app.post('/api/admin/arrival-bonus', adminAuth, (req, res) => {
  const { stationId, arrivals } = req.body || {}
  if (!stationId || !Array.isArray(arrivals)) {
    return res.status(400).json({ error: 'stationId and arrivals array are required' })
  }

  const RANK_POINTS = { 1: 100, 2: 75, 3: 50 }

  const results = []
  const updateTeamScore = db.prepare('UPDATE teams SET score = score + ? WHERE id = ?')
  const logEvent = db.prepare(
    "INSERT INTO game_events (team_id, station_id, event_type, points_delta, metadata) VALUES (?, ?, 'arrival_bonus', ?, ?)"
  )

  for (const { teamId, rank } of arrivals) {
    const points = RANK_POINTS[rank] || 0
    if (points > 0) {
      updateTeamScore.run(points, teamId)
    }
    logEvent.run(
      teamId,
      parseInt(stationId),
      points,
      JSON.stringify({ rank, bonus_type: 'physical_arrival', station_id: stationId })
    )
    results.push({ teamId, rank, points_awarded: points })
  }

  res.json({ success: true, results })
})



// ─── VALIDATION LOGIC ─────────────────────────────────────
function validateAnswer(gameType, config, answer, progress) {
  switch (gameType) {
    case 'zoom':
      return validateZoom(config, answer, progress)
    case 'memory_glitch':
      return validateMemoryGlitch(config, answer, progress)
    case 'find_difference':
      return validateFindDifference(config, answer, progress)
    case 'digital_escape':
      return validateDigitalEscape(config, answer, progress)
    case 'map_lying':
      return validateMapLying(config, answer, progress)
    case 'hidden_message':
      return validateHiddenMessage(config, answer, progress)
    case 'emoji_code':
      return validateEmojiCode(config, answer, progress)
    default:
      return { correct: false, message: 'Unknown game protocol' }
  }
}

function validateZoom(config, answer, progress) {
  const correctOption = config.options.find(o => o.correct)
  if (answer === correctOption?.id || answer === correctOption?.text) {
    return { correct: true, message: 'Spot Verified! Location confirmed.' }
  }
  const remaining = (config.max_attempts || 3) - progress.attempts_used
  if (remaining <= 0) {
    return { correct: false, message: 'All attempts used.', game_over: true }
  }
  return { correct: false, message: `Incorrect location. ${remaining} attempt(s) remaining.` }
}

function validateMemoryGlitch(config, answer, progress) {
  if (!answer || !answer.answers) return { correct: false, message: 'No answers provided' }
  let correctCount = 0
  for (const q of config.questions) {
    if (answer.answers[q.id] === q.correct) correctCount++
  }
  const required = config.required_correct || 4
  if (correctCount >= required) {
    return { correct: true, message: `Recall Confirmed! You scored ${correctCount}/${config.questions.length}.` }
  }
  const retriesLeft = (config.max_retries || 2) - progress.attempts_used
  if (retriesLeft <= 0) {
    return { correct: false, message: `Only ${correctCount}/${config.questions.length} correct. Retries exhausted.`, game_over: true, score: correctCount }
  }
  return { correct: false, message: `${correctCount}/${config.questions.length} correct. Need ${required}. ${retriesLeft} retry remaining.`, score: correctCount }
}

function validateFindDifference(config, answer, progress) {
  if (!answer || !answer.found_ids) return { correct: false, message: 'No differences provided' }
  const validIds = config.differences.map(d => d.id)
  const correctFound = answer.found_ids.filter(id => validIds.includes(id))
  const required = config.required_found || 5
  if (correctFound.length >= required) {
    return { correct: true, message: 'All 5 Anomalies Identified!' }
  }
  return { correct: false, message: `${correctFound.length}/${required} differences found. Keep scanning!`, found_count: correctFound.length }
}

function validateDigitalEscape(config, answer, progress) {
  if (!answer || !answer.puzzle_id) return { correct: false, message: 'No puzzle answer provided' }
  const puzzle = config.puzzles.find(p => p.id === answer.puzzle_id)
  if (!puzzle) return { correct: false, message: 'Invalid puzzle chamber' }

  const isCorrect = puzzle.answer.toLowerCase().trim() === String(answer.answer).toLowerCase().trim()
  if (isCorrect) {
    const puzzleIndex = config.puzzles.findIndex(p => p.id === answer.puzzle_id)
    const isLast = puzzleIndex === config.puzzles.length - 1
    if (isLast) {
      return { correct: true, message: 'All Security Chambers Bypassed!' }
    }
    return { correct: false, puzzle_solved: true, next_puzzle: config.puzzles[puzzleIndex + 1].id, message: 'Chamber Unlocked! Advancing...' }
  }
  return { correct: false, message: 'Cipher sequence invalid. Try again.' }
}

function validateMapLying(config, answer, progress) {
  if (!answer || answer.x === undefined || answer.y === undefined) return { correct: false, message: 'No coordinates selected' }
  const dist = Math.sqrt(Math.pow(answer.x - config.anomaly.x, 2) + Math.pow(answer.y - config.anomaly.y, 2))
  const tolerance = config.click_tolerance || 12
  if (dist <= tolerance) {
    return { correct: true, message: 'Cartographic Phantom Detected!' }
  }
  const remaining = (config.max_attempts || 5) - progress.attempts_used
  if (remaining <= 0) {
    return { correct: false, message: 'Max attempts reached.', game_over: true }
  }
  return { correct: false, message: `Sector verified normal. ${remaining} attempt(s) remaining.` }
}

function validateHiddenMessage(config, answer, progress) {
  if (!answer) return { correct: false, message: 'No answer provided' }
  
  if (answer.word) {
    if (answer.word.toUpperCase().trim() === config.final_word.toUpperCase().trim()) {
      return { correct: true, message: 'Hidden Message Decrypted!' }
    }
    return { correct: false, message: 'Incorrect codeword. Check your glyphs.' }
  }

  if (answer.click) {
    const { x, y } = answer.click
    const tolerance = config.click_tolerance || 8
    for (const el of config.elements) {
      const dist = Math.sqrt(Math.pow(x - el.x, 2) + Math.pow(y - el.y, 2))
      if (dist <= tolerance) {
        return { correct: false, element_found: true, element_id: el.id, letter: el.letter, message: `Found Glyph: ${el.letter}` }
      }
    }
    return { correct: false, element_found: false, message: 'Nothing here.' }
  }

  return { correct: false, message: 'Invalid payload' }
}

function validateEmojiCode(config, answer, progress) {
  if (!answer || !answer.round_id) return { correct: false, message: 'No answer provided' }
  const round = config.rounds.find(r => r.id === answer.round_id)
  if (!round) return { correct: false, message: 'Invalid round' }

  const isCorrect = round.answer.toLowerCase().trim() === String(answer.answer).toLowerCase().trim()
  if (isCorrect) {
    const roundIndex = config.rounds.findIndex(r => r.id === answer.round_id)
    const isLast = roundIndex === config.rounds.length - 1
    if (isLast) {
      return { correct: true, message: 'Emoji Cipher Solved!' }
    }
    return { correct: false, round_solved: true, next_round: config.rounds[roundIndex + 1].id, message: 'Correct! Next emoji code.' }
  }
  return { correct: false, message: 'Incorrect interpretation. Try again.' }
}

// ─── SANITIZE CONFIG (remove answers from frontend) ──────
function sanitizeGameConfig(gameType, config) {
  const sanitized = JSON.parse(JSON.stringify(config))

  switch (gameType) {
    case 'zoom':
      sanitized.options = sanitized.options?.map(o => ({ id: o.id, text: o.text }))
      break
    case 'memory_glitch':
      sanitized.questions = sanitized.questions?.map(q => ({ id: q.id, text: q.text, options: q.options }))
      break
    case 'find_difference':
      delete sanitized.differences
      break
    case 'digital_escape':
      sanitized.puzzles = sanitized.puzzles?.map(p => ({ id: p.id, type: p.type, title: p.title, prompt: p.prompt, options: p.options, hint: p.hint }))
      break
    case 'map_lying':
      delete sanitized.anomaly
      break
    case 'hidden_message':
      delete sanitized.elements
      sanitized.element_count = config.elements?.length || 0
      delete sanitized.final_word
      break
    case 'emoji_code':
      sanitized.rounds = sanitized.rounds?.map(r => ({ id: r.id, emojis: r.emojis, difficulty: r.difficulty, options: r.options, type: r.type }))
      break
  }

  return sanitized
}

// ─── START SERVER ─────────────────────────────────────────
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🎮 ENISo Game Server running on http://localhost:${PORT}\n`)
  })
}

export default app

