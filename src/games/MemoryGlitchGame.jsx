import React, { useState, useEffect } from 'react'

export default function MemoryGlitchGame({ config, onValidate, loading, attemptsUsed = 0, lastResult }) {
  const [phase, setPhase] = useState('memorize') // 'memorize' | 'quiz'
  const [timeLeft, setTimeLeft] = useState(config.display_time || 12)
  const [answers, setAnswers] = useState({})
  const [feedback, setFeedback] = useState(null) // { correct, message }

  const questions = config.questions || []
  const requiredCorrect = config.required_correct || 4
  const maxRetries = config.max_retries || 2

  // Countdown timer during memorize phase
  useEffect(() => {
    if (phase !== 'memorize') return
    if (timeLeft <= 0) { setPhase('quiz'); return }
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [phase, timeLeft])

  // React to validation result from GamePage
  useEffect(() => {
    if (lastResult === null || lastResult === undefined) return
    if (!lastResult.correct) {
      setFeedback({
        correct: false,
        message: lastResult.message || 'Some answers were incorrect. Review and try again!'
      })
    }
  }, [lastResult])

  const handleSelectAnswer = (qId, optionIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }))
    setFeedback(null) // clear feedback on re-selection
  }

  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id] !== undefined)

  const handleSubmit = async () => {
    if (!allAnswered || loading) return
    setFeedback(null)
    const res = await onValidate({ answers })
    // res handled via lastResult useEffect above
    if (res && !res.correct) {
      setFeedback({ correct: false, message: res.message || 'Some answers were incorrect. Try again!' })
    }
  }

  const handleRetry = () => {
    setAnswers({})
    setFeedback(null)
    setTimeLeft(config.display_time || 12)
    setPhase('memorize')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {phase === 'memorize' ? (
        /* ── MEMORIZE PHASE ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
          <div style={{
            padding: '6px 14px', borderRadius: 'var(--radius-full)',
            background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24',
            fontSize: 13, fontWeight: 700, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            ⚠️ MEMORIZE SCENE — FEED CLOSES IN {timeLeft}s
          </div>

          <div className="game-media-frame" style={{ height: 240, background: '#090d16', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {config.image ? (
              <img src={config.image} alt="Memorize scene" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              /* Placeholder SVG */
              <svg width="100%" height="100%" viewBox="0 0 400 240" fill="none">
                <rect width="400" height="240" fill="#0f172a"/>
                <rect x="100" y="50" width="200" height="130" fill="#0b1120" stroke="#334155"/>
                <rect x="120" y="65" width="25" height="30" fill="#38bdf8" opacity="0.8" rx="2"/>
                <rect x="155" y="65" width="25" height="30" fill="#38bdf8" opacity="0.8" rx="2"/>
                <rect x="220" y="65" width="25" height="30" fill="#38bdf8" opacity="0.8" rx="2"/>
                <rect x="255" y="65" width="25" height="30" fill="#38bdf8" opacity="0.8" rx="2"/>
                <rect x="20" y="80" width="60" height="110" fill="#dc2626" stroke="#b91c1c" strokeWidth="2" rx="4"/>
                <circle cx="70" cy="135" r="4" fill="#fbbf24"/>
                <rect x="160" y="15" width="80" height="22" fill="#6366f1" rx="4"/>
                <text x="200" y="30" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">ENISo</text>
                <rect x="140" y="160" width="120" height="14" fill="#475569" rx="2"/>
                <circle cx="200" cy="138" r="12" fill="#22c55e"/>
                <circle cx="192" cy="132" r="8" fill="#16a34a"/>
              </svg>
            )}
          </div>

          <button type="button" className="btn-secondary" onClick={() => setPhase('quiz')}>
            I'm Ready — Start Recall Test →
          </button>
        </div>
      ) : (
        /* ── QUIZ PHASE ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status bar */}
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-pill)', border: '1px dashed var(--accent)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: 13, color: 'var(--accent-light)', fontWeight: 600 }}>
              🔒 VISUAL FEED TERMINATED
            </span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              Need {requiredCorrect}/{questions.length} • Attempt {attemptsUsed + 1}/{maxRetries + 1}
            </span>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--radius-md)',
              background: feedback.correct ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${feedback.correct ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
              fontSize: 13, fontWeight: 600, textAlign: 'center',
              color: feedback.correct ? '#34d399' : '#f87171'
            }}>
              {feedback.correct ? '✅' : '❌'} {feedback.message}
            </div>
          )}

          {/* Answered progress bar */}
          <div style={{ display: 'flex', gap: 4 }}>
            {questions.map(q => (
              <div key={q.id} style={{
                flex: 1, height: 4, borderRadius: 4,
                background: answers[q.id] !== undefined ? 'var(--accent)' : 'var(--bg-tertiary)',
                transition: 'background 0.2s'
              }} />
            ))}
          </div>

          {/* Questions */}
          {questions.map((q, qIndex) => (
            <div key={q.id || qIndex} style={{
              background: 'var(--bg-card-elevated)', padding: '16px',
              borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 10,
              border: answers[q.id] !== undefined ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent'
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', gap: 6 }}>
                <span style={{ color: 'var(--accent-light)' }}>Q{qIndex + 1}.</span>
                <span>{q.text}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {q.options.map((opt, optIndex) => {
                  const isSelected = answers[q.id] === optIndex
                  return (
                    <div
                      key={optIndex}
                      className={`choice-pill ${isSelected ? 'choice-pill--selected' : ''}`}
                      style={{ padding: '10px 12px', minHeight: 46, fontSize: 13 }}
                      onClick={() => handleSelectAnswer(q.id, optIndex)}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt}</span>
                      <div className="choice-radio" style={{ width: 16, height: 16 }} />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Submit button */}
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!allAnswered || loading}
            style={{ fontSize: 16 }}
          >
            {loading
              ? 'Verifying Recall...'
              : !allAnswered
                ? `Answer All Questions (${Object.keys(answers).length}/${questions.length})`
                : `Submit All Answers ✓`}
          </button>

          <button type="button" className="btn-secondary" onClick={handleRetry} style={{ fontSize: 12 }}>
            🔄 Re-open Visual Feed & Retry
          </button>
        </div>
      )}
    </div>
  )
}
