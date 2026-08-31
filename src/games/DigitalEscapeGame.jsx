import React, { useState } from 'react'

export default function DigitalEscapeGame({ config, onValidate, loading }) {
  const puzzles = config.puzzles || []
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
  const [currentInput, setCurrentInput] = useState('')
  const [selectedOption, setSelectedOption] = useState(null)
  const [showHint, setShowHint] = useState(false)

  const activePuzzle = puzzles[currentPuzzleIndex] || {}

  const handleSubmit = async () => {
    const answerToSubmit = activePuzzle.options ? selectedOption : currentInput
    if (!answerToSubmit || loading) return

    const res = await onValidate({
      puzzle_id: activePuzzle.id,
      answer: answerToSubmit
    })

    if (res?.puzzle_solved && res.next_puzzle) {
      const nextIdx = puzzles.findIndex(p => p.id === res.next_puzzle)
      if (nextIdx !== -1) {
        setCurrentPuzzleIndex(nextIdx)
        setCurrentInput('')
        setSelectedOption(null)
        setShowHint(false)
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Chamber Step Indicators */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
        {puzzles.map((p, idx) => (
          <div
            key={p.id || idx}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 'var(--radius-full)',
              background: idx < currentPuzzleIndex 
                ? 'var(--success)' 
                : idx === currentPuzzleIndex 
                  ? 'var(--accent)' 
                  : 'var(--bg-pill)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-light)', fontFamily: 'var(--font-mono)' }}>
          CHAMBER {currentPuzzleIndex + 1} / {puzzles.length}: {activePuzzle.title?.toUpperCase()}
        </span>
        <button
          type="button"
          onClick={() => setShowHint(!showHint)}
          style={{ background: 'none', border: 'none', color: '#fbbf24', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          💡 {showHint ? 'Hide Clue' : 'Decryption Clue'}
        </button>
      </div>

      {/* Prompt Frame */}
      <div
        style={{
          background: 'var(--bg-pill)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          fontFamily: 'var(--font-mono)',
          fontSize: 16,
          textAlign: 'center',
          color: 'var(--text-primary)',
          letterSpacing: '0.04em'
        }}
      >
        {activePuzzle.prompt}
      </div>

      {showHint && activePuzzle.hint && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fef08a',
            fontSize: 13
          }}
        >
          💡 {activePuzzle.hint}
        </div>
      )}

      {/* Choice Pills or Text Input */}
      {activePuzzle.options ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activePuzzle.options.map((opt, idx) => {
            const isSelected = selectedOption === opt
            return (
              <div
                key={idx}
                className={`choice-pill ${isSelected ? 'choice-pill--selected' : ''}`}
                onClick={() => setSelectedOption(opt)}
              >
                <span className="font-mono" style={{ fontSize: 16 }}>{opt}</span>
                <div className="choice-radio" />
              </div>
            )
          })}
        </div>
      ) : (
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
            ENTER CIPHER DECRYPTION KEY:
          </label>
          <input
            type="text"
            className="font-mono text-center"
            style={{ fontSize: 18, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '14px' }}
            placeholder="TYPE CODE..."
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          />
        </div>
      )}

      <button
        type="button"
        className="btn-primary"
        onClick={handleSubmit}
        disabled={(!selectedOption && !currentInput.trim()) || loading}
      >
        {loading ? 'Validating Cipher...' : 'Unlock Chamber Door →'}
      </button>
    </div>
  )
}
