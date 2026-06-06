import { useState } from 'react'

interface Props {
  notes: string
}

export function NotesPanel({ notes }: Props) {
  const [copied, setCopied] = useState(false)

  if (!notes) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notes)
    } catch {
      fallbackCopy(notes)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const defaultName = `zaznam_${new Date().toISOString().slice(0, 10)}`
    const name = window.prompt('Názov súboru (bez .txt):', defaultName)
    if (name === null) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([notes], { type: 'text/plain;charset=utf-8' }))
    a.download = `${name.trim() || defaultName}.txt`
    a.click()
  }

  return (
    <div style={{ marginBottom: '1.4rem' }}>
      <SectionLabel>Záznam zo stretnutia</SectionLabel>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
        <button onClick={handleCopy} style={tbBtnStyle}>
          {copied ? '✓ Skopírované' : 'Kopírovať'}
        </button>
        <button onClick={handleDownload} style={tbBtnStyle}>
          Stiahnuť .txt
        </button>
      </div>
      <div style={{ ...textboxStyle, fontFamily: 'system-ui, sans-serif' }}>{notes}</div>
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

function fallbackCopy(text: string) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
  document.body.appendChild(ta)
  ta.focus(); ta.select()
  try { document.execCommand('copy') } catch { /* ignoruj */ }
  document.body.removeChild(ta)
}

const tbBtnStyle: React.CSSProperties = {
  background: 'var(--btn-secondary)', border: '1px solid var(--border)', color: 'var(--text)',
  fontFamily: 'monospace', fontSize: '0.65rem', padding: '0.4rem 0.8rem',
  borderRadius: '4px', cursor: 'pointer',
}
const textboxStyle: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px',
  padding: '1rem', fontSize: '0.82rem', lineHeight: 1.85, color: 'var(--text)',
  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
}
