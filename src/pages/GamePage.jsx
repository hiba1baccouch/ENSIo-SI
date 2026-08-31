import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

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

export default function GamePage() {
  const { stationId, teamId } = useParams()
  const navigate = useNavigate()

  const [station, setStation] = useState(null)
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState(null)

  // Game session states
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [unlockedHint, setUnlockedHint] = useState(null)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [isGameOver, setIsGameOver] = useState(false)
  const [gameOverMsg, setGameOverMsg] = useState('')

  // Initialize Game Session
  useEffect(() => {
    async function initGame() {
      try {
        setLoading(true)
        const [stData, tmData] = await Promise.all([
          api.getStation(stationId),
          api.getTeam(teamId)
        ])
        setStation(stData)
        setTeam(tmData)

        // Find progress record for this station
        const progress = tmData.progress?.find(p => p.station_id === parseInt(stationId))
        if (progress) {
          setAttemptsUsed(progress.attempts_used || 0)
          if (progress.status === 'completed' && progress.hint_unlocked) {
            // Already solved! Fetch hint
            const hintRes = await api.getHint(stationId, teamId)
            setUnlockedHint(hintRes.hint)
            setPointsEarned(progress.score_earned || stData.points_reward)
          }
        }

        // Inform backend game has started
        await api.startGame(teamId, stationId)
      } catch (err) {
        setError(err.message || 'Failed to start game session')
      } finally {
        setLoading(false)
      }
    }
    initGame()
  }, [stationId, teamId])

  // Handle Validation callback for all games
  const handleValidate = useCallback(async (answer) => {
    if (!station || validating) return
    try {
      setValidating(true)
      const res = await api.validateAnswer(teamId, stationId, station.game_type, answer)

      if (res.attempts_used !== undefined) {
        setAttemptsUsed(res.attempts_used)
      }

      if (res.correct) {
        setUnlockedHint(res.hint)
        setPointsEarned(res.points_earned || station.points_reward)
      } else if (res.game_over) {
        setIsGameOver(true)
        setGameOverMsg(res.message)
      }

      return res
    } catch (err) {
      console.error('Validation error', err)
      return { correct: false, message: err.message || 'Server validation failed' }
    } finally {
      setValidating(false)
    }
  }, [station, teamId, stationId, validating])

  const handleRetryGameOver = () => {
    setIsGameOver(false)
    setAttemptsUsed(0)
    // Reload page
    window.location.reload()
  }

  if (loading) return <LoadingSpinner text="Booting Neural Game Simulator..." />

  if (error || !station || !team) {
    return (
      <div className="page justify-center items-center">
        <div className="card card--error text-center" style={{ padding: 'var(--sp-6)' }}>
          <h2 className="heading-3">Initialization Error</h2>
          <p className="text-secondary text-sm" style={{ margin: 'var(--sp-3) 0' }}>
            {error || 'Unable to start this station.'}
          </p>
          <button className="btn btn--primary" onClick={() => navigate(`/station/${stationId}`)}>
            Back to Station
          </button>
        </div>
      </div>
    )
  }

  const renderGameEngine = () => {
    const props = {
      config: station.config || {},
      onValidate: handleValidate,
      attemptsUsed,
      loading: validating
    }

    switch (station.game_type) {
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
            <p>Unsupported game protocol: {station.game_type}</p>
          </div>
        )
    }
  }

  const nextStationId = parseInt(stationId) < 7 ? parseInt(stationId) + 1 : null

  return (
    <div className="page" style={{ gap: 'var(--sp-4)', paddingBottom: 'var(--sp-12)' }}>
      {/* Header Bar */}
      <GameHeader
        stationName={`Station ${station.id}: ${station.name}`}
        teamName={team.name}
        teamColor={team.color}
        attemptsUsed={attemptsUsed}
        maxAttempts={station.config?.max_attempts || 0}
        progress={((parseInt(stationId) - 1) / 7) * 100}
      />

      {/* Main Game Interface */}
      {renderGameEngine()}

      {/* Unlocked Hint Success Modal */}
      {unlockedHint && (
        <HintCard
          hint={unlockedHint}
          pointsEarned={pointsEarned}
          nextStationId={nextStationId}
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
