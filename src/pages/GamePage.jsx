import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { writeTeamBackup } from '../teamBackup'
import { quizStations } from '../../content/quizStations.js'

// Components
import GameHeader from '../components/GameHeader'
import HintCard from '../components/HintCard'
import GameOver from '../components/GameOver'
import LoadingSpinner from '../components/LoadingSpinner'

// Games
import ZoomGame from '../games/ZoomGame'
import MemoryGlitchGame from '../games/MemoryGlitchGame'
import FindDifferenceGame from '../games/FindDifferenceGame'
import DigitalEscapeGame from '../games/DigitalEscapeGame'
import MapLyingGame from '../games/MapLyingGame'
import HiddenMessageGame from '../games/HiddenMessageGame'
import EmojiCodeGame from '../games/EmojiCodeGame'

// Local validation engine in case of server failure or offline mode
function performLocalValidation(gameType, config, answer, newAttempts) {
  const localStation = quizStations.find(s => s.game_type === gameType) || {}
  const fullConfig = { ...localStation.config, ...config }

  switch (gameType) {
    case 'zoom': {
      const correctOpt = fullConfig.options?.find(o => o.correct)
      const isCorrect = answer === correctOpt?.id || answer === correctOpt?.text
      return {
        correct: isCorrect,
        message: isCorrect ? 'Spot Verified! Location confirmed.' : `Incorrect location.`,
        attempts_used: newAttempts,
        hint: localStation.hint_text
      }
    }
    case 'memory_glitch': {
      // Use local quizStations for correct answers (server strips them from sanitized config)
      const localConfig = localStation.config || {}
      let count = 0
      for (const q of localConfig.questions || []) {
        if (answer?.answers?.[q.id] === q.correct) count++
      }
      const isCorrect = count >= (localConfig.required_correct || 4)
      return {
        correct: isCorrect,
        message: isCorrect ? `Recall Confirmed! Scored ${count}/${localConfig.questions?.length || 5}.` : `Only ${count} correct — need ${localConfig.required_correct || 4}. Try again.`,
        attempts_used: newAttempts,
        hint: localStation.hint_text
      }
    }
    case 'find_difference': {
      const guess = parseInt(answer?.guess_count ?? answer)
      const target = fullConfig.answer_count || 4
      const isCorrect = guess === target
      return {
        correct: isCorrect,
        message: isCorrect ? `Correct! There are ${target} differences.` : `Incorrect count.`,
        attempts_used: newAttempts,
        hint: localStation.hint_text
      }
    }
    case 'digital_escape': {
      const puzzle = fullConfig.puzzles?.find(p => p.id === answer?.puzzle_id) || fullConfig.puzzles?.[0]
      const isCorrect = puzzle && String(answer?.answer || answer).toLowerCase().trim() === String(puzzle.answer).toLowerCase().trim()
      return {
        correct: isCorrect,
        message: isCorrect ? 'Cipher Sequence Verified!' : 'Cipher sequence invalid.',
        attempts_used: newAttempts,
        hint: localStation.hint_text
      }
    }
    case 'map_lying': {
      const localConfig = localStation.config || {}
      const guess = parseInt(answer?.guess_count ?? 0)
      const target = localConfig.answer_count ?? 1
      const isCorrect = guess === target
      return {
        correct: isCorrect,
        message: isCorrect ? 'Cartographic Phantom Detected! Anomaly confirmed.' : `Incorrect count. Try again!`,
        attempts_used: newAttempts,
        hint: localStation.hint_text
      }
    }
    case 'hidden_message': {
      const word = String(answer?.word || answer).toUpperCase().trim()
      const target = String(fullConfig.final_word || 'Samsung').toUpperCase().trim()
      const isCorrect = word === target
      return {
        correct: isCorrect,
        message: isCorrect ? 'Hidden Codeword Verified!' : 'Incorrect codeword. Try again!',
        attempts_used: newAttempts,
        hint: localStation.hint_text
      }
    }
    case 'emoji_code': {
      const round = fullConfig.rounds?.find(r => r.id === answer?.round_id) || fullConfig.rounds?.[0]
      const isCorrect = round && String(answer?.answer || answer).toLowerCase().trim() === String(round.answer).toLowerCase().trim()
      return {
        correct: isCorrect,
        message: isCorrect ? 'Emoji Cipher Solved!' : 'Incorrect interpretation.',
        attempts_used: newAttempts,
        hint: localStation.hint_text
      }
    }
    default:
      return { correct: false, message: 'Unknown game protocol' }
  }
}

