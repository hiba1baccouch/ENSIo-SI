import React, { useState } from 'react'

export default function MapLyingGame({ config, onValidate, attemptsUsed = 0, loading, lastResult }) {
  const [guess, setGuess] = useState('')

  const maxAttempts = config.max_attempts || 5
  const question = config.question || 'How many fake / non-existent structures are shown on this campus map?'

  const handleSubmit = () => {
    const num = parseInt(guess)
    if (isNaN(num) || num < 0) return
    onValidate({ guess_count: num })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const isWrong = lastResult && !lastResult.correct

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.1))',
        border: '1px solid rgba(245,158,11,0.35)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24' }}>
          🗺️ CARTOGRAPHIC ANOMALY
        </span>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          Attempts: {attemptsUsed} / {maxAttempts}
        </span>
      </div>

      {/* Map Image */}
      <div className="game-media-frame" style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
        <div style={{
          position: 'absolute', top: 6, left: 8, zIndex: 10,
          fontSize: 10, fontFamily: 'var(--font-mono)',
          background: 'rgba(0,0,0,0.65)', padding: '2px 8px',
          borderRadius: 4, color: '#fbbf24', fontWeight: 700
        }}>
          CAMPUS MAP — OFFICIAL
        </div>
        {config.map_image ? (
          <img
            src={config.map_image}
            alt="Campus Map"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          /* Fallback SVG placeholder */
          <svg width="100%" height="220" viewBox="0 0 500 220" fill="none">
            <rect width="500" height="220" fill="#0f172a"/>
            <pattern id="mapgrid" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.8"/>
            </pattern>
            <rect width="500" height="220" fill="url(#mapgrid)"/>
            <circle cx="250" cy="110" r="25" fill="#0f172a" stroke="#6366f1" strokeWidth="2"/>
            <text x="250" y="114" fill="#818cf8" fontSize="8" fontWeight="bold" textAnchor="middle">PLAZA</text>
            <rect x="50" y="35" width="90" height="55" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4"/>
            <text x="95" y="64" fill="#bae6fd" fontSize="9" fontWeight="bold" textAnchor="middle">AMPHI</text>
            <rect x="360" y="35" width="90" height="55" fill="#1e293b" stroke="#fbbf24" strokeWidth="2" rx="4"/>
            <text x="405" y="64" fill="#fef08a" fontSize="9" fontWeight="bold" textAnchor="middle">ADMIN</text>
            <rect x="50" y="140" width="100" height="60" fill="#1e293b" stroke="#34d399" strokeWidth="2" rx="4"/>
            <text x="100" y="172" fill="#a7f3d0" fontSize="9" fontWeight="bold" textAnchor="middle">LIBRARY</text>
            {/* FAKE structure — dashed orange */}
            <rect x="245" y="40" width="55" height="40" fill="#431407" stroke="#ea580c" strokeWidth="2" rx="5" strokeDasharray="3 2"/>
            <text x="272" y="60" fill="#fed7aa" fontSize="7" fontWeight="bold" textAnchor="middle">DOME X</text>
            <text x="272" y="72" fill="#f97316" fontSize="5" textAnchor="middle">PHANTOM</text>
          </svg>
        )}
      </div>

      {/* Counter Input */}
      <div style={{
        background: 'var(--bg-pill)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>
          {question}
        </p>

        {/* Number Picker */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={() => setGuess(prev => String(Math.max(0, (parseInt(prev) || 0) - 1)))}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(245,158,11,0.15)',
              border: '1.5px solid rgba(245,158,11,0.3)',
              color: '#fbbf24', fontSize: 22, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >−</button>

          <input
            type="number"
            min="0"
            max="20"
            value={guess}
            onChange={e => setGuess(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0"
            style={{
              width: 80, height: 56, textAlign: 'center',
              fontSize: 28, fontWeight: 800,
              background: isWrong ? 'rgba(239,68,68,0.1)' : 'var(--bg-card)',
              border: isWrong ? '2px solid rgba(239,68,68,0.6)' : '2px solid rgba(245,158,11,0.4)',
              borderRadius: 'var(--radius-md)',
              color: isWrong ? '#f87171' : 'var(--text-primary)',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
          />

          <button
            type="button"
            onClick={() => setGuess(prev => String((parseInt(prev) || 0) + 1))}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(245,158,11,0.15)',
              border: '1.5px solid rgba(245,158,11,0.3)',
              color: '#fbbf24', fontSize: 22, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >+</button>
        </div>

        {isWrong && (
          <div style={{
            textAlign: 'center', fontSize: 12,
            color: '#f87171', fontWeight: 600
          }}>
            ✗ {lastResult?.message || 'Incorrect. Try again!'}
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={handleSubmit}
        disabled={guess === '' || isNaN(parseInt(guess)) || loading}
        style={{ fontSize: 16 }}
      >
        {loading ? 'Analyzing Map...' : `Submit Answer: ${guess || '?'} structure(s)`}
      </button>
    </div>
  )
}
