import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import HomePage from './pages/HomePage'
import StationPage from './pages/StationPage'
import GamePage from './pages/GamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import AdminPage from './pages/AdminPage'

function RootConstraint() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    if (isAdmin) {
      root.style.maxWidth = 'none'
      root.style.boxShadow = 'none'
    } else {
      root.style.maxWidth = '480px'
      root.style.boxShadow = '0 0 50px rgba(0,0,0,0.5)'
    }
  }, [isAdmin])

  return null
}

function App() {
  return (
    <>
      <RootConstraint />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/station/:stationId" element={<StationPage />} />
        <Route path="/game/:stationId/:teamId" element={<GamePage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </>
  )
}

export default App
