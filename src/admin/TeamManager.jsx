import React, { useState } from 'react'
import { api } from '../api'

export default function TeamManager({ teams, onRefresh }) {
  const [editingTeam, setEditingTeam] = useState(null)
  const [formData, setFormData] = useState({ name: '', color: '#4f46e5', avatar: '', score: 0, is_active: true })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleEditClick = (team) => {
    setEditingTeam(team)
    setFormData({ name: team.name, color: team.color, avatar: team.avatar || '', score: team.score, is_active: team.is_active !== false })
  }

  const handleSaveTeam = async (e) => {
    e.preventDefault()
    if (!editingTeam || loading) return
    try {
      setLoading(true)
      await api.adminUpdateTeam(editingTeam.id, {
        name: formData.name,
        color: formData.color,
        avatar: formData.avatar,
        score: parseInt(formData.score) || 0,
        is_active: formData.is_active
      })
      setEditingTeam(null)
      showMsg('success', `"${formData.name}" updated successfully.`)
      onRefresh()
    } catch (err) {
      showMsg('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetTeam = async (team) => {
    if (!window.confirm(`Reset all progress and score for ${team.name}?`)) return
    try {
      setLoading(true)
      await api.adminResetTeam(team.id)
      showMsg('success', `${team.name} reset to Station 1.`)
      onRefresh()
    } catch (err) {
      showMsg('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetAll = async () => {
    if (!window.confirm('CRITICAL: Reset ALL teams, scores, and station progress? This cannot be undone.')) return
    try {
      setLoading(true)
      await api.adminResetAll()
      showMsg('success', 'All teams and stations reset.')
      onRefresh()
    } catch (err) {
      showMsg('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <div>
          <h2 className="adm-section-title">Teams</h2>
          <p className="adm-section-sub">{teams.length} registered teams</p>
        </div>
        <div className="adm-actions">
          <button className="adm-btn adm-btn--secondary adm-btn--sm" onClick={onRefresh}>Refresh</button>
          <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={handleResetAll}>Reset All Teams</button>
        </div>
      </div>

      {message && (
        <div className={`adm-alert adm-alert--${message.type}`}>{message.text}</div>
      )}

      <div className="adm-card">
        {teams.map((team, idx) => {
          const statusCounts = { completed: 0, available: 0, locked: 0 }
          ;(team.progress || []).forEach(p => { statusCounts[p.status] = (statusCounts[p.status] || 0) + 1 })
          return (
            <div
              key={team.id}
              className="adm-station-row"
              style={{ borderLeft: `3px solid ${team.color}` }}
            >
              <div className="adm-station-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  {/* Avatar circle */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: team.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0
                  }}>
                    {team.avatar || team.name.replace('Team ', 'T')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{team.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                      {team.score} pts &nbsp;·&nbsp; Station {team.current_station || 1}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button className="adm-btn adm-btn--secondary adm-btn--sm" onClick={() => handleEditClick(team)}>Edit</button>
                  <button className="adm-btn adm-btn--danger adm-btn--sm" onClick={() => handleResetTeam(team)}>Reset</button>
                </div>
              </div>

              {/* Progress dots */}
              <div style={{ padding: '0 16px 12px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', marginBottom: 6, letterSpacing: '0.05em' }}>STATION PROGRESS</div>
                <div className="adm-progress-dots">
                  {(team.progress || []).map(p => {
                    let cls = 'adm-dot--locked', label = '—'
                    if (p.status === 'completed') { cls = 'adm-dot--done'; label = p.score_earned + 'p' }
                    else if (p.status === 'in_progress') { cls = 'adm-dot--active'; label = '...' }
                    else if (p.status === 'available') { cls = 'adm-dot--open'; label = 'open' }
                    return (
                      <div key={p.station_id} className={`adm-dot ${cls}`} title={`S${p.station_id}: ${p.status}, ${p.attempts_used} attempts`}>
                        <span>S{p.station_id}</span>
                        <span style={{ fontSize: 8, fontWeight: 500 }}>{label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Modal */}
      {editingTeam && (
        <div className="adm-overlay" onClick={(e) => e.target === e.currentTarget && setEditingTeam(null)}>
          <div className="adm-modal">
            <div className="adm-modal__header">
              <h3 className="adm-modal__title">Edit — {editingTeam.name}</h3>
              <p className="adm-modal__sub">Update team identity and scoring</p>
            </div>
            <form onSubmit={handleSaveTeam}>
              <div className="adm-modal__body">
                <div className="adm-field">
                  <label>Team Name</label>
                  <input className="adm-input" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>

                <div className="adm-row-2">
                  <div className="adm-field">
                    <label>Avatar / Label</label>
                    <input className="adm-input" type="text" placeholder="e.g. Phoenix, Lions..." value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} />
                  </div>
                  <div className="adm-field">
                    <label>Score (pts)</label>
                    <input className="adm-input" type="number" value={formData.score} onChange={e => setFormData({ ...formData, score: e.target.value })} />
                  </div>
                </div>

                <div className="adm-field">
                  <label>Team Color</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} style={{ width: 40, height: 38, padding: 2, border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer' }} />
                    <input className="adm-input" type="text" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} style={{ fontFamily: 'var(--font-mono)', flex: 1 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#4f46e5', cursor: 'pointer' }} />
                  <label htmlFor="is_active" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#0f172a' }}>Team is active (visible in player selection)</label>
                </div>
              </div>
              <div className="adm-modal__footer">
                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setEditingTeam(null)}>Cancel</button>
                <button type="submit" className="adm-btn adm-btn--primary" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
