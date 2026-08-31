import React, { useState } from 'react'

export default function EmojiCodeGame({ config, onValidate, loading }) {
  const rounds = config.rounds || []
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [feedback, setFeedback] = useState(null)

  const activeRound = rounds[currentRoundIndex] || {}

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'easy': return 'badge--success'
      case 'medium': return 'badge--warning'
      case 'hard': return 'badge--error'
      default: return 'badge--accent'
    }
  }

  const handleSubmit = async () => {
    const answer = activeRound.options ? selectedOption : textInput.trim()
    if (!answer || loading) return

    const res = await onValidate({
      round_id: activeRound.id,
      answer
    })

    if (res) {
      if (res.round_solved && res.next_round) {
        const nextIdx = rounds.findIndex(r => r.id === res.next_round)
        if (nextIdx !== -1) {
          setCurrentRoundIndex(nextIdx)
          setSelectedOption(null)
          setTextInput('')
          setFeedback({ correct: true, message: res.message })
          setTimeout(() => setFeedback(null), 2500)
        }
      } else {
        setFeedback(res)
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* Round & Difficulty Progress */}
      <div className="card" style={{ padding: 'var(--sp-3)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--sp-2)' }}>
          <span className={`badge ${getDifficultyColor(activeRound.difficulty)}`}>
            {activeRound.difficulty?.toUpperCase()} CODE
          </span>
          <span className="font-mono text-xs text-secondary">
            ROUND {currentRoundIndex + 1} OF {rounds.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          {rounds.map((r, idx) => (
            <div
              key={r.id || idx}
              style={{
                flex: 1,
                height: 8,
                borderRadius: 'var(--radius-full)',
                background: idx < currentRoundIndex 
                  ? 'var(--success)' 
                  : idx === currentRoundIndex 
                    ? 'var(--accent)' 
                    : 'var(--bg-tertiary)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
      </div>

      {/* Big Emoji Card */}
      <div className="card card--accent animate-fadeIn" style={{ padding: 'var(--sp-6)', textAlign: 'center' }}>
        <div className="emoji-display" style={{ userSelect: 'none', margin: 'var(--sp-2) 0' }}>
          {activeRound.emojis}
        </div>
        <p className="text-secondary text-sm" style={{ marginTop: 'var(--sp-2)' }}>
          Interpret the symbolic emoji sequence to decipher the ENISo campus spot or concept.
        </p>
      </div>

      {/* Input Options (Multiple Choice or Text Input) */}
      {activeRound.options ? (
        <div className="flex flex-col gap-2">
          {activeRound.options.map((opt, idx) => {
            const isSelected = selectedOption === opt
            return (
              <button
                key={idx}
                className={`option-btn ${isSelected ? 'option-btn--selected' : ''}`}
                onClick={() => {
                  setSelectedOption(opt)
                  setFeedback(null)
                }}
                disabled={loading}
              >
                <div className="option-btn__letter">{String.fromCharCode(65 + idx)}</div>
                <span style={{ fontWeight: 600 }}>{opt}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 'var(--sp-4)' }}>
          <label className="text-xs font-mono text-secondary" style={{ display: 'block', marginBottom: 'var(--sp-2)' }}>
            TYPE YOUR ANSWER (CASE INSENSITIVE):
          </label>
          <input
            type="text"
            className="font-mono text-center"
            style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}
            placeholder="e.g. Laboratory, Library..."
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value)
              setFeedback(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
            disabled={loading}
            autoFocus
          />
        </div>
      )}

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`card ${feedback.correct ? 'card--success' : 'card--error'} animate-fadeInUp`}
          style={{ padding: 'var(--sp-3)', textAlign: 'center' }}
        >
          <p style={{ color: feedback.correct ? 'var(--success)' : 'var(--error)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
            {feedback.correct ? '✨' : '⚠️'} {feedback.message}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        className="btn btn--primary btn--lg btn--full"
        onClick={handleSubmit}
        disabled={(!selectedOption && !textInput.trim()) || loading}
      >
        {loading ? 'Validating Emoji Code...' : 'Submit Decoded Spot →'}
      </button>
    </div>
  )
}
