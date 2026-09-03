import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function StationPage() {
  const { stationId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(null) // { reason } only when truly locked

  useEffect(() => {
    async function loadAndRedirect() {
      try {
        setLoading(true)
        const lockedTeamId = localStorage.getItem('eniso_locked_team_id')
        if (!lockedTeamId) {
          navigate('/')
          return
        }

        let shouldGrant = true
        let denialReason = null

        try {
          const accessData = await api.getStationAccess(stationId, lockedTeamId)
          if (accessData?.access === false) {
            // Only block if server explicitly says false (sequential mode locked)
            shouldGrant = false
            denialReason = accessData.reason
          }
        } catch {
          // If access check fails (e.g. no progress record on cold-start DB),
          // default to granting access — free-roam mode
          shouldGrant = true
        }

        if (shouldGrant) {
          navigate(`/game/${stationId}/${lockedTeamId}`, { replace: true })
        } else {
          setDenied({ reason: denialReason })
          setLoading(false)
        }
      } catch (err) {
        console.error('Station access error:', err)
        // On any error, still try to load the game
        const lockedTeamId = localStorage.getItem('eniso_locked_team_id')
        if (lockedTeamId) {
          navigate(`/game/${stationId}/${lockedTeamId}`, { replace: true })
        } else {
          navigate('/')
        }
      }
    }

    loadAndRedirect()
  }, [stationId, navigate])

  if (loading) return <LoadingSpinner text="Scanning beacon, verifying access..." />

  // Only reached when access is explicitly DENIED (sequential mode)
  return (
    <div className="app-screen animate-fadeIn" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="challenge-card" style={{ margin: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
        <h2 className="challenge-card__title" style={{ color: '#f87171' }}>
          Station Locked
        </h2>
        <p className="challenge-card__prompt" style={{ margin: '8px 0 20px' }}>
          {denied?.reason || 'Complete previous challenges first.'}
        </p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Return to Mission Hub →
        </button>
      </div>
    </div>
  )
}
