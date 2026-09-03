import React, { useState, useEffect } from 'react'

export default function HiddenMessageGame({ config, onValidate, attemptsUsed = 0, loading, lastResult }) {
  const [wordGuess, setWordGuess] = useState('')
  const [isWrong, setIsWrong] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const maxAttempts = config.max_attempts || 3
  const questionText = config.question || 'Enter the secret codeword hidden at this physical station:'

  useEffect(() => {
    if (lastResult && !lastResult.correct) {
      setIsWrong(true)
      setErrorMsg(lastResult.message || 'Incorrect codeword. Try again!')
    }
  }, [lastResult])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!wordGuess.trim() || loading) return
    setIsWrong(false)
    setErrorMsg('')
    await onValidate({ word: wordGuess.trim() })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-light)' }}>
          🔐 HIDDEN CODEWORD
        </span>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          Attempts: {attemptsUsed} / {maxAttempts}
        </span>
      </div>

      {/* Optional Photo Frame */}
      {config.image && (
        <div
          className="game-media-frame"
          style={{ height: 200, overflow: 'hidden', borderRadius: 'var(--radius-md)' }}
        >
          <img
            src={config.image}
            alt="Station visual"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Question Card */}
      <div
        style={{
          background: 'var(--bg-pill)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
          {questionText}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            value={wordGuess}
            onChange={(e) => {
              setWordGuess(e.target.value)
              setIsWrong(false)
            }}
            placeholder="Type secret codeword..."
            disabled={loading}
            autoCapitalize="off"
            autoCorrect="off"
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
              letterSpacing: '0.08em',
              background: isWrong ? 'rgba(239, 68, 68, 0.08)' : '#ffffff',
              border: isWrong ? '2px solid #ef4444' : '2px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              color: isWrong ? '#dc2626' : 'var(--text-primary)',
              outline: 'none',
              boxShadow: isWrong ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
              transition: 'all 0.2s ease'
            }}
          />

          {/* Feedback error alert */}
          {isWrong && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 600,
                color: '#dc2626',
                textAlign: 'center'
              }}
            >
              ❌ {errorMsg || 'Incorrect codeword. Check the station clue and try again!'}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={!wordGuess.trim() || loading}
            style={{ fontSize: 16, padding: '14px 0' }}
          >
            {loading ? 'Decrypting Codeword...' : 'Submit Secret Codeword →'}
          </button>
        </form>
      </div>
    </div>
  )
}
