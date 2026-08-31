import React from 'react'

export default function ChallengeLayout({
  stationNumber = 1,
  totalStations = 7,
  team,
  potentialPoints = 100,
  floatingBadgeContent,
  floatingBadgeLabel = 'REWARD',
  title,
  subtitle,
  children,
  onSubmit,
  submitLabel = 'Confirm Answer',
  submitting = false,
  submitDisabled = false,
  feedback,
}) {
  const progressPercent = (stationNumber / totalStations) * 100

  return (
    <div className="app-screen animate-fadeIn">
      {/* ─── Modern App Header ─── */}
      <div className="app-header">
        <div className="app-header__brand">
          <span className="app-header__title">Station {stationNumber}</span>
          <span className="app-header__sub">{progressPercent.toFixed(0)}% Complete</span>
        </div>
        <div className="app-header__stats">
          <div className="stat-pill">
            <span style={{ fontSize: 14 }}>{team?.avatar || team?.name?.replace('Team ', 'T')}</span>
            <span>{team?.name || 'Squad'}</span>
          </div>
          <div className="stat-pill">
            <span style={{ color: 'var(--accent)' }}>+{potentialPoints} pts</span>
          </div>
        </div>
      </div>

      {/* ─── Elevated Central Challenge Card ─── */}
      <div className="challenge-card">
        {title && (
          <h2 className="challenge-card__title">
            {title}
          </h2>
        )}

        {subtitle && (
          <p className="challenge-card__prompt">
            {subtitle}
          </p>
        )}

        {/* Dynamic Game Component Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: feedback.correct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: feedback.correct ? '1px solid var(--success)' : '1px solid var(--error)',
              color: feedback.correct ? 'var(--success)' : '#fca5a5',
              fontSize: 14,
              fontWeight: 600,
            textAlign: 'center',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {feedback.message}
        </div>
        )}

        {/* Unified Bottom Action CTA */}
        {onSubmit && (
          <button
            type="button"
            className="btn-primary"
            onClick={onSubmit}
            disabled={submitDisabled || submitting}
          >
            {submitting ? 'Authenticating Submission...' : submitLabel}
          </button>
        )}
      </div>
    </div>
  )
}
