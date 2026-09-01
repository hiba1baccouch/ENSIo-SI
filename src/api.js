/* ─── ENISo API Client ─── */
const API_BASE = '/api'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  }
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }
  const res = await fetch(url, config)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

function adminHeaders() {
  const key = sessionStorage.getItem('admin_key')
  return key ? { 'x-admin-key': key } : {}
}

export const api = {
  // Teams (1-time onboarding)
  getTeams: () => request('/teams'),
  getTeam: (teamId) => request(`/teams/${teamId}`),
  getPrivateStats: (teamId) => request(`/teams/${teamId}/private-stats`),
  getLeaderboard: () => request('/leaderboard'),

  // Stations (QR Access)
  getStation: (stationId) => request(`/stations/${stationId}`),
  getStationAccess: (stationId, teamId) => request(`/stations/${stationId}/access/${teamId}`),

  // Game Engine & Validation
  startGame: (teamId, stationId) => request('/game/start', { method: 'POST', body: { teamId, stationId } }),
  validateAnswer: (teamId, stationId, gameType, answer) =>
    request('/game/validate', { method: 'POST', body: { teamId, stationId, gameType, answer } }),
  getHint: (stationId, teamId) => request(`/game/hint/${stationId}/${teamId}`),

  // Admin
  adminLogin: (password) => request('/admin/login', { method: 'POST', body: { password } }),
  adminGetLeaderboard: () => request('/admin/leaderboard', { headers: adminHeaders() }),
  adminGetTeams: () => request('/admin/teams', { headers: adminHeaders() }),
  adminGetStations: () => request('/admin/stations', { headers: adminHeaders() }),
  adminUpdateStation: (stationId, data) =>
    request(`/admin/stations/${stationId}`, { method: 'PUT', body: data, headers: adminHeaders() }),
  adminUpdateTeam: (teamId, data) =>
    request(`/admin/teams/${teamId}`, { method: 'PUT', body: data, headers: adminHeaders() }),
  adminResetTeam: (teamId) =>
    request(`/admin/teams/${teamId}/reset`, { method: 'POST', headers: adminHeaders() }),
  adminResetAll: () => request('/admin/reset-all', { method: 'POST', headers: adminHeaders() }),
  adminGetEvents: () => request('/admin/events', { headers: adminHeaders() }),
  adminGetSettings: () => request('/admin/settings', { headers: adminHeaders() }),
  adminUpdateSetting: (key, value) =>
    request('/admin/settings', { method: 'PUT', body: { key, value }, headers: adminHeaders() }),
  adminArrivalBonus: (stationId, arrivals) =>
    request('/admin/arrival-bonus', { method: 'POST', body: { stationId, arrivals }, headers: adminHeaders() }),
}
