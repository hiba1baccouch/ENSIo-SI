import React, { useState, useRef, useEffect } from 'react'
import { api } from '../api'

/**
 * ImageUploader Component for Admin Panel
 * Supports:
 * - Direct photo upload from phone camera / file explorer
 * - Auto client-side compression (converts heavy phone photos to optimized WebP/JPEG)
 * - Live preview with change/remove actions
 * - Direct URL input fallback
 */
export default function ImageUploader({ label = 'Station Image', value = '', onChange }) {
  const [mode, setMode] = useState('upload') // 'upload' | 'url'
  const [urlInput, setUrlInput] = useState(value || '')
  const [compressing, setCompressing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const busy = compressing || uploading

  useEffect(() => {
    setUrlInput(value || '')
  }, [value])

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setCompressing(true)
      // Compress aggressively: 800px max, 0.65 quality to stay under Vercel's 4.5 MB limit
      const compressedDataUrl = await compressImage(file, 800, 0.65)
      // Safety check: warn if still too large (over 1.5 MB as base64)
      const sizeKB = Math.round(compressedDataUrl.length * 0.75 / 1024)
      if (sizeKB > 1500) {
        alert(`Image is ${sizeKB} KB after compression. This may be too large. Please use a smaller image.`)
        return
      }

      setCompressing(false)
      setUploading(true)
      const saved = await api.uploadImage(compressedDataUrl)
      onChange(saved.url)
      setUrlInput(saved.url)
    } catch (err) {
      console.error('Image upload failed', err)
      alert(err.message || 'Failed to save image to the database. Please try another image.')
    } finally {
      setCompressing(false)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUrlChange = (val) => {
    setUrlInput(val)
    onChange(val)
  }

  const handleRemove = () => {
    setUrlInput('')
    onChange('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="adm-field" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>{label}</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`adm-btn adm-btn--sm ${mode === 'upload' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
            style={{ fontSize: 11, padding: '3px 8px', height: 'auto' }}
            onClick={() => setMode('upload')}
          >
            Upload File
          </button>
          <button
            type="button"
            className={`adm-btn adm-btn--sm ${mode === 'url' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
            style={{ fontSize: 11, padding: '3px 8px', height: 'auto' }}
            onClick={() => setMode('url')}
          >
            Paste URL
          </button>
        </div>
      </div>

      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Live Preview & Actions */}
      {value ? (
        <div
          style={{
            position: 'relative',
            border: '1.5px solid #e2e8f0',
            borderRadius: 8,
            overflow: 'hidden',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ width: '100%', height: 180, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
            <img
              src={value}
              alt="Station visual preview"
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          </div>

          <div
            style={{
              width: '100%',
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#ffffff',
              borderTop: '1px solid #e2e8f0'
            }}
          >
            <span style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
              {value.startsWith('/api/images/')
                ? '✓ Saved in database — visible to all players after Save'
                : value.startsWith('data:')
                  ? `Local preview — ${Math.round(value.length * 0.75 / 1024)} KB`
                  : value}
            </span>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="adm-btn adm-btn--secondary adm-btn--sm"
                style={{ fontSize: 12, padding: '4px 10px' }}
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                {busy ? (uploading ? 'Saving...' : 'Optimizing...') : 'Replace'}
              </button>
              <button
                type="button"
                className="adm-btn adm-btn--danger adm-btn--sm"
                style={{ fontSize: 12, padding: '4px 10px' }}
                onClick={handleRemove}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : mode === 'upload' ? (
        /* Dropzone / Upload Box */
        <div
          onClick={() => !busy && fileInputRef.current?.click()}
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: 8,
            padding: '24px 16px',
            textAlign: 'center',
            cursor: busy ? 'wait' : 'pointer',
            background: '#f8fafc',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#cbd5e1')}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'rgba(79, 70, 229, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              color: '#4f46e5'
            }}
          >
            📷
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
              {uploading ? 'Saving image to database...' : compressing ? 'Optimizing Image...' : 'Click to Upload Photo or Take Picture'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              Supports JPG, PNG, WebP (auto-optimized for mobile)
            </div>
          </div>
        </div>
      ) : (
        /* Direct URL Input */
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="adm-input"
            type="text"
            placeholder="https://... or /images/..."
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Client-side canvas image compressor
 */
function compressImage(file, maxDimension = 800, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Try webp first, fallback to jpeg
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality)
          if (dataUrl.startsWith('data:image/webp')) {
            resolve(dataUrl)
            return
          }
        } catch {}

        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}
