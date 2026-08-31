import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function StationPage() {
  const { stationId } = useParams()
  const navigate = useNavigate()

  const [station, setStation] = useState(null)
  const [team, setTeam] = useState(null)
  const [accessInfo, setAccessInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadStationAndVerify() {
      try {
        setLoading(true)
        const lockedTeamId = localStorage.getItem('eniso_locked_team_id')
        if (!lockedTeamId) {
          // Send to squad onboarding
          navigate('/')
          return
        }

        const [stData, tmData, accessData] = await Promise.all([
          api.getStation(stationId),
          api.getTeam(lockedTeamId),
          api.getStationAccess(stationId, lockedTeamId)
        ])

        setStation(stData)
        setTeam(tmData)
        setAccessInfo(accessData)
      } catch (err) {
        setError(err.message || 'Beacon clearance verification failed')
      } finally {
        setLoading(false)
      }
    }

    loadStationAndVerify()
  }, [stationId, navigate])

  if (loading) return <LoadingSpinner text="Authenticating Station Beacon Clearance..." />

  if (error || !station || !team) {
    return (
      <div className="app-screen justify-center items-center" style={{ padding: 20 }}>
        <div className="challenge-card text-center">
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Beacon Error</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '8px 0 16px' }}>
            {error || 'Unable to authenticate this station QR code.'}
          </p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Return to Mission Hub
          </button>
        </div>
      </div>
    )
  }

  const potentialScore = accessInfo?.potential_points || 100

  return (
    <div className="app-screen animate-fadeIn">
      {/* ─── Modern App Header ─── */}
      <div className="app-header">
        <div className="app-header__brand">
          <span className="app-header__title">Station {station.id}</span>
          <span className="app-header__sub">{station.name}</span>
        </div>
        <div className="app-header__stats">
          <div className="stat-pill">
            <span style={{ fontSize: 14 }}>{team.avatar || team.name.replace('Team ', 'T')}</span>
            <span>{team.name}</span>
          </div>
          <div className="stat-pill">
            <span style={{ color: 'var(--accent)' }}>+{potentialScore} pts</span>
          </div>
        </div>
      </div>

      <div className="page-header text-center">
        <h1 className="page-title">Beacon Scanned</h1>
        <p className="page-subtitle">Verifying Clearance Level...</p>
      </div>

      <div style={{ padding: '0 16px 24px', display: 'flex', flex: 1, flexDirection: 'column', gap: 16 }}>
        {accessInfo?.access ? (
          <div className="challenge-card animate-fadeInUp" style={{ margin: 0, textAlign: 'center' }}>
            <h2 className="challenge-card__title">
              Clearance Authorized
            </h2>
            <p className="challenge-card__prompt" style={{ marginTop: 4 }}>
              {accessInfo.status === 'completed'
                ? 'Your squad already completed this challenge. You may review the unlocked physical clue.'
                : `Your squad is cleared to begin Challenge ${station.id} (${station.game_type?.toUpperCase().replace('_', ' ')}).`}
            </p>

            <div
              style={{
                background: 'var(--bg-pill)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                margin: '8px 0',
                display: 'flex',
                justifyContent: 'space-around',
                fontSize: 13,
                fontFamily: 'var(--font-mono)'
              }}
            >
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>ATTEMPT:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>#{(accessInfo.attempts_used || 0) + 1}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>VALUE:</span>{' '}
                <strong style={{ color: '#34d399' }}>+{potentialScore} pts</strong>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => navigate(`/game/${station.id}/${team.id}`)}
              style={{ fontSize: 17 }}
            >
              {accessInfo.status === 'completed' ? 'Reopen Station & Hint →' : 'Initialize Challenge →'}
            </button>
          </div>
        ) : (
          <div className="challenge-card animate-fadeInUp" style={{ margin: 0, textAlign: 'center' }}>
            <h2 className="challenge-card__title" style={{ color: '#f87171' }}>
              Station Locked
            </h2>
            <p className="challenge-card__prompt" style={{ margin: '8px 0 16px' }}>
              {accessInfo?.reason || 'You cannot access this station yet. Solve your preceding stations first.'}
            </p>

            <button
              className="btn-primary"
              onClick={() => navigate('/')}
            >
              Return to Mission Hub →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
