import { useState } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  saved: boolean
}

export function ApiKeyInput({ value, onChange, onSave, saved }: Props) {
  const [show, setShow] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const handleSave = () => {
    onSave()
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  return (
    <div style={{ marginBottom: '1.4rem' }}>
      <label style={labelStyle}>Groq API Kľúč</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="gsk_..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={() => setShow(v => !v)} style={smBtnStyle}>
          {show ? 'skryť' : 'zobraziť'}
        </button>
        <button
          onClick={handleSave}
          disabled={!value.trim().startsWith('gsk_')}
          style={{ ...smBtnStyle, background: 'var(--accent)', color: 'var(--accent-text)', borderColor: 'var(--accent)' }}
        >
          {justSaved ? '✓ Uložené' : 'Uložiť'}
        </button>
      </div>
      <div style={{ fontSize: '0.65rem', color: saved ? 'var(--log-ok)' : 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.3rem' }}>
        {saved ? '✓ API kľúč je uložený v prehliadači' : 'console.groq.com → API Keys → Create API Key'}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '0.4rem',
}
const inputStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)',
  fontFamily: 'monospace', fontSize: '0.82rem', padding: '0.7rem 0.9rem', borderRadius: '4px',
}
const smBtnStyle: React.CSSProperties = {
  background: 'var(--btn-secondary)', border: '1px solid var(--border)', color: 'var(--text)',
  fontFamily: 'monospace', fontSize: '0.7rem', padding: '0 1rem',
  borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap',
}
