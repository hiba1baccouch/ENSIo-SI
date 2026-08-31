import React, { useState } from 'react'

const TARGET_SPOTS = [
  { id: 'd1', x: 15, y: 20, label: 'Window variation' },
  { id: 'd2', x: 45, y: 35, label: 'Dome color shift' },
  { id: 'd3', x: 70, y: 50, label: 'Extra tree' },
  { id: 'd4', x: 30, y: 70, label: 'Missing signpost' },
  { id: 'd5', x: 80, y: 15, label: 'Flag variation' },
]

export default function FindDifferenceGame({ config, onValidate, loading }) {
  const [foundIds, setFoundIds] = useState([])
  const [activeTab, setActiveTab] = useState('both')
  const [ripples, setRipples] = useState([])

  const requiredFound = 5

  const handleImageClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = ((e.clientX - rect.left) / rect.width) * 100
    const clickY = ((e.clientY - rect.top) / rect.height) * 100

    const newRipple = { id: Date.now(), x: clickX, y: clickY }
    setRipples(prev => [...prev, newRipple])
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 500)

    const tolerance = 14
    for (const spot of TARGET_SPOTS) {
      const dist = Math.sqrt(Math.pow(clickX - spot.x, 2) + Math.pow(clickY - spot.y, 2))
      if (dist <= tolerance && !foundIds.includes(spot.id)) {
        const updated = [...foundIds, spot.id]
        setFoundIds(updated)
        if (updated.length >= requiredFound) {
          onValidate({ found_ids: updated })
        }
        break
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Scanner Status Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-pill)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)' }}>
          🔍 ANOMALIES FOUND: {foundIds.length} / {requiredFound}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {TARGET_SPOTS.map((s) => (
            <div
              key={s.id}
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: foundIds.includes(s.id) ? 'var(--success)' : 'rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.15)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Mode View Switcher */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        <button
          type="button"
          className={activeTab === 'both' ? 'btn-primary' : 'btn-secondary'}
          style={{ minHeight: 38, padding: 6, fontSize: 12 }}
          onClick={() => setActiveTab('both')}
        >
          Side-by-Side
        </button>
        <button
          type="button"
          className={activeTab === 'original' ? 'btn-primary' : 'btn-secondary'}
          style={{ minHeight: 38, padding: 6, fontSize: 12 }}
          onClick={() => setActiveTab('original')}
        >
          Feed A (Original)
        </button>
        <button
          type="button"
          className={activeTab === 'modified' ? 'btn-primary' : 'btn-secondary'}
          style={{ minHeight: 38, padding: 6, fontSize: 12 }}
          onClick={() => setActiveTab('modified')}
        >
          Feed B (Modified)
        </button>
      </div>

      {/* Scanner Views */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(activeTab === 'both' || activeTab === 'original') && (
          <div className="game-media-frame" style={{ height: 180, cursor: 'crosshair' }} onClick={handleImageClick}>
            <div style={{ position: 'absolute', top: 6, left: 8, zIndex: 10, fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 4 }}>
              FEED A — ORIGINAL
            </div>
            <svg width="100%" height="100%" viewBox="0 0 400 200" fill="none">
              <rect width="400" height="200" fill="#0f172a"/>
              <rect width="400" height="120" fill="#1e1b4b"/>
              <circle cx="340" cy="40" r="22" fill="#fbbf24"/>
              <rect x="40" y="50" width="320" height="110" fill="#1e293b" stroke="#475569" strokeWidth="2"/>
              <rect x="55" y="65" width="25" height="30" fill="#38bdf8" stroke="#0284c7" rx="2"/>
              <rect x="95" y="65" width="25" height="30" fill="#38bdf8" stroke="#0284c7" rx="2"/>
              <rect x="135" y="65" width="25" height="30" fill="#38bdf8" stroke="#0284c7" rx="2"/>
              <path d="M170 50 Q200 15 230 50 Z" fill="#3b82f6"/>
              <line x1="320" y1="50" x2="320" y2="20" stroke="#cbd5e1" strokeWidth="2"/>
              <rect x="320" y="20" width="22" height="14" fill="#ef4444"/>
              <circle cx="331" cy="27" r="4" fill="#ffffff"/>
              <rect y="160" width="400" height="40" fill="#334155"/>
              <rect x="110" y="140" width="30" height="20" fill="#6366f1" rx="2"/>
              <text x="125" y="153" fill="#fff" fontSize="7" textAnchor="middle" fontWeight="bold">ENISo</text>
              <circle cx="280" cy="140" r="16" fill="#16a34a"/>
              <rect x="277" y="156" width="6" height="15" fill="#78350f"/>
            </svg>
            {TARGET_SPOTS.filter(s => foundIds.includes(s.id)).map(spot => (
              <div
                key={spot.id}
                style={{
                  position: 'absolute',
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '3px solid var(--success)',
                  boxShadow: '0 0 12px var(--success)',
                  pointerEvents: 'none'
                }}
              />
            ))}
          </div>
        )}

        {(activeTab === 'both' || activeTab === 'modified') && (
          <div className="game-media-frame" style={{ height: 180, cursor: 'crosshair' }} onClick={handleImageClick}>
            <div style={{ position: 'absolute', top: 6, left: 8, zIndex: 10, fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 4 }}>
              FEED B — MODIFIED (TAP ANOMALIES)
            </div>
            <svg width="100%" height="100%" viewBox="0 0 400 200" fill="none">
              <rect width="400" height="200" fill="#0f172a"/>
              <rect width="400" height="120" fill="#1e1b4b"/>
              <circle cx="340" cy="40" r="22" fill="#fbbf24"/>
              <rect x="40" y="50" width="320" height="110" fill="#1e293b" stroke="#475569" strokeWidth="2"/>
              <rect x="55" y="65" width="25" height="30" fill="#1e293b" stroke="#334155" rx="2"/>
              <rect x="95" y="65" width="25" height="30" fill="#38bdf8" stroke="#0284c7" rx="2"/>
              <rect x="135" y="65" width="25" height="30" fill="#38bdf8" stroke="#0284c7" rx="2"/>
              <path d="M170 50 Q200 15 230 50 Z" fill="#eab308"/>
              <line x1="320" y1="50" x2="320" y2="20" stroke="#cbd5e1" strokeWidth="2"/>
              <rect x="320" y="20" width="22" height="14" fill="#10b981"/>
              <rect y="160" width="400" height="40" fill="#334155"/>
              <circle cx="280" cy="140" r="16" fill="#16a34a"/>
              <rect x="277" y="156" width="6" height="15" fill="#78350f"/>
              <circle cx="250" cy="135" r="13" fill="#22c55e"/>
              <rect x="248" y="148" width="5" height="15" fill="#78350f"/>
            </svg>
            {TARGET_SPOTS.filter(s => foundIds.includes(s.id)).map(spot => (
              <div
                key={spot.id}
                style={{
                  position: 'absolute',
                  left: `${spot.x}%`,
                  top: `${spot.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '3px solid var(--success)',
                  boxShadow: '0 0 12px var(--success)',
                  pointerEvents: 'none'
                }}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="btn-primary"
        onClick={() => onValidate({ found_ids: foundIds })}
        disabled={foundIds.length < requiredFound || loading}
      >
        {loading ? 'Verifying Scanner Data...' : `Confirm Scan (${foundIds.length}/${requiredFound})`}
      </button>
    </div>
  )
}
