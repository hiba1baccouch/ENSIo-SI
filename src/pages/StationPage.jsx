import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function StationPage() {
  const { stationId } = useParams()
  const navigate = useNavigate()

  const [accessInfo, setAccessInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadAndRedirect() {
      try {
        setLoading(true)
        const lockedTeamId = localStorage.getItem('eniso_locked_team_id')
        if (!lockedTeamId) {
          navigate('/')
          return
        }

        const accessData = await api.getStationAccess(stationId, lockedTeamId)
        setAccessInfo(accessData)

        // ─── AUTO-REDIRECT: access granted → go straight to the quiz ───
        if (accessData?.access) {
          navigate(`/game/${stationId}/${lockedTeamId}`, { replace: true })
          return
        }
      } catch (err) {
        setError(err.message || 'Failed to verify station access')
      } finally {
        setLoading(false)
      }
    }

    loadAndRedirect()
  }, [stationId, navigate])

  if (loading) return <LoadingSpinner text="Scanning beacon, verifying access..." />

  // Only reached when access is DENIED
  return (
    <div className="app-screen animate-fadeIn" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="challenge-card" style={{ margin: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
        <h2 className="challenge-card__title" style={{ color: '#f87171' }}>
          Station Locked
        </h2>
        <p className="challenge-card__prompt" style={{ margin: '8px 0 20px' }}>
          {accessInfo?.reason || error || 'You cannot access this station yet. Complete the previous challenges first.'}
        </p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Return to Mission Hub →
        </button>
      </div>
    </div>
  )
}
