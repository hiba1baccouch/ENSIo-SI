import React from 'react'

export default function EventLog({ events, onRefresh }) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <div>
          <h2 className="adm-section-title">Event Log</h2>
          <p className="adm-section-sub">Real-time audit log of team actions and answers</p>
        </div>
        <button className="adm-btn adm-btn--secondary adm-btn--sm" onClick={onRefresh}>Refresh</button>
      </div>

      <div className="adm-card">
        {events.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 14 }}>
            No events logged yet.
          </div>
        ) : (
          events.map((evt) => {
            let data = {}
            try { data = JSON.parse(evt.event_data || '{}') } catch {}
            const isCorrect = evt.event_type === 'answer_submitted' && data.correct
            const isWrong = evt.event_type === 'answer_submitted' && data.correct === false

            return (
              <div key={evt.id} className="adm-event">
                <div className="adm-event__meta">
                  <span className={`adm-pill ${isCorrect ? 'adm-pill--green' : isWrong ? 'adm-pill--red' : 'adm-pill--blue'}`}>
                    {evt.event_type.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{evt.team_name}</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>at {evt.station_name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {new Date(evt.created_at).toLocaleTimeString()}
                  </span>
                </div>
                {evt.event_data && evt.event_data !== '{}' && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#94a3b8', fontFamily: 'var(--font-mono)', background: '#f8fafc', padding: '4px 8px', borderRadius: 4 }}>
                    {evt.event_data}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
