import React, { useState } from 'react'
import { api } from '../api'

const RANK_CONFIG = [
  { rank: 1, label: '🥇 1st to arrive', points: 100, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.5)' },
  { rank: 2, label: '🥈 2nd to arrive', points: 75,  color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.4)' },
  { rank: 3, label: '🥉 3rd to arrive', points: 50,  color: '#cd7c4f', bg: 'rgba(205,124,79,0.10)',  border: 'rgba(205,124,79,0.4)' },
]

export default function ArrivalScorer({ stations, teams }) {
  const [selectedStation, setSelectedStation] = useState('')
  const [assignments, setAssignments] = useState({ 1: '', 2: '', 3: '' }) // rank → teamId
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Teams already assigned to prevent duplicates
  const assignedTeamIds = Object.values(assignments).filter(Boolean)

  const assignTeam = (rank, teamId) => {
    // If this team is already at another rank, clear it there first
    const updated = { ...assignments }
    for (const r of [1, 2, 3]) {
      if (updated[r] === teamId && r !== rank) updated[r] = ''
    }
    updated[rank] = teamId
    setAssignments(updated)
    setResult(null)
  }

  const handleSubmit = async () => {
    if (!selectedStation) {
      setError('Please select a station first.')
      return
    }
    const filledRanks = Object.entries(assignments).filter(([, tid]) => !!tid)
    if (filledRanks.length === 0) {
      setError('Assign at least one team to a rank.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const arrivals = filledRanks.map(([rank, teamId]) => ({ teamId, rank: parseInt(rank) }))
      const res = await api.adminArrivalBonus(selectedStation, arrivals)
      setResult(res.results)
      // Reset for next use
      setAssignments({ 1: '', 2: '', 3: '' })
    } catch (err) {
      setError(err.message || 'Failed to submit arrival bonus')
    } finally {
      setLoading(false)
    }
  }

  const teamName = (teamId) => teams.find(t => t.id === teamId)?.name || teamId

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <div>
          <h2 className="adm-section-title">🏃 Physical Arrival Scorer</h2>
          <p className="adm-section-sub">
            Award bonus points to the squads who physically arrive at a station first
          </p>
        </div>
      </div>

      {/* How it works banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(139,92,246,0.06))',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: 12,
        padding: '14px 18px',
        marginBottom: 20,
        display: 'flex',
        gap: 20,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 700 }}>HOW IT WORKS</span>
        {RANK_CONFIG.map(r => (
          <span key={r.rank} style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
            {r.label}
            <span style={{
              marginLeft: 6,
              background: r.bg,
              border: `1px solid ${r.border}`,
              color: r.color,
              padding: '2px 8px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 800
            }}>
              +{r.points} pts
            </span>
          </span>
        ))}
        <span style={{ fontSize: 13, color: '#94a3b8' }}>All others → +0 pts</span>
      </div>

      <div className="adm-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Step 1: Select station */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Step 1 — Select Station
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {stations.map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => { setSelectedStation(String(st.id)); setResult(null); setError(null) }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: selectedStation === String(st.id)
                    ? '2px solid #4f46e5'
                    : '1.5px solid #e2e8f0',
                  background: selectedStation === String(st.id)
                    ? 'rgba(79,70,229,0.08)'
                    : '#fff',
                  color: selectedStation === String(st.id) ? '#4f46e5' : '#334155',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                #{st.id} {st.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Assign teams to ranks */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            Step 2 — Assign Arrival Order
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {RANK_CONFIG.map(({ rank, label, points, color, bg, border }) => (
              <div
                key={rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  borderRadius: 14,
                  background: assignments[rank] ? bg : '#f8fafc',
                  border: `1.5px solid ${assignments[rank] ? border : '#e2e8f0'}`,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Rank badge */}
                <div style={{ minWidth: 130 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color }}>{label}</div>
                  <div style={{
                    display: 'inline-block',
                    marginTop: 2,
                    background: bg,
                    border: `1px solid ${border}`,
                    color,
                    padding: '1px 8px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 800
                  }}>
                    +{points} pts
                  </div>
                </div>

                {/* Team selector */}
                <select
                  value={assignments[rank]}
                  onChange={(e) => assignTeam(rank, e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${assignments[rank] ? border : '#e2e8f0'}`,
                    background: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="">— Not assigned —</option>
                  {teams.map(team => (
                    <option
                      key={team.id}
                      value={team.id}
                      disabled={assignedTeamIds.includes(team.id) && assignments[rank] !== team.id}
                    >
                      {team.avatar ? `${team.avatar} ` : ''}{team.name}
                      {assignedTeamIds.includes(team.id) && assignments[rank] !== team.id ? ' (already ranked)' : ''}
                    </option>
                  ))}
                </select>

                {/* Clear button */}
                {assignments[rank] && (
                  <button
                    type="button"
                    onClick={() => assignTeam(rank, '')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: 18,
                      cursor: 'pointer',
                      padding: 4,
                      lineHeight: 1
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="adm-alert adm-alert--error">{error}</div>
        )}

        {/* Result */}
        {result && (
          <div style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 12,
            padding: '16px 20px'
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981', marginBottom: 10 }}>
              ✅ Arrival bonuses awarded successfully for Station {selectedStation}!
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.map(r => (
                <div key={r.teamId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#334155' }}>
                  <span><strong>{teamName(r.teamId)}</strong> — Rank #{r.rank}</span>
                  <span style={{ fontWeight: 800, color: r.points_awarded > 0 ? '#10b981' : '#94a3b8' }}>
                    +{r.points_awarded} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          className="adm-btn adm-btn--primary"
          onClick={handleSubmit}
          disabled={loading || !selectedStation}
          style={{ fontSize: 15, padding: '14px 0', borderRadius: 12 }}
        >
          {loading ? 'Awarding Points...' : '🏆 Confirm & Award Arrival Points'}
        </button>
      </div>
    </div>
  )
}
