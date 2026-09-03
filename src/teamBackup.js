const STATS_KEY = 'eniso_cached_my_stats'

function backupKey(teamId) {
  return `eniso_team_backup_${teamId}`
}

export function readTeamBackup(teamId) {
  if (!teamId) return null
  try {
    const raw = localStorage.getItem(backupKey(teamId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeTeamBackup(team) {
  if (!team?.id || typeof localStorage === 'undefined') return
  const snapshot = {
    id: team.id,
    name: team.name,
    color: team.color,
    avatar: team.avatar,
    score: team.score || 0,
    current_station: team.current_station || 1,
    completed_count: team.completed_count ?? (team.progress || []).filter((p) => p.status === 'completed').length,
    progress: team.progress || [],
  }
  localStorage.setItem(backupKey(team.id), JSON.stringify(snapshot))
  localStorage.setItem(STATS_KEY, JSON.stringify(snapshot))
}

export function mergeTeamStats(server, backup) {
  if (!server) return backup
  if (!backup || backup.id !== server.id) return server
  const score = Math.max(server.score || 0, backup.score || 0)
  const current_station = Math.max(server.current_station || 1, backup.current_station || 1)
  const completed_count = Math.max(server.completed_count || 0, backup.completed_count || 0)
  return { ...server, score, current_station, completed_count }
}