export default function GamePage() {
  const { stationId, teamId } = useParams()
  const navigate = useNavigate()

  const [station, setStation] = useState(null)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)

  // Game session states
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [unlockedHint, setUnlockedHint] = useState(null)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [gameOverMsg, setGameOverMsg] = useState('')
  const [lastResult, setLastResult] = useState(null)

  // Initialize Game Session with automatic local fallback
  useEffect(() => {
    async function initGame() {
      try {
        setLoading(true)

        // Try API first
        const [stData, tmData] = await Promise.all([
          api.getStation(stationId).catch(() => null),
          api.getTeam(teamId).catch(() => null)
        ])

        // 100% Guaranteed station data fallback
        const localCodeStation = quizStations.find(s => s.id === parseInt(stationId)) || quizStations[0]
        const finalStation = stData || localCodeStation
        setStation(finalStation)

        // 100% Guaranteed team data fallback
        const fallbackTeam = tmData || {
          id: teamId || 'team-1',
          name: localStorage.getItem('eniso_locked_team_name') || 'Squad',
          color: localStorage.getItem('eniso_locked_team_color') || '#4f46e5',
          avatar: localStorage.getItem('eniso_locked_team_avatar') || '⚡',
          score: 0,
          current_station: 1,
          progress: []
        }
        setTeam(fallbackTeam)
        if (tmData) writeTeamBackup(tmData)

        // Find progress record for this station
        const progress = fallbackTeam.progress?.find(p => p.station_id === parseInt(stationId))
        if (progress) {
          setAttemptsUsed(progress.attempts_used || 0)
          if (progress.status === 'completed' && progress.hint_unlocked) {
            setUnlockedHint(finalStation.hint_text)
            setPointsEarned(progress.score_earned || finalStation.points_reward || 100)
          }
        }

        // Best effort backend notification
        await api.startGame(teamId, stationId).catch(() => null)
      } catch (err) {
        console.error('Init game error, using local fallback:', err)
        const localStation = quizStations.find(s => s.id === parseInt(stationId)) || quizStations[0]
        setStation(localStation)
        setTeam({
          id: teamId || 'team-1',
          name: localStorage.getItem('eniso_locked_team_name') || 'Squad',
          color: '#4f46e5',
          score: 0
        })
      } finally {
        setLoading(false)
      }
    }
    initGame()
  }, [stationId, teamId])

  // Handle Validation callback for all games with local fallback
  const handleValidate = useCallback(async (answer) => {
    if (!station || validating) return
    try {
      setValidating(true)

      // Try server validation first
      let res = await api.validateAnswer(teamId, stationId, station.game_type, answer).catch(() => null)

      // Fallback local validation if server is unreachable
      if (!res) {
        res = performLocalValidation(station.game_type, station.config || {}, answer, attemptsUsed + 1)
      }

      const nextAttempts = res.attempts_used ?? (attemptsUsed + 1)
      setAttemptsUsed(nextAttempts)
      setLastResult({ correct: res.correct, answer })

      if (res.correct) {
        setLastResult(null) // clear on success (hint card takes over)
        setUnlockedHint(res.hint || station.hint_text)
        setPointsEarned(res.points_earned || (nextAttempts === 1 ? 100 : nextAttempts === 2 ? 75 : nextAttempts === 3 ? 50 : 0))

        const fresh = await api.getTeam(teamId).catch(() => null)
        if (fresh) {
          setTeam(fresh)
          writeTeamBackup(fresh)
        }
      } else if (res.game_over) {
        setIsGameOver(true)
        setGameOverMsg(res.message)
      }

      return res
    } catch (err) {
      console.error('Validation error', err)
      return { correct: false, message: err.message || 'Validation failed' }
    } finally {
      setValidating(false)
    }
  }, [station, teamId, stationId, validating, attemptsUsed])

  const handleRetryGameOver = () => {
    setIsGameOver(false)
    setAttemptsUsed(0)
    window.location.reload()
  }

  if (loading) return <LoadingSpinner text="Opening Quiz Station..." />

  const currentStation = station || quizStations[0]
  const currentTeam = team || { name: 'Squad', color: '#4f46e5', score: 0 }

  const renderGameEngine = () => {
    const props = {
      config: currentStation.config || {},
      onValidate: handleValidate,
      attemptsUsed,
      loading: validating,
      lastResult
    }

    switch (currentStation.game_type) {
      case 'zoom':
        return <ZoomGame {...props} />
      case 'memory_glitch':
        return <MemoryGlitchGame {...props} />
      case 'find_difference':
        return <FindDifferenceGame {...props} />
      case 'digital_escape':
        return <DigitalEscapeGame {...props} />
      case 'map_lying':
        return <MapLyingGame {...props} />
      case 'hidden_message':
        return <HiddenMessageGame {...props} />
      case 'emoji_code':
        return <EmojiCodeGame {...props} />
      default:
        return (
          <div className="card text-center" style={{ padding: 'var(--sp-6)' }}>
            <p>Unsupported game protocol: {currentStation.game_type}</p>
          </div>
        )
    }
  }

  return (
    <div className="page" style={{ gap: 'var(--sp-4)', paddingBottom: 'var(--sp-12)' }}>
      {/* Header Bar */}
      <GameHeader
        stationName={`Station ${currentStation.id}: ${currentStation.name}`}
        teamName={currentTeam.name || 'Squad'}
        teamColor={currentTeam.color || '#4f46e5'}
        teamScore={currentTeam.score || 0}
        attemptsUsed={attemptsUsed}
        maxAttempts={currentStation.config?.max_attempts || 0}
        progress={((parseInt(stationId || '1') - 1) / 7) * 100}
      />

      {/* Main Game Interface */}
      {renderGameEngine()}

      {/* Unlocked Hint Success Modal */}
      {unlockedHint && (
        <HintCard
          hint={unlockedHint}
          pointsEarned={pointsEarned}
          stationNumber={currentStation.id}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOver
          message={gameOverMsg}
          onRetry={handleRetryGameOver}
          canRetry={true}
        />
      )}
    </div>
  )
}
