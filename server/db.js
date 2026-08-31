import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'

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
  `)

  // Check if we need to seed or update teams to 10
  const teamCount = db.prepare('SELECT COUNT(*) as count FROM teams').get().count
  if (teamCount < 10) {
    seedDefaultData()
  }
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

  const defaultStations = [
    { id: 1, name: 'ZOOM', game_type: 'zoom', order_index: 1, hint_text: 'The next step is where hundreds of students can listen to a single voice.', points_reward: 100 },
    { id: 2, name: 'MEMORY GLITCH', game_type: 'memory_glitch', order_index: 2, hint_text: 'Look for the place where knowledge is stored in silence — rows upon rows.', points_reward: 100 },
    { id: 3, name: 'FIND THE DIFFERENCE', game_type: 'find_difference', order_index: 3, hint_text: 'Head to where the ground meets the sky and students gather between classes.', points_reward: 100 },
    { id: 4, name: 'DIGITAL ESCAPE', game_type: 'digital_escape', order_index: 4, hint_text: 'The next clue is hidden where machines come to life and ideas take shape.', points_reward: 100 },
    { id: 5, name: 'THE MAP IS LYING', game_type: 'map_lying', order_index: 5, hint_text: 'Seek the place where equations fill the air and chalk dust settles.', points_reward: 100 },
    { id: 6, name: 'HIDDEN MESSAGE', game_type: 'hidden_message', order_index: 6, hint_text: 'Your next destination is where futures are decided — the administration wing.', points_reward: 100 },
    { id: 7, name: 'ENISo EMOJI CODE', game_type: 'emoji_code', order_index: 7, hint_text: 'Congratulations! Return to the main gathering point for the final ceremony.', points_reward: 100 },
  ]

  const insertStation = db.prepare(
    'INSERT INTO stations (id, name, game_type, order_index, hint_text, points_reward, next_station_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  for (let i = 0; i < defaultStations.length; i++) {
    const s = defaultStations[i]
    const nextId = i < defaultStations.length - 1 ? defaultStations[i + 1].id : null
    insertStation.run(s.id, s.name, s.game_type, s.order_index, s.hint_text, s.points_reward, nextId)
  }

  // Default game configs
  const defaultConfigs = {
    1: {
      image: '/placeholders/zoom_image.jpg',
      options: [
        { id: 'a', text: 'Main Amphitheater', correct: true },
        { id: 'b', text: 'Library Entrance', correct: false },
        { id: 'c', text: 'Cafeteria Wing', correct: false },
        { id: 'd', text: 'Robotics Lab', correct: false },
      ],
      max_attempts: 3,
      zoom_level: 4,
    },
    2: {
      image: '/placeholders/memory_image.jpg',
      display_time: 12,
      questions: [
        { id: 'q1', text: 'What color was the door in the image?', options: ['Red', 'Blue', 'Green', 'Yellow'], correct: 0 },
        { id: 'q2', text: 'How many windows were visible?', options: ['2', '3', '4', '5'], correct: 2 },
        { id: 'q3', text: 'What was written on the sign?', options: ['ENISo', 'Exit', 'Welcome', 'Library'], correct: 0 },
        { id: 'q4', text: 'Which direction was the arrow pointing?', options: ['Left', 'Right', 'Up', 'Down'], correct: 1 },
        { id: 'q5', text: 'What object was on the table?', options: ['Book', 'Laptop', 'Plant', 'Cup'], correct: 2 },
      ],
      required_correct: 4,
      max_retries: 2,
    },
    3: {
      image_original: '/placeholders/difference_original.jpg',
      image_modified: '/placeholders/difference_modified.jpg',
      differences: [
        { id: 'd1', x: 15, y: 20, radius: 5, label: 'Missing window' },
        { id: 'd2', x: 45, y: 35, radius: 5, label: 'Changed color' },
        { id: 'd3', x: 70, y: 50, radius: 5, label: 'Extra tree' },
        { id: 'd4', x: 30, y: 70, radius: 5, label: 'Missing sign' },
        { id: 'd5', x: 80, y: 15, radius: 5, label: 'Different flag' },
      ],
      required_found: 5,
      click_tolerance: 10,
    },
    4: {
      puzzles: [
        {
          id: 'p1',
          type: 'logical_sequence',
          title: 'Logical Sequence',
          prompt: 'What comes next in the sequence: 2, 6, 12, 20, 30, ?',
          answer: '42',
          hint: 'Look at the differences between consecutive numbers (+4, +6, +8, +10...).',
        },
        {
          id: 'p2',
          type: 'visual_pattern',
          title: 'Visual Pattern',
          prompt: 'Decode this pattern: ▲●▲▲●●▲▲▲●●●?',
          answer: '▲▲▲▲',
          options: ['▲▲▲▲', '●●●●', '▲●▲●', '●▲●▲'],
          hint: 'Count how many of each shape appear in progressive groups.',
        },
        {
          id: 'p3',
          type: 'scrambled_word',
          title: 'Scrambled Message',
          prompt: 'Unscramble: NOIITNRGAET KEWE',
          answer: 'INTEGRATION WEEK',
          hint: 'It is the official name of this campus event.',
        },
      ],
    },
    5: {
      map_image: '/placeholders/campus_map.jpg',
      anomaly: { x: 55, y: 40, radius: 8, description: 'This building does not exist on the real campus.' },
      click_tolerance: 12,
      max_attempts: 5,
    },
    6: {
      image: '/placeholders/hidden_message_image.jpg',
      elements: [
        { id: 'e1', x: 10, y: 25, radius: 4, letter: 'E' },
        { id: 'e2', x: 35, y: 55, radius: 4, letter: 'N' },
        { id: 'e3', x: 60, y: 15, radius: 4, letter: 'I' },
        { id: 'e4', x: 80, y: 70, radius: 4, letter: 'S' },
        { id: 'e5', x: 45, y: 85, radius: 4, letter: 'O' },
      ],
      final_word: 'ENISO',
      click_tolerance: 8,
    },
    7: {
      rounds: [
        {
          id: 'r1',
          emojis: '🏫📐✏️🎓',
          difficulty: 'easy',
          answer: 'Engineering School',
          options: ['Engineering School', 'Art Museum', 'Hospital', 'Library'],
          type: 'multiple_choice',
        },
        {
          id: 'r2',
          emojis: '☕📚🤫🪑',
          difficulty: 'medium',
          answer: 'Library',
          options: ['Cafeteria', 'Library', 'Classroom', 'Office'],
          type: 'multiple_choice',
        },
        {
          id: 'r3',
          emojis: '🔬⚗️🧪🥽',
          difficulty: 'hard',
          answer: 'Laboratory',
          type: 'text_input',
        },
      ],
      required_correct: 2,
    },
  }

  const insertConfig = db.prepare(
    'INSERT INTO game_configs (station_id, config_json) VALUES (?, ?)'
  )
  for (const [stationId, config] of Object.entries(defaultConfigs)) {
    insertConfig.run(parseInt(stationId), JSON.stringify(config))
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
