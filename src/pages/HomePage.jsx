import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { readTeamBackup, writeTeamBackup, mergeTeamStats } from '../teamBackup'
import SquadLock from '../components/SquadLock'
import QRScannerModal from '../components/QRScannerModal'
import LoadingSpinner from '../components/LoadingSpinner'

export default function HomePage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [lockedTeamId, setLockedTeamId] = useState(() => localStorage.getItem('eniso_locked_team_id'))
  const [myStats, setMyStats] = useState(() => {
    try {
      const saved = localStorage.getItem('eniso_cached_my_stats')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)

  // Load teams and private stats
  const refreshStats = async (teamId, silent = false) => {
    try {
      if (!silent) setLoading(true)
      const backup = readTeamBackup(teamId)
      if (teamId && backup && (backup.score > 0 || (backup.progress || []).length > 0)) {
        await api.syncTeam(teamId, backup).catch(() => null)
      }
      const [allTeams, privateData, teamData] = await Promise.all([
        api.getTeams().catch(() => []),
        teamId ? api.getPrivateStats(teamId).catch(() => null) : null,
        teamId ? api.getTeam(teamId).catch(() => null) : null,
      ])
      if (allTeams && allTeams.length > 0) {
        setTeams(allTeams)
      }
      if (privateData || teamData) {
        const merged = mergeTeamStats(
          {
            ...(privateData || {}),
            ...(teamData || {}),
            completed_count: privateData?.completed_count ?? backup?.completed_count ?? 0,
          },
          backup
        )
        setMyStats(merged)
        writeTeamBackup(merged)
      }
    } catch (err) {
      console.error('Failed to load mission data', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    refreshStats(lockedTeamId)
    const interval = setInterval(() => refreshStats(lockedTeamId, true), 10000)
    return () => clearInterval(interval)
  }, [lockedTeamId])

  const handleSquadLocked = (team) => {
    localStorage.setItem('eniso_locked_team_id', team.id)
    setLockedTeamId(team.id)

    // Keep any already-saved score if this device re-opens lock flow for the same squad
    const existing = readTeamBackup(team.id)
    const initialStats = {
      id: team.id,
      name: team.name,
      color: team.color,
      avatar: team.avatar || '⚡',
      current_station: existing?.current_station || 1,
      score: existing?.score || 0,
      completed_count: existing?.completed_count || 0,
      progress: existing?.progress || [],
    }
    setMyStats(initialStats)
    writeTeamBackup(initialStats)

    refreshStats(team.id)
  }

  // Only show full-screen spinner if we have neither cached stats nor squad locked
  if (loading && !lockedTeamId && !myStats) {
    return <LoadingSpinner text="Connecting to ENISo Command Feed..." />
  }

  // If no squad locked yet -> Show 1-time selection screen
  if (!lockedTeamId) {
    return <SquadLock teams={teams} onLockSuccess={handleSquadLocked} />
  }

  // Fallback stats while first sync finishes
  const stats = myStats || {
    id: lockedTeamId,
    name: localStorage.getItem('eniso_locked_team_name') || 'Squad',
    avatar: localStorage.getItem('eniso_locked_team_avatar') || '⚡',
    score: 0,
    current_station: 1,
    completed_count: 0
  }

  const currentStationNum = stats.current_station || 1
  const completedAll = (stats.completed_count || 0) >= 7

  return (
    <div className="app-screen animate-fadeIn">
      {/* ─── Modern App Header ─── */}
      <div className="app-header">
        <div className="app-header__brand">
          <span className="app-header__title">ENISo Exploration</span>
          <span className="app-header__sub">Campus QR Quest</span>
        </div>
        <div className="app-header__stats">
          <div className="stat-pill">
            <span style={{ fontSize: 14 }}>{stats.avatar || (stats.name ? stats.name.replace('Team ', 'T') : '⚡')}</span>
            <span>{stats.name}</span>
          </div>
          <div className="stat-pill">
            <span style={{ color: 'var(--accent)' }}>{stats.score || 0} pts</span>
          </div>
        </div>
      </div>

      <div className="page-header">
        <h1 className="page-title">Mission Hub</h1>
        <p className="page-subtitle">{stats.completed_count || 0} / 7 Challenges Solved</p>
      </div>

      {/* ─── Mission Hub & QR Scanner Trigger Card ─── */}
      <div className="mission-hub">
        {/* Private Stats Snapshot */}
        <div className="rank-pill-card">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-light)', fontFamily: 'var(--font-mono)' }}>
              SQUAD STATUS (CONFIDENTIAL)
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>
              Squad {stats.name} (YOU)
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Progress: <strong>{stats.completed_count || 0} / 7</strong> Challenges Solved
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {stats.score || 0}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>
              TOTAL POINTS
            </div>
          </div>
        </div>

        {/* Current Objective Card */}
        <div className="challenge-card" style={{ margin: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                background: completedAll ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                color: completedAll ? 'var(--success)' : 'var(--accent-light)',
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 8
              }}
            >
              {completedAll ? 'MISSION ACCOMPLISHED' : `ACTIVE TARGET: STATION ${currentStationNum}`}
            </div>

            <h2 className="challenge-card__title">
              {completedAll ? 'All Stations Conquered!' : `Find Station ${currentStationNum} QR Code`}
            </h2>

            <p className="challenge-card__prompt" style={{ marginTop: 6 }}>
              {completedAll 
                ? 'Your squad has solved all 7 campus challenges! Return to the central ceremony.'
                : `Navigate to your next physical location on campus and scan the posted QR code to unlock Challenge ${currentStationNum}.`}
            </p>
          </div>

          {/* Big QR Scanner Button */}
          {!completedAll && (
            <button
              className="btn-primary"
              onClick={() => setShowScanner(true)}
              style={{ fontSize: 17 }}
            >
              Scan Station QR Code
            </button>
          )}
        </div>

        {/* Progressive Scoring Rule Card */}
        <div className="challenge-card" style={{ margin: 0, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginBottom: 8, letterSpacing: '0.05em' }}>
            SCORING SYSTEM
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>1st Try</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>100</div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>pts</div>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '10px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa' }}>2nd Try</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>75</div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>pts</div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24' }}>3rd Try</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>50</div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>pts</div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '10px 4px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171' }}>4th+</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>0</div>
              <div style={{ fontSize: 9, color: 'var(--text-secondary)' }}>pts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera QR Scanner Modal */}
      {showScanner && (
        <QRScannerModal onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}
