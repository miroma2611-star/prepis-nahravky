import { useState } from 'react'

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

interface Props {
  notes: string
  apiKey: string
  onNotesChange: (notes: string) => void
}

export function NotesPanel({ notes, apiKey, onNotesChange }: Props) {
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [processing, setProcessing] = useState(false)

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

  const handleSpeak = () => {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(notes)
    utterance.lang = 'sk-SK'
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const handleVoiceCommand = () => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) {
      alert('Váš prehliadač nepodporuje rozpoznávanie hlasu.')
      return
    }
    const recognition = new SR()
    recognition.lang = 'sk-SK'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    setListening(true)
    recognition.start()

    recognition.onresult = async (event) => {
      setListening(false)
      const command = event.results[0][0].transcript
      setProcessing(true)
      try {
        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 2048,
            messages: [{
              role: 'user',
              content: `Si editor záznamu zo stretnutia. Vykonaj nasledujúci hlasový príkaz v zázname a vráť CELÝ upravený záznam bez akýchkoľvek komentárov.\n\nZÁZNAM:\n${notes}\n\nPRÍKAZ: ${command}`,
            }],
          }),
        })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = await resp.json() as { choices: Array<{ message?: { content?: string } }> }
        const edited = data.choices?.[0]?.message?.content?.trim() ?? ''
        if (edited) onNotesChange(edited)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Neznáma chyba'
        alert(`Chyba pri úprave: ${msg}`)
      } finally {
        setProcessing(false)
      }
    }

    recognition.onerror = () => {
      setListening(false)
      alert('Nepodarilo sa rozpoznať hlas. Skúste znova.')
    }

    recognition.onend = () => setListening(false)
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
        <button onClick={handleSpeak} style={tbBtnStyle}>
          {speaking ? '⏹ Zastaviť čítanie' : '▶ Prečítať nahlas'}
        </button>
        <button
          onClick={handleVoiceCommand}
          disabled={listening || processing}
          style={{ ...tbBtnStyle, background: listening ? 'var(--error-bg)' : processing ? 'var(--accent-muted)' : 'var(--btn-secondary)' }}
        >
          {listening ? '🎙 Počúvam…' : processing ? '⏳ Upravujem…' : '🎙 Hlasový príkaz'}
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
