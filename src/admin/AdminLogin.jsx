import React, { useState } from 'react'
import { api } from '../api'

export default function AdminLogin({ onLoginSuccess }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim() || loading) return
    try {
      setLoading(true)
      setError(null)
      const res = await api.adminLogin(password.trim())
      if (res.success && res.key) {
        sessionStorage.setItem('admin_key', res.key)
        onLoginSuccess()
      }
    } catch (err) {
      setError(err.message || 'Invalid administrator password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f4f6f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 32, width: '100%', maxWidth: 380, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Admin Login</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>ENISo Integration Week — Organizer Panel</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Password</label>
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              style={{ padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, color: '#0f172a', fontFamily: 'inherit', outline: 'none' }}
            />
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!password.trim() || loading}
            style={{ padding: '11px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: !password.trim() ? 0.5 : 1 }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
