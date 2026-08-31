import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import '../admin.css'
import AdminLogin from '../admin/AdminLogin'
import TeamManager from '../admin/TeamManager'
import StationEditor from '../admin/StationEditor'
import EventLog from '../admin/EventLog'
import QRGenerator from '../admin/QRGenerator'
import LoadingSpinner from '../components/LoadingSpinner'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(sessionStorage.getItem('admin_key')))
  const [activeTab, setActiveTab] = useState('teams')
  const [teams, setTeams] = useState([])
  const [stations, setStations] = useState([])
  const [events, setEvents] = useState([])
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState(null)

  const loadAdminData = async () => {
    try {
      setLoading(true)
      const [teamsData, stationsData, eventsData, settingsData] = await Promise.all([
        api.adminGetTeams(),
        api.adminGetStations(),
        api.adminGetEvents(),
        api.adminGetSettings()
      ])
      setTeams(teamsData)
      setStations(stationsData)
      setEvents(eventsData)
      setSettings(settingsData)
    } catch (err) {
      console.error('Failed to load admin data', err)
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        sessionStorage.removeItem('admin_key')
        setIsAuthenticated(false)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (isAuthenticated) loadAdminData() }, [isAuthenticated])

  const handleLogout = () => { sessionStorage.removeItem('admin_key'); setIsAuthenticated(false) }

  const handleUpdateSetting = async (key, value) => {
    try {
      await api.adminUpdateSetting(key, value)
      setSettings(prev => ({ ...prev, [key]: value }))
      setSettingsMsg({ type: 'success', text: `"${key}" updated.` })
      setTimeout(() => setSettingsMsg(null), 3000)
    } catch (err) {
      setSettingsMsg({ type: 'error', text: err.message })
    }
  }

  if (!isAuthenticated) return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />

  return (
    <div className="adm-page">
      {/* Top Bar */}
      <div className="adm-topbar">
        <div className="adm-topbar__brand">
          <span className="adm-topbar__title">Admin Panel</span>
          <span className="adm-topbar__sub">ENISo Integration Week</span>
        </div>
        <div className="adm-topbar__actions">
          <Link to="/" className="adm-btn adm-btn--ghost adm-btn--sm">App View</Link>
          <button className="adm-btn adm-btn--secondary adm-btn--sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="adm-tabs">
        {[
          { key: 'teams', label: `Teams (${teams.length})` },
          { key: 'stations', label: `Stations (${stations.length})` },
          { key: 'qr', label: '📷 QR Posters' },
          { key: 'events', label: `Event Log (${events.length})` },
          { key: 'settings', label: 'Settings' },
        ].map(t => (
          <button key={t.key} className={`adm-tab ${activeTab === t.key ? 'adm-tab--active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="adm-container">
        {loading ? (
          <LoadingSpinner text="Loading..." />
        ) : (
          <>
            {activeTab === 'teams' && <TeamManager teams={teams} onRefresh={loadAdminData} />}
            {activeTab === 'stations' && <StationEditor stations={stations} onRefresh={loadAdminData} />}
            {activeTab === 'qr' && <QRGenerator stations={stations} onClose={() => setActiveTab('stations')} />}
            {activeTab === 'events' && <EventLog events={events} onRefresh={loadAdminData} />}
            {activeTab === 'settings' && (
              <div className="adm-section">
                <div className="adm-section-header">
                  <div>
                    <h2 className="adm-section-title">Game Settings</h2>
                    <p className="adm-section-sub">Global game configuration and toggles</p>
                  </div>
                </div>

                {settingsMsg && (
                  <div className={`adm-alert adm-alert--${settingsMsg.type}`}>{settingsMsg.text}</div>
                )}

                <div className="adm-card">
                  <div style={{ padding: '0 16px' }}>
                    <div className="adm-toggle-row">
                      <div className="adm-toggle-info">
                        <h4>Sequential Station Progression</h4>
                        <p>Require teams to complete stations in order (1 → 2 → 3 ...).</p>
                      </div>
                      <button
                        className={`adm-btn adm-btn--sm ${settings.sequential_mode === 'true' ? 'adm-btn--primary' : 'adm-btn--secondary'}`}
                        onClick={() => handleUpdateSetting('sequential_mode', settings.sequential_mode === 'true' ? 'false' : 'true')}
                      >
                        {settings.sequential_mode === 'true' ? 'Strict (On)' : 'Free Roam (Off)'}
                      </button>
                    </div>

                    <div className="adm-toggle-row">
                      <div className="adm-toggle-info">
                        <h4>Tournament Active</h4>
                        <p>Master switch — pausing stops all new submissions.</p>
                      </div>
                      <button
                        className={`adm-btn adm-btn--sm ${settings.game_active === 'true' ? 'adm-btn--primary' : 'adm-btn--danger'}`}
                        onClick={() => handleUpdateSetting('game_active', settings.game_active === 'true' ? 'false' : 'true')}
                      >
                        {settings.game_active === 'true' ? 'Live' : 'Paused'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
