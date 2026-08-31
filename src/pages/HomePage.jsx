import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import SquadLock from '../components/SquadLock'
import QRScannerModal from '../components/QRScannerModal'
import LoadingSpinner from '../components/LoadingSpinner'

export default function HomePage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [myStats, setMyStats] = useState(null)
  const [lockedTeamId, setLockedTeamId] = useState(localStorage.getItem('eniso_locked_team_id'))
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)

  // Load teams and private stats
  const refreshStats = async (teamId) => {
    try {
      setLoading(true)
      const [allTeams, privateData] = await Promise.all([
        api.getTeams(),
        teamId ? api.getPrivateStats(teamId).catch(() => null) : null
      ])
      setTeams(allTeams)
      if (privateData) {
        setMyStats(privateData)
      }
    } catch (err) {
      console.error('Failed to load mission data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshStats(lockedTeamId)
  }, [lockedTeamId])

  const handleSquadLocked = (team) => {
    setLockedTeamId(team.id)
    refreshStats(team.id)
  }

  if (loading) return <LoadingSpinner text="Connecting to ENISo Command Feed..." />

  // If no squad locked yet -> Show 1-time selection screen
  if (!lockedTeamId || !myStats) {
    return <SquadLock teams={teams} onLockSuccess={handleSquadLocked} />
  }

  const currentStationNum = myStats.current_station || 1
  const completedAll = myStats.completed_count >= 7

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
            <span style={{ fontSize: 14 }}>{myStats.avatar || myStats.name.replace('Team ', 'T')}</span>
            <span>{myStats.name}</span>
          </div>
          <div className="stat-pill">
            <span style={{ color: 'var(--accent)' }}>{myStats.score} pts</span>
          </div>
        </div>
      </div>

      <div className="page-header">
        <h1 className="page-title">Mission Hub</h1>
        <p className="page-subtitle">Rank #{myStats.rank} • {myStats.completed_count}/7 Solved</p>
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
              Squad {myStats.name} (YOU)
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Progress: <strong>{myStats.completed_count} / 7</strong> Challenges Solved
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {myStats.score}
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

          {/* Quick Direct Link to active station for easy testing */}
          <button
            className="btn-secondary"
            onClick={() => navigate(`/station/${currentStationNum}`)}
            style={{ fontSize: 13 }}
          >
            Open Current Station #{currentStationNum} Directly
          </button>
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

        {/* Footer Nav */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 4px' }}>
          <Link to="/leaderboard" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
            Your Squad Standing
          </Link>
        </div>
      </div>

      {/* Camera QR Scanner Modal */}
      {showScanner && (
        <QRScannerModal onClose={() => setShowScanner(false)} />
      )}
    </div>
  )
}
