import React, { useState } from 'react'
import { api } from '../api'
import ImageUploader from './ImageUploader'
import QRGenerator from './QRGenerator'

// ─── Per-game-type form builders ───────────────────────────────────────────
function ZoomForm({ config, onChange }) {
  const opts = config.options || [
    { id: 'a', text: '', correct: true },
    { id: 'b', text: '', correct: false },
    { id: 'c', text: '', correct: false },
    { id: 'd', text: '', correct: false }
  ]

  const updateOpt = (idx, field, val) => {
    const next = opts.map((o, i) =>
      i === idx ? { ...o, [field]: val } : field === 'correct' ? { ...o, correct: false } : o
    )
    onChange({ ...config, options: next })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="adm-hint-box">Station 1 — ZOOM: Show a photo and ask teams to identify the campus location.</div>

      {/* Image Uploader */}
      <ImageUploader
        label="Station 1 Campus Photo"
        value={config.image || ''}
        onChange={(img) => onChange({ ...config, image: img })}
      />

      <div className="adm-row-2">
        <div className="adm-field">
          <label>Question</label>
          <input
            className="adm-input"
            type="text"
            placeholder="Where was this photo taken?"
            value={config.question || ''}
            onChange={(e) => onChange({ ...config, question: e.target.value })}
          />
        </div>
        <div className="adm-field">
          <label>Category label</label>
          <input
            className="adm-input"
            type="text"
            placeholder="Campus Quiz"
            value={config.category || ''}
            onChange={(e) => onChange({ ...config, category: e.target.value })}
          />
        </div>
      </div>

      <hr className="adm-divider" />
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>
          ANSWER OPTIONS — mark the correct one
        </div>
        {opts.map((opt, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input
              type="radio"
              name="correct_zoom"
              checked={opt.correct}
              onChange={() => updateOpt(idx, 'correct', true)}
              style={{ accentColor: '#4f46e5', cursor: 'pointer', flexShrink: 0 }}
            />
            <input
              className="adm-input"
              type="text"
              placeholder={`Option ${['A', 'B', 'C', 'D'][idx]}`}
              value={opt.text}
              onChange={(e) => updateOpt(idx, 'text', e.target.value)}
              style={{ flex: 1 }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function MemoryForm({ config, onChange }) {
  const questions = config.questions || []

  const updateQ = (idx, field, val) => {
    const next = questions.map((q, i) => (i === idx ? { ...q, [field]: val } : q))
    onChange({ ...config, questions: next })
  }

  const addQuestion = () => {
    onChange({
      ...config,
      questions: [
        ...questions,
        { id: `q${questions.length + 1}`, text: '', options: ['', '', '', ''], correct: 0 }
      ]
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="adm-hint-box">Station 2 — MEMORY GLITCH: Teams study an image, then answer questions from memory.</div>

      {/* Image Uploader */}
      <ImageUploader
        label="Memory Scene Image (displayed for study time)"
        value={config.image || ''}
        onChange={(img) => onChange({ ...config, image: img })}
      />

      <div className="adm-row-2">
        <div className="adm-field">
          <label>Study time (seconds)</label>
          <input
            className="adm-input"
            type="number"
            value={config.display_time || 12}
            onChange={(e) => onChange({ ...config, display_time: parseInt(e.target.value) })}
          />
        </div>
        <div className="adm-field">
          <label>Required correct answers</label>
          <input
            className="adm-input"
            type="number"
            value={config.required_correct || 4}
            onChange={(e) => onChange({ ...config, required_correct: parseInt(e.target.value) })}
          />
        </div>
      </div>

      <hr className="adm-divider" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>QUESTIONS ({questions.length})</div>
        <button type="button" className="adm-btn adm-btn--secondary adm-btn--sm" onClick={addQuestion}>
          + Add Question
        </button>
      </div>

      {questions.map((q, idx) => (
        <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
          <div className="adm-field" style={{ marginBottom: 10 }}>
            <label>Question {idx + 1}</label>
            <input
              className="adm-input"
              type="text"
              placeholder="What color was the door?"
              value={q.text}
              onChange={(e) => updateQ(idx, 'text', e.target.value)}
            />
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Options (mark correct):</div>
          {(q.options || ['', '', '', '']).map((opt, oi) => (
            <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <input
                type="radio"
                name={`correct_mem_${idx}`}
                checked={q.correct === oi}
                onChange={() => updateQ(idx, 'correct', oi)}
                style={{ accentColor: '#4f46e5', cursor: 'pointer', flexShrink: 0 }}
              />
              <input
                className="adm-input"
                type="text"
                placeholder={`Option ${oi + 1}`}
                value={opt}
                onChange={(e) => {
                  const opts = [...q.options]
                  opts[oi] = e.target.value
                  updateQ(idx, 'options', opts)
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function FindDifferenceForm({ config, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="adm-hint-box">Station 3 — FIND THE DIFFERENCE: Upload Feed A (original) and Feed B (modified) images.</div>

      <ImageUploader
        label="Feed A — Original Image"
        value={config.image_original || ''}
        onChange={(img) => onChange({ ...config, image_original: img })}
      />

      <ImageUploader
        label="Feed B — Modified Image (with anomalies)"
        value={config.image_modified || ''}
        onChange={(img) => onChange({ ...config, image_modified: img })}
      />

      <div className="adm-field">
        <label>Differences required to solve</label>
        <input
          className="adm-input"
          type="number"
          value={config.required_found || 5}
          onChange={(e) => onChange({ ...config, required_found: parseInt(e.target.value) })}
        />
      </div>
    </div>
  )
}

function EscapeForm({ config, onChange }) {
  const puzzles = config.puzzles || []
  const addPuzzle = () => {
    onChange({
      ...config,
      puzzles: [
        ...puzzles,
        { id: `p${puzzles.length + 1}`, type: 'text_input', title: '', prompt: '', answer: '', hint: '' }
      ]
    })
  }
  const updateP = (idx, field, val) => {
    const next = puzzles.map((p, i) => (i === idx ? { ...p, [field]: val } : p))
    onChange({ ...config, puzzles: next })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="adm-hint-box">Station 4 — DIGITAL ESCAPE: A series of logic puzzles teams must solve in order.</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>PUZZLES ({puzzles.length})</div>
        <button type="button" className="adm-btn adm-btn--secondary adm-btn--sm" onClick={addPuzzle}>
          + Add Puzzle
        </button>
      </div>
      {puzzles.map((p, idx) => (
        <div
          key={idx}
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Puzzle {idx + 1}</div>
          <div className="adm-row-2">
            <div className="adm-field">
              <label>Title</label>
              <input
                className="adm-input"
                type="text"
                placeholder="e.g. Logical Sequence"
                value={p.title}
                onChange={(e) => updateP(idx, 'title', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label>Type</label>
              <select className="adm-input" value={p.type} onChange={(e) => updateP(idx, 'type', e.target.value)}>
                <option value="text_input">Text input</option>
                <option value="multiple_choice">Multiple choice</option>
                <option value="logical_sequence">Logical sequence</option>
                <option value="scrambled_word">Scrambled word</option>
              </select>
            </div>
          </div>
          <div className="adm-field">
            <label>Prompt / Question</label>
            <textarea
              className="adm-input adm-textarea"
              rows={2}
              placeholder="What comes next in the sequence: 2, 6, 12, 20, ...?"
              value={p.prompt}
              onChange={(e) => updateP(idx, 'prompt', e.target.value)}
            />
          </div>
          <div className="adm-row-2">
            <div className="adm-field">
              <label>Correct Answer</label>
              <input
                className="adm-input"
                type="text"
                placeholder="42"
                value={p.answer}
                onChange={(e) => updateP(idx, 'answer', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label>Hint (optional)</label>
              <input
                className="adm-input"
                type="text"
                placeholder="Look at the differences..."
                value={p.hint || ''}
                onChange={(e) => updateP(idx, 'hint', e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MapLyingForm({ config, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="adm-hint-box">Station 5 — THE MAP IS LYING: Upload a custom campus blueprint / map image.</div>

      <ImageUploader
        label="Campus Map / Blueprint Image"
        value={config.map_image || ''}
        onChange={(img) => onChange({ ...config, map_image: img })}
      />

      <div className="adm-row-2">
        <div className="adm-field">
          <label>Max attempts allowed</label>
          <input
            className="adm-input"
            type="number"
            value={config.max_attempts || 5}
            onChange={(e) => onChange({ ...config, max_attempts: parseInt(e.target.value) })}
          />
        </div>
        <div className="adm-field">
          <label>Click tolerance radius (pixels)</label>
          <input
            className="adm-input"
            type="number"
            value={config.click_tolerance || 12}
            onChange={(e) => onChange({ ...config, click_tolerance: parseInt(e.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}

function HiddenMessageForm({ config, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="adm-hint-box">Station 6 — HIDDEN MESSAGE: Upload a campus scene image and configure the secret word.</div>

      <ImageUploader
        label="Steganography Scene Image"
        value={config.image || ''}
        onChange={(img) => onChange({ ...config, image: img })}
      />

      <div className="adm-field">
        <label>Final Decoded Word</label>
        <input
          className="adm-input"
          type="text"
          placeholder="ENISO"
          value={config.final_word || 'ENISO'}
          onChange={(e) => onChange({ ...config, final_word: e.target.value })}
        />
      </div>
    </div>
  )
}

function EmojiForm({ config, onChange }) {
  const rounds = config.rounds || []
  const addRound = () => {
    onChange({
      ...config,
      rounds: [
        ...rounds,
        { id: `r${rounds.length + 1}`, emojis: '', answer: '', type: 'multiple_choice', options: ['', '', '', ''] }
      ]
    })
  }
  const updateR = (idx, field, val) => {
    const next = rounds.map((r, i) => (i === idx ? { ...r, [field]: val } : r))
    onChange({ ...config, rounds: next })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="adm-hint-box">Station 7 — EMOJI CODE: Teams decode emoji sequences into words or phrases.</div>
      <div className="adm-field">
        <label>Required correct rounds to pass</label>
        <input
          className="adm-input"
          type="number"
          value={config.required_correct || 2}
          onChange={(e) => onChange({ ...config, required_correct: parseInt(e.target.value) })}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>ROUNDS ({rounds.length})</div>
        <button type="button" className="adm-btn adm-btn--secondary adm-btn--sm" onClick={addRound}>
          + Add Round
        </button>
      </div>
      {rounds.map((r, idx) => (
        <div
          key={idx}
          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          <div className="adm-row-2">
            <div className="adm-field">
              <label>Emoji sequence</label>
              <input
                className="adm-input"
                type="text"
                placeholder="e.g. 🏫📐✏️🎓"
                value={r.emojis}
                onChange={(e) => updateR(idx, 'emojis', e.target.value)}
              />
            </div>
            <div className="adm-field">
              <label>Correct answer</label>
              <input
                className="adm-input"
                type="text"
                placeholder="Engineering School"
                value={r.answer}
                onChange={(e) => updateR(idx, 'answer', e.target.value)}
              />
            </div>
          </div>
          <div className="adm-field">
            <label>Type</label>
            <select className="adm-input" value={r.type} onChange={(e) => updateR(idx, 'type', e.target.value)}>
              <option value="multiple_choice">Multiple choice</option>
              <option value="text_input">Text input</option>
            </select>
          </div>
          {r.type === 'multiple_choice' && (
            <div className="adm-field">
              <label>Options (comma separated)</label>
              <input
                className="adm-input"
                type="text"
                placeholder="Engineering School, Library, Hospital, ..."
                value={(r.options || []).join(', ')}
                onChange={(e) => updateR(idx, 'options', e.target.value.split(',').map((s) => s.trim()))}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function GenericJsonForm({ config, onChange, hint }) {
  const [jsonStr, setJsonStr] = useState(JSON.stringify(config, null, 2))
  const [jsonError, setJsonError] = useState(null)

  const handleChange = (val) => {
    setJsonStr(val)
    try {
      const parsed = JSON.parse(val)
      setJsonError(null)
      onChange(parsed)
    } catch {
      setJsonError('Invalid JSON')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {hint && <div className="adm-hint-box">{hint}</div>}
      <div className="adm-field">
        <label>Game Config (JSON)</label>
        <textarea
          className="adm-input adm-textarea"
          rows={12}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
          value={jsonStr}
          onChange={(e) => handleChange(e.target.value)}
        />
        {jsonError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{jsonError}</div>}
      </div>
    </div>
  )
}

// ─── Main StationEditor component ──────────────────────────────────────────
export default function StationEditor({ stations, onRefresh }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', hint_text: '', points_reward: 100, is_enabled: true, config: {} })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [rawMode, setRawMode] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrStation, setQrStation] = useState(null)
  const [modalError, setModalError] = useState(null)

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleOpenQR = (st = null) => {
    setQrStation(st)
    setShowQRModal(true)
  }

  const handleEdit = (st) => {
    setEditing(st)
    setRawMode(false)
    setModalError(null)
    setForm({
      name: st.name,
      hint_text: st.hint_text || '',
      points_reward: st.points_reward || 100,
      is_enabled: Boolean(st.is_enabled),
      config: st.config || {}
    })
  }

  const persistStation = async (payload, { close = false } = {}) => {
    if (!editing) return
    const saved = await api.adminUpdateStation(editing.id, payload)
    if (saved?.station?.config) {
      setForm((prev) => ({ ...prev, ...payload, config: saved.station.config }))
    }
    if (onRefresh) await onRefresh()
    if (close) {
      setEditing(null)
      showMsg('success', `Station ${editing.id} saved successfully!`)
    }
  }

  const handleConfigChange = async (cfg) => {
    const next = { ...form, config: cfg }
    setForm(next)

    const imageKeys = ['image', 'image_original', 'image_modified', 'map_image']
    const prev = form.config || {}
    const imageChanged = imageKeys.some(
      (k) => prev[k] !== cfg[k] && (String(cfg[k] || '').startsWith('/api/images/') || cfg[k] === '')
    )
    if (!imageChanged) return

    try {
      setModalError(null)
      await persistStation(next)
      showMsg('success', 'Image saved — all players will see this photo.')
    } catch (err) {
      console.error('Image publish failed:', err)
      setModalError(err.message || 'Image uploaded but failed to publish to players')
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!editing || loading) return
    try {
      setLoading(true)
      setModalError(null)
      await persistStation(form, { close: true })
    } catch (err) {
      console.error('Save failed:', err)
      setModalError(err.message || 'Failed to save station')
      showMsg('error', err.message || 'Failed to save station')
    } finally {
      setLoading(false)
    }
  }

  const renderGameForm = (gameType, config, onChange) => {
    if (rawMode) {
      return <GenericJsonForm config={config} onChange={onChange} />
    }

    switch (gameType) {
      case 'zoom':
        return <ZoomForm config={config} onChange={onChange} />
      case 'memory_glitch':
        return <MemoryForm config={config} onChange={onChange} />
      case 'find_difference':
        return <FindDifferenceForm config={config} onChange={onChange} />
      case 'digital_escape':
        return <EscapeForm config={config} onChange={onChange} />
      case 'map_lying':
        return <MapLyingForm config={config} onChange={onChange} />
      case 'hidden_message':
        return <HiddenMessageForm config={config} onChange={onChange} />
      case 'emoji_code':
        return <EmojiForm config={config} onChange={onChange} />
      default:
        return <GenericJsonForm config={config} onChange={onChange} />
    }
  }

  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <div>
          <h2 className="adm-section-title">Stations & Games</h2>
          <p className="adm-section-sub">Configure game content, upload photos, set questions, and generate QR codes</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => handleOpenQR(null)}>
            📷 QR Codes & Posters
          </button>
          <button className="adm-btn adm-btn--secondary adm-btn--sm" onClick={onRefresh}>
            Refresh
          </button>
        </div>
      </div>

      {message && <div className={`adm-alert adm-alert--${message.type}`}>{message.text}</div>}

      <div className="adm-card">
        {stations.map((st) => (
          <div key={st.id} className="adm-station-row">
            <div className="adm-station-body">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                    Station {st.id} — {st.name}
                  </span>
                  <span className={`adm-pill ${st.is_enabled ? 'adm-pill--green' : 'adm-pill--red'}`}>
                    {st.is_enabled ? 'Active' : 'Disabled'}
                  </span>
                  <span className="adm-pill adm-pill--amber">+{st.points_reward} pts</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'var(--font-mono)' }}>{st.game_type}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => handleOpenQR(st)}>
                  📷 QR Code
                </button>
                <button className="adm-btn adm-btn--secondary adm-btn--sm" onClick={() => handleEdit(st)}>
                  Configure & Upload Photo
                </button>
              </div>
            </div>
            {st.hint_text && (
              <div className="adm-station-hint">
                <strong>Physical hint:</strong> {st.hint_text}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* QR Code & Poster Generator Modal */}
      {showQRModal && (
        <QRGenerator
          stations={stations}
          selectedStation={qrStation}
          onClose={() => setShowQRModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="adm-overlay" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div className="adm-modal" style={{ maxWidth: 640 }}>
            <div className="adm-modal__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 className="adm-modal__title">Station {editing.id} — {editing.name}</h3>
                <p className="adm-modal__sub">Game Type: {editing.game_type?.toUpperCase().replace('_', ' ')}</p>
              </div>
              <button
                type="button"
                className="adm-btn adm-btn--ghost adm-btn--sm"
                style={{ fontSize: 11 }}
                onClick={() => setRawMode(!rawMode)}
              >
                {rawMode ? '← Visual Editor' : '{ } Raw JSON'}
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="adm-modal__body">
                {/* Station settings */}
                <div className="adm-row-2">
                  <div className="adm-field">
                    <label>Station Name</label>
                    <input
                      className="adm-input"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="adm-field">
                    <label>Points Reward</label>
                    <input
                      className="adm-input"
                      type="number"
                      value={form.points_reward}
                      onChange={(e) => setForm({ ...form, points_reward: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="adm-field">
                  <label>Physical Hint (revealed after station completion)</label>
                  <textarea
                    className="adm-input adm-textarea"
                    rows={2}
                    placeholder="e.g. Head to the amphitheater..."
                    value={form.hint_text}
                    onChange={(e) => setForm({ ...form, hint_text: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="st_enabled"
                    checked={form.is_enabled}
                    onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#4f46e5', cursor: 'pointer' }}
                  />
                  <label htmlFor="st_enabled" style={{ fontSize: 13, cursor: 'pointer', color: '#0f172a' }}>
                    Station enabled (teams can access this station)
                  </label>
                </div>

                <hr className="adm-divider" />

                {/* Per-game form with ImageUploader */}
                {renderGameForm(editing.game_type, form.config, handleConfigChange)}

                {modalError && (
                  <div style={{ marginTop: 16, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
                    ⚠️ {modalError}
                  </div>
                )}
              </div>

              <div className="adm-modal__footer">
                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button type="submit" className="adm-btn adm-btn--primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Station'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
