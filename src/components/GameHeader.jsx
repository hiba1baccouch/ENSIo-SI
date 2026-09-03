export default function GameHeader({ stationName, teamName, teamColor, teamScore, attemptsUsed, maxAttempts, progress }) {
  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div className="team-dot" style={{ background: teamColor || 'var(--accent)' }} />
          <span className="text-sm text-secondary">{teamName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="badge badge--accent">{teamScore || 0} pts</div>
          {maxAttempts > 0 && (
            <div className="badge badge--accent">
              {attemptsUsed || 0} / {maxAttempts} attempts
            </div>
          )}
        </div>
      </div>
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
        {stationName}
      </h1>
      {progress !== undefined && (
        <div className="progress">
          <div className="progress__fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
      )}
    </div>
  )
}
