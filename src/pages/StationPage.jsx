import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'

export default function StationPage() {
  const { stationId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    let lockedTeamId = localStorage.getItem('eniso_locked_team_id')
    if (!lockedTeamId) {
      lockedTeamId = 'team-1'
      localStorage.setItem('eniso_locked_team_id', 'team-1')
      localStorage.setItem('eniso_locked_team_name', 'Team1')
      localStorage.setItem('eniso_locked_team_color', '#4f46e5')
    }

    // Instantly enter game for scanned station (free-roam mode)
    navigate(`/game/${stationId}/${lockedTeamId}`, { replace: true })
  }, [stationId, navigate])

  return <LoadingSpinner text="Scanning beacon, entering quiz station..." />
}
