import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'

/**
 * QRGenerator Component
 * Generates high-res downloadable QR codes & printable campus posters for all stations.
 */
export default function QRGenerator({ stations, selectedStation = null, onClose }) {
  const defaultBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://eniso-si.vercel.app'
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl)
  const [activeStationId, setActiveStationId] = useState(selectedStation ? selectedStation.id : stations[0]?.id || 1)
  const [qrDataUrls, setQrDataUrls] = useState({})
  const [generating, setGenerating] = useState(true)

  // Generate QR codes for all stations
  useEffect(() => {
    async function generateAllQRs() {
      try {
        setGenerating(true)
        const urls = {}
        for (const st of stations) {
          const targetUrl = `${baseUrl.replace(/\/$/, '')}/station/${st.id}`
          const dataUrl = await QRCode.toDataURL(targetUrl, {
            width: 600,
            margin: 2,
            errorCorrectionLevel: 'H',
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          })
          urls[st.id] = dataUrl
        }
        setQrDataUrls(urls)
      } catch (err) {
        console.error('Failed to generate QR codes', err)
      } finally {
        setGenerating(false)
      }
    }

    if (stations && stations.length > 0) {
      generateAllQRs()
    }
  }, [stations, baseUrl])

  const activeStation = stations.find((s) => s.id === parseInt(activeStationId)) || stations[0]

  const handleDownload = (st) => {
    const dataUrl = qrDataUrls[st.id]
    if (!dataUrl) return
    const link = document.createElement('a')
    link.download = `ENISo_Station_${st.id}_${st.name.replace(/\s+/g, '_')}_QR.png`
    link.href = dataUrl
    link.click()
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="adm-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="adm-modal" style={{ maxWidth: 840, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header (Hidden on print) */}
        <div className="adm-modal__header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="adm-modal__title">📷 Station QR Code & Poster Generator</h3>
            <p className="adm-modal__sub">Generate, download PNGs, and print physical posters for campus beacons</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="adm-btn adm-btn--primary" onClick={handlePrint}>
              🖨️ Print Posters
            </button>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="adm-modal__body" style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
          {/* Settings Bar (Hidden on print) */}
          <div
            className="no-print"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div className="adm-field" style={{ margin: 0 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                TARGET APP BASE URL (Encoded into QR codes)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="adm-input"
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://eniso-si.vercel.app"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="adm-btn adm-btn--secondary adm-btn--sm"
                  onClick={() => setBaseUrl(defaultBaseUrl)}
                >
                  Reset Current
                </button>
              </div>
            </div>

            {/* Station Selector Pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`adm-btn adm-btn--sm ${activeStationId === 'all' ? 'adm-btn--primary' : 'adm-btn--secondary'}`}
                onClick={() => setActiveStationId('all')}
              >
                All 7 Posters (Print View)
              </button>
              {stations.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`adm-btn adm-btn--sm ${activeStationId === s.id ? 'adm-btn--primary' : 'adm-btn--secondary'}`}
                  onClick={() => setActiveStationId(s.id)}
                >
                  Station {s.id} ({s.name})
                </button>
              ))}
            </div>
          </div>

          {/* Single Station Preview or All Stations Grid */}
          {generating ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              Generating high-resolution QR codes...
            </div>
          ) : activeStationId === 'all' ? (
            /* ALL POSTERS PRINT VIEW */
            <div className="print-posters-container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {stations.map((st) => (
                <PosterCard
                  key={st.id}
                  station={st}
                  qrDataUrl={qrDataUrls[st.id]}
                  targetUrl={`${baseUrl.replace(/\/$/, '')}/station/${st.id}`}
                  onDownload={() => handleDownload(st)}
                />
              ))}
            </div>
          ) : (
            /* SINGLE STATION PREVIEW */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <PosterCard
                station={activeStation}
                qrDataUrl={qrDataUrls[activeStation.id]}
                targetUrl={`${baseUrl.replace(/\/$/, '')}/station/${activeStation.id}`}
                onDownload={() => handleDownload(activeStation)}
              />
            </div>
          )}
        </div>

        {/* Modal Footer (Hidden on print) */}
        <div className="adm-modal__footer no-print" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Tip: For official event day, print in A4 color mode.
          </div>
          <button type="button" className="adm-btn adm-btn--secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .adm-modal, .adm-overlay {
            position: static !important;
            background: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-posters-container, .print-posters-container * {
            visibility: visible;
          }
          .poster-card {
            visibility: visible !important;
            page-break-after: always;
            box-shadow: none !important;
            border: 2px solid #0f172a !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 600px !important;
          }
          .poster-card * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Individual Poster Card Component
 */
function PosterCard({ station, qrDataUrl, targetUrl, onDownload }) {
  return (
    <div
      className="poster-card"
      style={{
        background: '#ffffff',
        border: '2px solid #e2e8f0',
        borderRadius: 16,
        padding: '32px 24px',
        maxWidth: 440,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        margin: '0 auto'
      }}
    >
      {/* Top Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 16px',
          borderRadius: 20,
          background: '#4f46e5',
          color: '#ffffff',
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}
      >
        ENISo Integration Week
      </div>

      {/* Station Number & Name */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          CAMPUS CHECKPOINT
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
          STATION #{station.id}
        </h2>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#334155' }}>
          {station.name}
        </div>
      </div>

      {/* High-Resolution QR Code */}
      <div
        style={{
          padding: 16,
          background: '#ffffff',
          borderRadius: 16,
          border: '3px solid #0f172a',
          display: 'inline-block',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`QR Code for Station ${station.id}`}
            style={{ width: 220, height: 220, display: 'block' }}
          />
        ) : (
          <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            Loading QR...
          </div>
        )}
      </div>

      {/* Scan Instructions */}
      <div style={{ maxWidth: 320 }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          📱 SCAN QR CODE WITH YOUR PHONE
        </p>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
          Open the ENISo Quest app scanner on your squad device to unlock Challenge #{station.id}.
        </p>
      </div>

      {/* Target URL Readout */}
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 11,
          color: '#475569',
          background: '#f1f5f9',
          padding: '6px 12px',
          borderRadius: 6,
          wordBreak: 'break-all',
          maxWidth: '100%'
        }}
      >
        {targetUrl}
      </div>

      {/* Download Button (Hidden on Print) */}
      <div className="no-print" style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button
          type="button"
          className="adm-btn adm-btn--secondary adm-btn--sm"
          onClick={onDownload}
          style={{ fontSize: 12, padding: '6px 14px' }}
        >
          ⬇️ Download High-Res PNG
        </button>
      </div>
    </div>
  )
}
