export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="page" style={{ justifyContent: 'center', alignItems: 'center', gap: 'var(--sp-4)' }}>
      <div style={{
        width: 40, height: 40,
        border: '3px solid var(--border-primary)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
      }} className="animate-spin" />
      <p className="text-secondary text-sm">{text}</p>
    </div>
  )
}
