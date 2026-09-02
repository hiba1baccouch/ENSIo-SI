import React, { useState, useEffect } from 'react'

export default function ZoomGame({ config, onValidate, attemptsUsed = 0, loading, lastResult }) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [wrongAnswers, setWrongAnswers] = useState([])
  const [shakeId, setShakeId] = useState(null)

  const options = config.options || []
  const question = config.question || 'Où a été prise cette photo sur le campus ?'
  const category = config.category || 'Campus Quiz'
  const questionNumber = config.question_number || 1
  const totalQuestions = config.total_questions || 7

  const attemptPoints = attemptsUsed === 0 ? 100 : attemptsUsed === 1 ? 75 : attemptsUsed === 2 ? 50 : 0

  // When a wrong answer comes back, mark ONLY that specific option as wrong
  useEffect(() => {
    if (lastResult && !lastResult.correct && lastResult.answer) {
      const wrongVal = lastResult.answer
      setWrongAnswers((prev) => (prev.includes(wrongVal) ? prev : [...prev, wrongVal]))
      setShakeId(wrongVal)
      setSelectedOption(null)

      const timer = setTimeout(() => {
        setShakeId(null)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [lastResult])

  const handleSubmit = async () => {
    if (!selectedOption || loading) return
    await onValidate(selectedOption)
  }

  const isOptionWrong = (opt) => {
    return wrongAnswers.includes(opt.id) || wrongAnswers.includes(opt.text)
  }

  const isOptionSelected = (opt) => {
    return selectedOption === opt.id || selectedOption === opt.text
  }

  const getOptionStyle = (opt) => {
    const wrong = isOptionWrong(opt)
    const selected = isOptionSelected(opt)
    const shaking = shakeId === opt.id || shakeId === opt.text

    if (wrong) {
      return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '16px 18px',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '2px solid #ef4444',
        borderRadius: 14,
        fontSize: 15,
        fontWeight: 600,
        color: '#dc2626',
        textAlign: 'left',
        cursor: 'not-allowed',
        opacity: 0.9,
        transition: 'all 0.18s ease',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.12)',
        animation: shaking ? 'shake 0.5s ease' : 'none',
      }
    }

    if (selected) {
      return {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '16px 18px',
        background: 'rgba(79, 70, 229, 0.06)',
        border: '2px solid var(--accent)',
        borderRadius: 14,
        fontSize: 15,
        fontWeight: 600,
        color: 'var(--text-primary)',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: '0 0 0 4px rgba(79, 70, 229, 0.1)',
      }
    }

    // Normal unselected option
    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '16px 18px',
      background: '#ffffff',
      border: '1.5px solid var(--border-primary)',
      borderRadius: 14,
      fontSize: 15,
      fontWeight: 500,
      color: 'var(--text-primary)',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'all 0.18s ease',
      boxShadow: 'none',
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Progress Bar Header */}
      <div
        style={{
          background: 'var(--accent)',
          padding: '16px 20px 20px',
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          marginBottom: -16,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
            }}
          >
            {questionNumber} of {totalQuestions}
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 20,
              padding: '4px 12px',
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            +{attemptPoints} pts
          </div>
        </div>

        {/* Progress Track */}
        <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
          <div
            style={{
              width: `${(questionNumber / totalQuestions) * 100}%`,
              height: '100%',
              background: '#fff',
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          margin: '0 16px',
          padding: '20px 20px 16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          border: '1px solid var(--border-primary)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Category Tag */}
        <div
          style={{
            display: 'inline-block',
            background: 'rgba(79, 70, 229, 0.08)',
            color: 'var(--accent)',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 20,
            marginBottom: 10,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {category}
        </div>

        {/* Photo Frame */}
        <div
          style={{
            width: '100%',
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid var(--border-primary)',
            marginBottom: 16,
            background: '#f8fafc',
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {config.image ? (
            <img
              src={config.image}
              alt="Quiz visual"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <svg width="100%" height="180" viewBox="0 0 340 190" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="340" height="190" fill="#f1f5f9" />
              <path d="M20 160 L170 70 L320 160 Z" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
              <rect x="50" y="120" width="40" height="50" fill="#e2e8f0" stroke="#cbd5e1" />
              <rect x="150" y="100" width="40" height="70" fill="#e2e8f0" stroke="#cbd5e1" />
              <rect x="250" y="120" width="40" height="50" fill="#e2e8f0" stroke="#cbd5e1" />
              <rect x="155" y="150" width="16" height="22" fill="#4f46e5" rx="2" />
              <rect x="215" y="150" width="16" height="22" fill="#4f46e5" rx="2" />
              <text x="170" y="55" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="sans-serif" fontWeight="600">
                ENISo Campus
              </text>
              <text x="170" y="92" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="sans-serif">
                Add your image in Admin Panel
              </text>
            </svg>
          )}
        </div>

        {/* Wrong answer banner */}
        {wrongAnswers.length > 0 && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              color: '#dc2626',
              marginBottom: 12,
              textAlign: 'center',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            ❌ Mauvaise réponse — Essayez une autre option !
          </div>
        )}

        {/* Question */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Question {String(questionNumber).padStart(2, '0')}
        </p>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            marginBottom: 0,
          }}
        >
          {question}
        </h2>
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 16px 0' }}>
        {options.map((opt, idx) => {
          const wrong = isOptionWrong(opt)
          const selected = isOptionSelected(opt)

          return (
            <button
              key={opt.id || idx}
              type="button"
              disabled={loading || wrong}
              onClick={() => {
                if (!wrong && !loading) {
                  setSelectedOption(opt.id || opt.text)
                }
              }}
              style={getOptionStyle(opt)}
            >
              <span>{opt.text}</span>
              {wrong ? (
                <span style={{ fontSize: 18, flexShrink: 0, fontWeight: 800, color: '#ef4444' }}>✗</span>
              ) : (
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: selected ? '6px solid var(--accent)' : '2px solid #cbd5e1',
                    flexShrink: 0,
                    transition: 'all 0.18s ease',
                    background: '#fff',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Submit Button */}
      <div style={{ padding: '20px 16px 24px' }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedOption || loading}
          style={{
            width: '100%',
            padding: '16px',
            background: selectedOption ? 'var(--accent)' : '#e2e8f0',
            color: selectedOption ? '#fff' : '#94a3b8',
            border: 'none',
            borderRadius: 16,
            fontSize: 16,
            fontWeight: 700,
            cursor: selectedOption && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            boxShadow: selectedOption ? '0 6px 20px rgba(79,70,229,0.35)' : 'none',
          }}
        >
          {loading ? 'Vérification...' : 'Valider →'}
        </button>
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  )
}
