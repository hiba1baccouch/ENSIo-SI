import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScannerModal({ onClose }) {
  const navigate = useNavigate()
  const [manualCode, setManualCode] = useState('')
  const [cameraError, setCameraError] = useState(null)
  const [scanning, setScanning] = useState(true)
  const qrRef = useRef(null)

  useEffect(() => {
    let html5QrCode = null

    async function startScanner() {
      try {
        html5QrCode = new Html5Qrcode('qr-reader-target')
        qrRef.current = html5QrCode

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          (decodedText) => {
            // Handle QR decode
            handleDecodedPayload(decodedText)
          },
          (error) => {
            // normal scanning frames
          }
        )
      } catch (err) {
        console.warn('Camera failed or blocked', err)
        setCameraError('Camera access unavailable. Use manual beacon entry below.')
        setScanning(false)
      }
    }

    startScanner()

    return () => {
      if (qrRef.current) {
        qrRef.current.stop().catch(() => {}).then(() => {
          qrRef.current?.clear?.()
        })
      }
    }
  }, [])

  const handleDecodedPayload = (text) => {
    // Stop scanning
    if (qrRef.current) {
      qrRef.current.stop().catch(() => {})
    }

    // Extract station ID
    // Support formats: /station/3, http://.../station/3, or simply 3
    const match = text.match(/station\/([0-9]+)/i) || text.match(/^([1-7])$/)
    if (match) {
      const stationId = match[1]
      navigate(`/station/${stationId}`)
      onClose?.()
    } else {
      alert(`Scanned data unrecognized: "${text}". Expected an ENISo Station QR Code.`)
    }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    handleDecodedPayload(manualCode.trim())
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 100,
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div
        className="challenge-card"
        style={{
          maxWidth: 420,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
            📷 Scan Campus QR Beacon
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 20,
              cursor: 'pointer',
              padding: 4
            }}
          >
            ✕
          </button>
        </div>

        {/* Live Camera Box */}
        <div className="qr-scanner-box">
          <div id="qr-reader-target" style={{ width: '100%' }} />
          {cameraError && (
            <div style={{ padding: 20, textAlign: 'center', color: '#fca5a5', fontSize: 13 }}>
              📷 {cameraError}
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--text-secondary)' }}>
          Point your phone camera directly at the QR code posted at your next station.
        </p>

        {/* Manual Station Backup */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            OR ENTER BEACON PIN / NUMBER (1–7):
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="e.g. 1, 2, 3..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="font-mono text-center"
              style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ width: 'auto', padding: '10px 16px', minHeight: 0 }}
            >
              Verify →
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
