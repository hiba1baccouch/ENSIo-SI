import React, { useState } from 'react'

export default function FindDifferenceGame({ config, onValidate, loading, lastResult }) {
  const [guess, setGuess] = useState('')
  const [activeTab, setActiveTab] = useState('both')

  const totalDiffs = config.answer_count ?? config.differences?.length ?? 4

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

      {/* Instruction Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-light)', marginBottom: 4 }}>
          🔍 SPOT THE DIFFERENCES
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Compare both images carefully and count how many differences you can find between them.
          Then enter your answer below.
        </div>
      </div>

      {/* View Switcher */}
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
          Image A
        </button>
        <button
          type="button"
          className={activeTab === 'modified' ? 'btn-primary' : 'btn-secondary'}
          style={{ minHeight: 38, padding: 6, fontSize: 12 }}
          onClick={() => setActiveTab('modified')}
        >
          Image B
        </button>
      </div>

      {/* Images */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(activeTab === 'both' || activeTab === 'original') && (
          <div className="game-media-frame" style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 6, left: 8, zIndex: 10, fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 4, color: '#fff' }}>
              IMAGE A — ORIGINAL
            </div>
            {config.image_original ? (
              <img src={config.image_original} alt="Image A" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
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
                <rect y="160" width="400" height="40" fill="#334155"/>
                <rect x="110" y="140" width="30" height="20" fill="#6366f1" rx="2"/>
                <text x="125" y="153" fill="#fff" fontSize="7" textAnchor="middle" fontWeight="bold">ENISo</text>
                <circle cx="280" cy="140" r="16" fill="#16a34a"/>
              </svg>
            )}
          </div>
        )}

        {(activeTab === 'both' || activeTab === 'modified') && (
          <div className="game-media-frame" style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 6, left: 8, zIndex: 10, fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: 4, color: '#fff' }}>
              IMAGE B — MODIFIED
            </div>
            {config.image_modified ? (
              <img src={config.image_modified} alt="Image B" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
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
                <circle cx="250" cy="135" r="13" fill="#22c55e"/>
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Number Input */}
      <div style={{
        background: 'var(--bg-pill)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>
          How many differences did you find?
        </div>

        {/* Number Picker */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <button
            type="button"
            onClick={() => setGuess(prev => String(Math.max(0, (parseInt(prev) || 0) - 1)))}
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(99,102,241,0.15)',
              border: '1.5px solid rgba(99,102,241,0.3)',
              color: 'var(--accent-light)', fontSize: 22, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1
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
              border: isWrong
                ? '2px solid rgba(239,68,68,0.6)'
                : '2px solid rgba(99,102,241,0.3)',
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
              background: 'rgba(99,102,241,0.15)',
              border: '1.5px solid rgba(99,102,241,0.3)',
              color: 'var(--accent-light)', fontSize: 22, fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1
            }}
          >+</button>
        </div>

        {/* Wrong answer feedback */}
        {isWrong && (
          <div style={{
            textAlign: 'center', fontSize: 12,
            color: '#f87171', fontWeight: 600,
            animation: 'fadeIn 0.2s ease'
          }}>
            ✗ Not quite! Try again.
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
        {loading ? 'Checking...' : `Submit Answer: ${guess || '?'} differences`}
      </button>
    </div>
  )
}
