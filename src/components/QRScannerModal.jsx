import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'

export default function QRScannerModal({ onClose }) {
  const navigate = useNavigate()
  const [cameraError, setCameraError] = useState(null)
  const qrRef = useRef(null)
  const stoppedRef = useRef(false) // guard: only stop once

  const safeStop = async () => {
    if (stoppedRef.current) return
    stoppedRef.current = true
    try {
      if (qrRef.current) {
        await qrRef.current.stop()
        qrRef.current.clear?.()
      }
    } catch {
      // Ignore — scanner may already be stopped/paused
    }
  }

  useEffect(() => {
    async function startScanner() {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader-target')
        qrRef.current = html5QrCode

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            handleDecodedPayload(decodedText)
          },
          () => {}
        )
      } catch (err) {
        console.warn('Camera failed or blocked', err)
        setCameraError('Camera access unavailable. Please allow camera permissions and try again.')
      }
    }

    startScanner()

    // Cleanup on unmount — safeStop guards against double-stop
    return () => { safeStop() }
  }, [])

  const handleDecodedPayload = (text) => {
    // Stop scanner first, then navigate
    safeStop().then(() => {
      const match = text.match(/station\/([0-9]+)/i)
      if (match) {
        const stationId = match[1]
        navigate(`/station/${stationId}`)
        onClose?.()
      } else {
        // Show inline error instead of alert (alerts block Safari)
        setCameraError(`Unrecognized QR code. Expected an ENISo Station QR code.`)
        stoppedRef.current = false // allow retry
      }
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 9, 15, 0.9)',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
            📷 Scan Campus QR Beacon
          </h3>
          <button
            onClick={() => { safeStop(); onClose?.() }}
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
            <div style={{ padding: 20, textAlign: 'center', color: '#fca5a5', fontSize: 13, lineHeight: 1.5 }}>
              📷 {cameraError}
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, textAlign: 'center', color: 'var(--text-secondary)', marginTop: 12 }}>
          Point your phone camera directly at the QR code posted at your next station.
        </p>
      </div>
    </div>
  )
}
