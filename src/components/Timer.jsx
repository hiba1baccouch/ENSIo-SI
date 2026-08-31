import { useState, useEffect, useRef } from 'react'

export default function Timer({ seconds, onComplete, running = true }) {
  const [remaining, setRemaining] = useState(seconds)
  const intervalRef = useRef(null)

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          onComplete?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, onComplete])

  const progress = remaining / seconds
  const dashOffset = 283 * (1 - progress)

  return (
    <div className="timer-circle">
      <svg className="timer-circle__svg" viewBox="0 0 100 100">
        <circle className="timer-circle__bg" cx="50" cy="50" r="45" />
        <circle
          className="timer-circle__progress"
          cx="50" cy="50" r="45"
          style={{
            strokeDashoffset: dashOffset,
            stroke: remaining <= 3 ? 'var(--error)' : 'var(--accent)',
          }}
        />
      </svg>
      <div className="timer-circle__text" style={{ color: remaining <= 3 ? 'var(--error)' : 'var(--text-primary)' }}>
        {remaining}
      </div>
    </div>
  )
}
