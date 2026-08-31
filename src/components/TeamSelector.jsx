export default function TeamSelector({ teams, selectedTeam, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-3)' }}>
      {teams.map((team, i) => (
        <button
          key={team.id}
          className={`card animate-fadeInUp delay-${i + 1}`}
          onClick={() => onSelect(team)}
          style={{
            cursor: 'pointer',
            padding: 'var(--sp-4)',
            textAlign: 'center',
            border: selectedTeam?.id === team.id
              ? `2px solid ${team.color}`
              : '1px solid var(--border-primary)',
            boxShadow: selectedTeam?.id === team.id
              ? `0 0 20px ${team.color}33`
              : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div
            style={{
              width: 40, height: 40,
              borderRadius: '50%',
              background: team.color,
              margin: '0 auto var(--sp-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', fontWeight: 800, color: '#fff',
            }}
          >
            {team.name.charAt(0)}
          </div>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{team.name}</div>
        </button>
      ))}
    </div>
  )
}
