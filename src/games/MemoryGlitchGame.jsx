import React, { useState, useEffect } from 'react'

export default function MemoryGlitchGame({ config, onValidate, loading, setCustomBadge }) {
  const [phase, setPhase] = useState('memorize') // 'memorize' | 'quiz'
  const [timeLeft, setTimeLeft] = useState(config.display_time || 12)
  const [answers, setAnswers] = useState({})

  const questions = config.questions || []
  const requiredCorrect = config.required_correct || 4

  useEffect(() => {
    if (phase !== 'memorize') return

    if (timeLeft <= 0) {
      setPhase('quiz')
      setCustomBadge?.(null)
      return
    }

    setCustomBadge?.({ content: timeLeft, label: 'SEC' })

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [phase, timeLeft, setCustomBadge])

  const handleSelectAnswer = (qId, optionIdx) => {
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }))
  }

  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id] !== undefined)

  const handleRetry = () => {
    setAnswers({})
    setTimeLeft(config.display_time || 12)
    setPhase('memorize')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {phase === 'memorize' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' }}>
          <div
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#fbbf24',
              fontSize: 12,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            ⚠️ MEMORIZE SCENE • FEED CLOSING IN {timeLeft}s
          </div>

          {/* Detailed Scene Graphic */}
          <div className="game-media-frame" style={{ height: 240, background: '#090d16' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="240" fill="#0f172a"/>
              <path d="M0 0 L100 60 L100 180 L0 240 Z" fill="#1e293b" stroke="#334155"/>
              <path d="M400 0 L300 60 L300 180 L400 240 Z" fill="#1e293b" stroke="#334155"/>
              <rect x="100" y="50" width="200" height="130" fill="#0b1120" stroke="#334155"/>

              {/* 4 Windows on back wall (Q2) */}
              <rect x="120" y="65" width="25" height="30" fill="#38bdf8" opacity="0.8" rx="2"/>
              <rect x="155" y="65" width="25" height="30" fill="#38bdf8" opacity="0.8" rx="2"/>
              <rect x="220" y="65" width="25" height="30" fill="#38bdf8" opacity="0.8" rx="2"/>
              <rect x="255" y="65" width="25" height="30" fill="#38bdf8" opacity="0.8" rx="2"/>

              {/* Red Door (Q1) */}
              <rect x="20" y="80" width="60" height="110" fill="#dc2626" stroke="#b91c1c" strokeWidth="2" rx="4"/>
              <circle cx="70" cy="135" r="4" fill="#fbbf24"/>

              {/* Sign with ENISo (Q3) */}
              <rect x="160" y="15" width="80" height="22" fill="#6366f1" rx="4"/>
              <text x="200" y="30" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="sans-serif">ENISo</text>

              {/* Arrow pointing Right (Q4) */}
              <path d="M170 115 L210 115 L210 105 L235 120 L210 135 L210 125 L170 125 Z" fill="#10b981"/>

              {/* Table with a Plant on it (Q5) */}
              <rect x="140" y="160" width="120" height="14" fill="#475569" rx="2"/>
              <rect x="155" y="174" width="10" height="35" fill="#334155"/>
              <rect x="235" y="174" width="10" height="35" fill="#334155"/>
              <path d="M190 160 L195 145 L205 145 L210 160 Z" fill="#b45309"/>
              <circle cx="200" cy="138" r="12" fill="#22c55e"/>
              <circle cx="192" cy="132" r="8" fill="#16a34a"/>
              <circle cx="208" cy="132" r="8" fill="#15803d"/>
            </svg>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setPhase('quiz')
              setCustomBadge?.(null)
            }}
          >
            I'm Ready Now → Proceed to Recall Test
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-pill)',
              border: '1px dashed var(--accent)',
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--accent-light)',
              fontWeight: 600
            }}
          >
            🔒 VISUAL FEED TERMINATED (Pass {requiredCorrect}/{questions.length} to solve)
          </div>

          {/* 5 Questions */}
          {questions.map((q, qIndex) => (
            <div
              key={q.id || qIndex}
              style={{
                background: 'var(--bg-card-elevated)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}
            >
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

          <button
            type="button"
            className="btn-primary"
            onClick={() => onValidate({ answers })}
            disabled={!allAnswered || loading}
          >
            {loading ? 'Validating Neural Responses...' : `Submit Answers (${Object.keys(answers).length}/${questions.length})`}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleRetry}
            style={{ fontSize: 12 }}
          >
            🔄 Re-open Visual Feed & Retry
          </button>
        </div>
      )}
    </div>
  )
}
