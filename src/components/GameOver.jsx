import { useNavigate } from 'react-router-dom'

export default function GameOver({ message, onRetry, canRetry }) {
  const navigate = useNavigate()

  return (
    <div className="overlay">
      <div className="modal" style={{ textAlign: 'center' }}>
        <div className="animate-bounceIn" style={{ fontSize: '3rem', marginBottom: 'var(--sp-4)' }}>💀</div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--sp-2)' }}>
          Game Over
        </h2>
        <p className="text-secondary" style={{ marginBottom: 'var(--sp-6)' }}>
          {message || 'You have run out of attempts.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {canRetry && (
            <button className="btn btn--primary btn--full" onClick={onRetry}>
              Try Again
            </button>
          )}
          <button className="btn btn--secondary btn--full" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
