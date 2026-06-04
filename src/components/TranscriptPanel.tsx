import { useState } from 'react'

interface Props {
  transcript: string
  onGenerateNotes: () => void
  generatingNotes: boolean
}

/** Panel s výsledkom prepisu – kopírovanie + spustenie generovania záznamu */
export function TranscriptPanel({ transcript, onGenerateNotes, generatingNotes }: Props) {
  const [copied, setCopied] = useState(false)

  if (!transcript) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback pre mobilné prehliadače kde clipboard API nefunguje
      fallbackCopy(transcript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{ marginBottom: '1.4rem' }}>
      <SectionLabel>Prepis</SectionLabel>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
        <button onClick={handleCopy} style={tbBtnStyle}>
          {copied ? '✓ Skopírované' : 'Kopírovať prepis'}
        </button>
        <button
          onClick={onGenerateNotes}
          disabled={generatingNotes}
          style={{ ...tbBtnStyle, background: '#1a3a2a', color: '#f5f2eb', border: 'none', fontWeight: 600 }}
        >
          {generatingNotes ? '⏳ Generujem…' : '⟶ Vygenerovať záznam zo stretnutia'}
        </button>
      </div>
      <div style={textboxStyle}>{transcript}</div>
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

/** Fallback kopírovanie pre staršie/mobilné prehliadače */
function fallbackCopy(text: string) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  try { document.execCommand('copy') } catch { /* ignoruj */ }
  document.body.removeChild(ta)
}

const tbBtnStyle: React.CSSProperties = {
  background: '#eee', border: '1px solid #ccc', color: '#1a1a16',
  fontFamily: 'monospace', fontSize: '0.65rem', padding: '0.4rem 0.8rem',
  borderRadius: '4px', cursor: 'pointer',
}
const textboxStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
  padding: '1rem', fontSize: '0.8rem', lineHeight: 1.85,
  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
  maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace',
}
