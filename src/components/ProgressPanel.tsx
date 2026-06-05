import type { LogEntry } from '../hooks/useTranscription'

interface Props {
  progress: number
  label: string
  logs: LogEntry[]
}

export function ProgressPanel({ progress, label, logs }: Props) {
  if (logs.length === 0) return null

  return (
    <div style={{ marginBottom: '1.4rem' }}>
      <SectionLabel>Priebeh</SectionLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
        <span>{label}</span><span>{progress}%</span>
      </div>
      <div style={{ height: 5, background: 'var(--progress-track)', borderRadius: 3, marginBottom: '0.5rem' }}>
        <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 3, width: `${progress}%`, transition: 'width 0.4s' }} />
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', lineHeight: 1.8, maxHeight: 100, overflowY: 'auto' }}>
        {logs.map((l, i) => (
          <div key={i} style={{ color: l.type === 'ok' ? 'var(--log-ok)' : l.type === 'err' ? 'var(--error-text)' : 'var(--log-warn)' }}>
            {l.type === 'ok' ? '✓' : l.type === 'err' ? '✗' : '◌'} {l.msg}
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
      {children}
    </div>
  )
}
