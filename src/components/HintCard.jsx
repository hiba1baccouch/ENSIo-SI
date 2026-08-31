import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function HintCard({ hint, pointsEarned = 100, stationNumber = 1 }) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 9, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 100,
        animation: 'fadeIn 0.3s ease'
      }}
    >
      <div
        className="challenge-card animate-bounceIn"
        style={{
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          border: '2px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(99, 102, 241, 0.3)'
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 4 }}>🎉</div>

        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
          Challenge {stationNumber} Solved!
        </h2>

        {/* Progressive Points Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 18px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            color: '#34d399',
            fontWeight: 800,
            fontSize: 16,
            margin: '4px auto 12px'
          }}
        >
          ✨ +{pointsEarned} Points Awarded
        </div>

        {/* The Physical Challenge Hint */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            textAlign: 'left',
            margin: '8px 0'
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.1em',
              color: 'var(--accent-light)',
              marginBottom: 6,
              textTransform: 'uppercase'
            }}
          >
            📍 Next Physical Checkpoint Clue:
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#f1f5f9', fontWeight: 500, fontStyle: 'italic' }}>
            "{hint}"
          </p>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 16px' }}>
          Move your squad to this physical location and scan the next QR code!
        </p>

        <button
          className="btn-primary"
          onClick={() => navigate('/')}
        >
          Open QR Scanner for Next Station →
        </button>
      </div>
    </div>
  )
}
