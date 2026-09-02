import React, { useState } from 'react'

export default function SquadLock({ teams, onLockSuccess }) {
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirmLock = () => {
    if (!selectedTeam) return
    localStorage.setItem('eniso_locked_team_id', selectedTeam.id)
    localStorage.setItem('eniso_locked_team_name', selectedTeam.name)
    localStorage.setItem('eniso_locked_team_color', selectedTeam.color)
    localStorage.setItem('eniso_locked_team_avatar', selectedTeam.avatar || '⚡')
    onLockSuccess(selectedTeam)
  }

  return (
    <div className="app-screen animate-fadeIn" style={{ padding: '16px', gap: 16 }}>
      {/* Header Banner */}
      <div className="card card--accent" style={{ textAlign: 'center', padding: '24px 16px', margin: 0 }}>
        <div className="badge badge--accent" style={{ marginBottom: 8 }}>
          ONE-TIME SQUAD REGISTRATION
        </div>
        <h1 className="heading-2" style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 800 }}>
          Identify Your Squad
        </h1>
        <p className="text-secondary text-xs" style={{ maxWidth: 340, margin: '6px auto 0', lineHeight: 1.5 }}>
          Select your official team. Your phone will be locked to this squad for the entire campus exploration.
        </p>
      </div>

      {/* 10 Squads Grid */}
      <div className="squad-grid">
        {teams.map((t) => {
          const isSelected = selectedTeam?.id === t.id
          return (
            <div
              key={t.id}
              className={`squad-card ${isSelected ? 'squad-card--selected' : ''}`}
              onClick={() => setSelectedTeam(t)}
            >
              <div
                className="squad-avatar"
                style={{
                  background: t.color,
                  border: isSelected ? '3px solid var(--accent)' : '2px solid var(--border-primary)'
                }}
              >
                {t.avatar || t.name.replace('Team ', 'T')}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                {isSelected ? 'SELECTED' : 'TAP TO CHOOSE'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Confirmation & Lock CTA */}
      {selectedTeam && (
        <div
          className="challenge-card animate-fadeIn"
          style={{ margin: '16px 0 0', padding: 18, border: `2px solid ${selectedTeam.color}` }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: selectedTeam.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
                color: '#fff'
              }}
            >
              {selectedTeam.avatar || selectedTeam.name.replace('Team ', 'T')}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700 }}>LOCKING DEVICE TO:</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Squad {selectedTeam.name}</div>
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: 12,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginBottom: 14
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: 2, accentColor: 'var(--accent)' }}
            />
            <span>
              I confirm this device represents <strong>Squad {selectedTeam.name}</strong>. Squad cannot be switched during the game.
            </span>
          </label>

          <button
            className="btn-primary"
            onClick={handleConfirmLock}
            disabled={!confirmed}
          >
            Confirm & Start Exploration
          </button>
        </div>
      )}
    </div>
  )
}
