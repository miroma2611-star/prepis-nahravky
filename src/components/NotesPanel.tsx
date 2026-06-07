import { useState, useRef } from 'react'

interface Props {
  notes: string
  apiKey: string
  onNotesChange: (notes: string) => void
}

export function NotesPanel({ notes, apiKey, onNotesChange }: Props) {
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

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
    // Použi slovenský alebo český hlas — ak nie je dostupný, nechaj systém rozhodnúť
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.lang.startsWith('sk')) ?? voices.find(v => v.lang.startsWith('cs'))
    if (preferred) {
      utterance.voice = preferred
      utterance.lang = preferred.lang
    }
    utterance.rate = 0.95
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    setTimeout(() => window.speechSynthesis.speak(utterance), 100)
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        void processVoiceCommand(new Blob(chunksRef.current, { type: mimeType }), mimeType)
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch {
      alert('Nepodarilo sa spustiť mikrofón. Skontrolujte povolenia.')
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
    setRecording(false)
  }

  const processVoiceCommand = async (audioBlob: Blob, mimeType: string) => {
    setProcessing(true)
    try {
      // 1. Prepis hlasu cez Groq Whisper
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
      const fd = new FormData()
      fd.append('file', audioBlob, `command.${ext}`)
      fd.append('model', 'whisper-large-v3')
      fd.append('language', 'sk')
      fd.append('response_format', 'text')
      const whisperResp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: fd,
      })
      if (!whisperResp.ok) throw new Error(`Whisper HTTP ${whisperResp.status}`)
      const command = (await whisperResp.text()).trim()
      if (!command) { setProcessing(false); return }

      // 2. Úprava záznamu cez Groq LLM
      const llmResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: `Si editor záznamu zo stretnutia. Vykonaj nasledujúci hlasový príkaz v zázname a vráť CELÝ upravený záznam bez akýchkoľvek komentárov.\n\nZÁZNAM:\n${notes}\n\nPRÍKAZ: ${command}`,
          }],
        }),
      })
      if (!llmResp.ok) throw new Error(`LLM HTTP ${llmResp.status}`)
      const data = await llmResp.json() as { choices: Array<{ message?: { content?: string } }> }
      const edited = data.choices?.[0]?.message?.content?.trim() ?? ''
      if (edited) onNotesChange(edited)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Neznáma chyba'
      alert(`Chyba pri úprave: ${msg}`)
    } finally {
      setProcessing(false)
    }
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
        {!recording ? (
          <button
            onClick={handleStartRecording}
            disabled={processing}
            style={{ ...tbBtnStyle, background: processing ? 'var(--accent-muted)' : 'var(--btn-secondary)' }}
          >
            {processing ? '⏳ Spracovávam…' : '🎙 Hlasový príkaz'}
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            style={{ ...tbBtnStyle, background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)', fontWeight: 700 }}
          >
            ⏹ Hotovo
          </button>
        )}
      </div>
      {recording && (
        <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--error-text)', marginBottom: '0.5rem' }}>
          🔴 Nahrávam… hovor príkaz a stlač „Hotovo"
        </div>
      )}
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
