import React, { useState } from 'react'

export default function MapLyingGame({ config, onValidate, attemptsUsed, loading }) {
  const [selectedPoint, setSelectedPoint] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const maxAttempts = config.max_attempts || 5

  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)

    setSelectedPoint({ x, y })
    setFeedback(null)
  }

  const handleSubmit = async () => {
    if (!selectedPoint || loading) return
    const res = await onValidate({
      x: selectedPoint.x,
      y: selectedPoint.y
    })
    if (res) {
      setFeedback(res)
    }
  }

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Instructions Card */}
      <div className="card" style={{ padding: 'var(--sp-3)' }}>
        <div className="flex justify-between items-center">
          <span className="badge badge--warning">🗺️ CARTOGRAPHIC ANOMALY</span>
          <span className="font-mono text-xs text-secondary">
            Attempts: {attemptsUsed || 0}/{maxAttempts}
          </span>
        </div>
        <p className="text-sm text-secondary" style={{ marginTop: 'var(--sp-2)' }}>
          This official ENISo map contains one fabricated structure or altered sector that does not exist in reality. Tap the fraudulent area to verify!
        </p>
      </div>

      {/* Map Interactive Canvas Card */}
      <div className="card" style={{ padding: 'var(--sp-2)', position: 'relative' }}>
        <div
          className="game-image-container"
          style={{ height: 280, cursor: 'crosshair', position: 'relative', background: '#09101d' }}
          onClick={handleMapClick}
        >
          {config.map_image ? (
            <img src={config.map_image} alt="Campus Map" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <svg width="100%" height="100%" viewBox="0 0 500 350" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Grid background */}
              <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#1e293b" strokeWidth="0.8"/>
              </pattern>
              <rect width="500" height="350" fill="url(#grid)" />

              {/* Campus Outline & Walkways */}
              <path d="M 40 175 L 460 175 M 250 40 L 250 310" stroke="#334155" strokeWidth="6" strokeDasharray="4 4"/>
              <circle cx="250" cy="175" r="35" fill="#0f172a" stroke="#6366f1" strokeWidth="2"/>
              <text x="250" y="179" fill="#818cf8" fontSize="10" fontWeight="bold" textAnchor="middle">CENTRAL PLAZA</text>

              {/* Zone 1: Main Amphi (Top Left, x: 20%, y: 25% = 100, 85) */}
              <rect x="50" y="50" width="100" height="70" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="4"/>
              <text x="100" y="85" fill="#bae6fd" fontSize="11" fontWeight="bold" textAnchor="middle">AMPHITHEATRE</text>
              <text x="100" y="100" fill="#64748b" fontSize="8" textAnchor="middle">ZONE 01</text>

              {/* Zone 2: Library & Study Hall (Bottom Left, x: 20%, y: 75% = 100, 260) */}
              <rect x="50" y="220" width="110" height="80" fill="#1e293b" stroke="#34d399" strokeWidth="2" rx="4"/>
              <text x="105" y="255" fill="#a7f3d0" fontSize="11" fontWeight="bold" textAnchor="middle">LIBRARY / DOC</text>
              <text x="105" y="270" fill="#64748b" fontSize="8" textAnchor="middle">ZONE 02</text>

              {/* Zone 3: Tech & Robotics Labs (Bottom Right, x: 75%, y: 75% = 375, 260) */}
              <rect x="320" y="220" width="130" height="80" fill="#1e293b" stroke="#f472b6" strokeWidth="2" rx="4"/>
              <text x="385" y="255" fill="#fbcfe8" fontSize="11" fontWeight="bold" textAnchor="middle">ADVANCED LABS</text>
              <text x="385" y="270" fill="#64748b" fontSize="8" textAnchor="middle">ZONE 03</text>

              {/* Zone 4: Admin Block (Top Right, x: 80%, y: 25% = 400, 85) */}
              <rect x="340" y="50" width="110" height="70" fill="#1e293b" stroke="#fbbf24" strokeWidth="2" rx="4"/>
              <text x="395" y="85" fill="#fef08a" fontSize="11" fontWeight="bold" textAnchor="middle">ADMINISTRATION</text>
              <text x="395" y="100" fill="#64748b" fontSize="8" textAnchor="middle">ZONE 04</text>

              {/* THE FAKE ANOMALY at (55%, 40%) -> (275, 140) */}
              <g transform="translate(255, 115)">
                <rect x="0" y="0" width="60" height="50" fill="#431407" stroke="#ea580c" strokeWidth="2" rx="6" strokeDasharray="3 2"/>
                <circle cx="30" cy="22" r="14" fill="#7c2d12" stroke="#fdba74"/>
                <text x="30" y="26" fill="#fed7aa" fontSize="8" fontWeight="bold" textAnchor="middle">DOME X</text>
                <text x="30" y="44" fill="#f97316" fontSize="6" textAnchor="middle">PHANTOM WING</text>
              </g>

              {/* Compass rose */}
              <g transform="translate(450, 40)">
                <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#475569"/>
                <text x="0" y="-4" fill="#ef4444" fontSize="9" fontWeight="bold" textAnchor="middle">N</text>
                <text x="0" y="10" fill="#64748b" fontSize="8" textAnchor="middle">S</text>
              </g>
            </svg>
          )}

          {/* Selected Pin Marker */}
          {selectedPoint && (
            <div
              style={{
                position: 'absolute',
                left: `${selectedPoint.x}%`,
                top: `${selectedPoint.y}%`,
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'none',
                animation: 'bounceIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <div style={{
                background: 'var(--accent)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '10px',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                marginBottom: 2
              }}>
                TARGET: [{selectedPoint.x}%, {selectedPoint.y}%]
              </div>
              <div style={{
                width: 14,
                height: 14,
                background: 'var(--error)',
                border: '2px solid var(--accent)',
                borderRadius: '50%',
                margin: '0 auto',
                boxShadow: '0 0 10px var(--error)'
              }} />
            </div>
          )}
        </div>

        {/* Selected coordinates readout */}
        <div className="flex justify-between items-center text-xs font-mono text-secondary" style={{ padding: '6px 8px' }}>
          <span>{selectedPoint ? `SELECTED SECTOR: [X: ${selectedPoint.x}%, Y: ${selectedPoint.y}%]` : 'TAP MAP TO TARGET ANOMALY'}</span>
          <span style={{ color: 'var(--accent-light)' }}>CAMPUS GRID v2.6</span>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && !feedback.correct && (
        <div className="card card--error animate-fadeInUp" style={{ padding: 'var(--sp-3)', textAlign: 'center' }}>
          <p style={{ color: 'var(--error)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
            ⚠️ {feedback.message}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        className="btn btn--primary btn--lg btn--full"
        onClick={handleSubmit}
        disabled={!selectedPoint || loading}
      >
        {loading ? 'Analyzing Sector Integrity...' : 'Validate Anomaly Sector'}
      </button>
    </div>
  )
}
