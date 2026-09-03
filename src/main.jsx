import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Global Error Boundary — prevents a full blank page on any unhandled React crash
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }
  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || (typeof this.state.error === 'string' ? this.state.error : '')
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0f172a', color: '#f1f5f9', padding: 24, textAlign: 'center', gap: 16
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Something went wrong</h2>
          <p style={{ color: '#94a3b8', maxWidth: 360, margin: 0, fontSize: 13, wordBreak: 'break-word' }}>
            {msg || 'An unexpected error occurred. Please reload the page.'}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
              style={{
                background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 12,
                padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer'
              }}
            >
              🔄 Reload App
            </button>
            <button
              onClick={() => {
                localStorage.clear()
                sessionStorage.clear()
                window.location.href = '/'
              }}
              style={{
                background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 12,
                padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer'
              }}
            >
              🧹 Clear Cache & Reset
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
