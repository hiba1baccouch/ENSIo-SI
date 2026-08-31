import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function LeaderboardPage() {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard()
      setTeams(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to refresh leaderboard', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 8000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <LoadingSpinner text="Fetching Live Leaderboard Standings..." />

  return (
    <div className="page animate-fadeIn" style={{ gap: 'var(--sp-5)', paddingBottom: 'var(--sp-12)' }}>
      {/* Header */}
      <div className="card card--accent" style={{ textAlign: 'center', padding: 'var(--sp-6) var(--sp-4)' }}>
        <div className="badge badge--accent" style={{ marginBottom: 'var(--sp-2)' }}>
          LIVE TOURNAMENT STANDINGS
        </div>
        <h1 className="heading-2">Mission Leaderboard</h1>
        <p className="text-secondary text-xs" style={{ marginTop: 'var(--sp-2)' }}>
          Updated at {lastUpdated.toLocaleTimeString()} • Auto-syncing every 8s
        </p>

        <div className="flex justify-center gap-2" style={{ marginTop: 'var(--sp-4)' }}>
          <button className="btn btn--secondary" onClick={fetchLeaderboard}>
            Refresh Now
          </button>
          <Link to="/" className="btn btn--ghost">
            Home
          </Link>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="flex flex-col gap-3">
        {teams.map((team, idx) => {
          const rank = idx + 1
          const rankClass = rank === 1 
            ? 'leaderboard-rank--gold' 
            : rank === 2 
              ? 'leaderboard-rank--silver' 
              : rank === 3 
                ? 'leaderboard-rank--bronze' 
                : ''

          return (
            <div
              key={team.id}
              className="card leaderboard-row animate-fadeInUp"
              style={{
                borderLeft: `4px solid ${team.color}`,
                animationDelay: `${idx * 0.05}s`
              }}
            >
              <div className={`leaderboard-rank ${rankClass}`}>
                #{rank}
              </div>

              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: team.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  flexShrink: 0
                }}
              >
                {team.avatar || team.name.replace('Team ', 'T')}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{team.name}</span>
                </div>
                <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                  <span className="text-xs text-secondary font-mono">
                    Station {team.current_station || 1} / 7
                  </span>
                  <div className="progress" style={{ width: 80, height: 4 }}>
                    <div
                      className="progress__fill"
                      style={{
                        width: `${Math.min(((team.current_station || 1) / 7) * 100, 100)}%`,
                        background: team.color
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--accent-light)', fontFamily: 'var(--font-mono)' }}>
                  {team.score}
                </div>
                <div className="text-xs text-secondary">POINTS</div>
              </div>
            </div>
          )
        })}

        {teams.length === 0 && (
          <div className="card text-center" style={{ padding: 'var(--sp-8)' }}>
            <p className="text-secondary">No team records found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
