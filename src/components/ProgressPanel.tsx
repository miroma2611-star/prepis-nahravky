import type { LogEntry } from '../hooks/useTranscription'

interface Props {
  progress: number
  label: string
  logs: LogEntry[]
}

/** Panel priebehu transkripcie – progress bar + log */
export function ProgressPanel({ progress, label, logs }: Props) {
  if (logs.length === 0) return null

  return (
    <div style={{ marginBottom: '1.4rem' }}>
      <SectionLabel>Priebeh</SectionLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '0.68rem', color: '#7a7568', marginBottom: '0.3rem' }}>
        <span>{label}</span><span>{progress}%</span>
      </div>
      <div style={{ height: 5, background: '#d4cfc4', borderRadius: 3, marginBottom: '0.5rem' }}>
        <div style={{ height: '100%', background: '#1a3a2a', borderRadius: 3, width: `${progress}%`, transition: 'width 0.4s' }} />
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', lineHeight: 1.8, maxHeight: 100, overflowY: 'auto' }}>
        {logs.map((l, i) => (
          <div key={i} style={{ color: l.type === 'ok' ? '#2d6e45' : l.type === 'err' ? '#8b2020' : '#b8860b' }}>
            {l.type === 'ok' ? '✓' : l.type === 'err' ? '✗' : '◌'} {l.msg}
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7a7568', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
      {children}
    </div>
  )
}
