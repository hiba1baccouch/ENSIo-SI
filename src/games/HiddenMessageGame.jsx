import React, { useState } from 'react'

export default function HiddenMessageGame({ config, onValidate, loading }) {
  const [foundLetters, setFoundLetters] = useState({}) // { [id]: letter }
  const [wordGuess, setWordGuess] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [markers, setMarkers] = useState([]) // [{ x, y, letter }]

  const targetCount = config.element_count || 5

  const handleImageClick = async (e) => {
    if (loading) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)

    const res = await onValidate({ click: { x, y } })
    if (res) {
      if (res.element_found) {
        setFoundLetters(prev => ({
          ...prev,
          [res.element_id]: res.letter
        }))
        setMarkers(prev => {
          if (prev.some(m => m.letter === res.letter && m.x === x && m.y === y)) return prev
          return [...prev, { x, y, letter: res.letter }]
        })
        setFeedback({ correct: true, message: `Discovered Glyph: [ ${res.letter} ]` })
      } else {
        setFeedback({ correct: false, message: res.message || 'Nothing hidden at this location.' })
      }
    }
  }

  const handleWordSubmit = async (e) => {
    e?.preventDefault()
    if (!wordGuess.trim() || loading) return

    const res = await onValidate({ word: wordGuess.trim() })
    if (res) {
      setFeedback(res)
    }
  }

  const collectedArray = Object.values(foundLetters)

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Tracker Card */}
      <div className="card" style={{ padding: 'var(--sp-3)' }}>
        <div className="flex justify-between items-center">
          <span className="badge badge--accent">🕵️ STEGANOGRAPHY SCAN</span>
          <span className="font-mono text-xs text-secondary">
            Glyphs Found: <strong style={{ color: 'var(--accent-light)' }}>{collectedArray.length}</strong> / {targetCount}
          </span>
        </div>
        <p className="text-xs text-secondary" style={{ marginTop: 'var(--sp-2)' }}>
          5 encrypted letter fragments are hidden in this campus scene. Tap the image to uncover them, then decipher the secret word!
        </p>
      </div>

      {/* Interactive Image Scene */}
      <div className="card" style={{ padding: 'var(--sp-2)' }}>
        <div
          className="game-image-container"
          style={{ height: 260, cursor: 'crosshair', position: 'relative', background: '#0a0f1d' }}
          onClick={handleImageClick}
        >
          {config.image ? (
            <img src={config.image} alt="Hidden Message Scene" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <svg width="100%" height="100%" viewBox="0 0 500 300" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="500" height="300" fill="#0f172a"/>
              {/* Lab Benches & Server Racks */}
              <rect x="20" y="40" width="80" height="220" fill="#1e293b" stroke="#334155" rx="4"/>
              <line x1="30" y1="80" x2="90" y2="80" stroke="#475569"/>
              <line x1="30" y1="140" x2="90" y2="140" stroke="#475569"/>
              <line x1="30" y1="200" x2="90" y2="200" stroke="#475569"/>

              {/* Element 1: 'E' hidden around (10%, 25%) -> (50, 75) in server vent */}
              <path d="M45 70 L55 70 M45 75 L52 75 M45 80 L55 80 M45 70 L45 80" stroke="#6366f1" strokeWidth="2.5" opacity="0.6"/>

              {/* Center Robotic Arm station */}
              <rect x="140" y="100" width="220" height="120" fill="#1e293b" stroke="#475569" rx="8"/>
              <circle cx="250" cy="160" r="40" fill="#0284c7" opacity="0.2"/>

              {/* Element 2: 'N' hidden around (35%, 55%) -> (175, 165) on robot arm joint */}
              <path d="M170 155 L170 175 L182 155 L182 175" stroke="#38bdf8" strokeWidth="2.5" opacity="0.6"/>

              {/* Top Display Terminal */}
              <rect x="260" y="30" width="120" height="50" fill="#0369a1" stroke="#38bdf8" rx="4"/>
              {/* Element 3: 'I' hidden around (60%, 15%) -> (300, 45) in circuit trace */}
              <path d="M295 40 L305 40 M300 40 L300 60 M295 60 L305 60" stroke="#e0f2fe" strokeWidth="2.5" opacity="0.7"/>

              {/* Right Terminal Rack */}
              <rect x="390" y="40" width="90" height="220" fill="#1e293b" stroke="#334155" rx="4"/>
              {/* Element 4: 'S' hidden around (80%, 70%) -> (400, 210) on power junction */}
              <path d="M405 202 C395 202 395 210 405 210 C415 210 415 218 405 218" stroke="#f43f5e" strokeWidth="2.5" fill="none" opacity="0.65"/>

              {/* Floor tile grid */}
              <line x1="0" y1="260" x2="500" y2="260" stroke="#334155" strokeWidth="2"/>
              {/* Element 5: 'O' hidden around (45%, 85%) -> (225, 255) on floor drain / ring */}
              <circle cx="225" cy="255" r="10" stroke="#10b981" strokeWidth="2.5" fill="none" opacity="0.65"/>
            </svg>
          )}

          {/* Render markers for all found elements */}
          {markers.map((m, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${m.x}%`,
                top: `${m.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px var(--accent)',
                animation: 'bounceIn 0.3s ease-out'
              }}
            >
              {m.letter}
            </div>
          ))}
        </div>
      </div>

      {/* Discovered Letters Rack */}
      <div className="card" style={{ padding: 'var(--sp-4)', textAlign: 'center' }}>
        <div className="text-xs font-mono text-secondary" style={{ marginBottom: 'var(--sp-2)' }}>
          COLLECTED LETTER GLYPHS:
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--sp-2)', minHeight: 48 }}>
          {Array.from({ length: targetCount }).map((_, idx) => {
            const letter = collectedArray[idx]
            return (
              <div
                key={idx}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  background: letter ? 'var(--accent-glow)' : 'var(--bg-tertiary)',
                  border: letter ? '2px solid var(--accent)' : '1px dashed var(--border-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: letter ? 'var(--accent-light)' : 'var(--text-muted)'
                }}
              >
                {letter || '?'}
              </div>
            )
          })}
        </div>
      </div>

      {/* Final Word Formulation Submission Form */}
      <form onSubmit={handleWordSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-mono text-secondary" style={{ display: 'block', marginBottom: 4 }}>
            UNSCRAMBLE AND ENTER FINAL PASSWORD WORD:
          </label>
          <input
            type="text"
            className="font-mono text-center"
            style={{ fontSize: 'var(--text-2xl)', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}
            placeholder="DECODED WORD..."
            value={wordGuess}
            onChange={(e) => {
              setWordGuess(e.target.value)
              setFeedback(null)
            }}
            disabled={loading}
          />
        </div>

        {/* Feedback Display */}
        {feedback && (
          <div
            className={`card ${feedback.correct ? 'card--success' : 'card--error'} animate-fadeInUp`}
            style={{ padding: 'var(--sp-3)', textAlign: 'center' }}
          >
            <p style={{ color: feedback.correct ? 'var(--success)' : 'var(--error)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
              {feedback.correct ? '🔓' : '⚠️'} {feedback.message}
            </p>
          </div>
        )}

        <button
          type="submit"
          className="btn btn--primary btn--lg btn--full"
          disabled={!wordGuess.trim() || loading}
        >
          {loading ? 'Validating Cipher Word...' : 'Submit Decoded Message'}
        </button>
      </form>
    </div>
  )
}
