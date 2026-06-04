import { useState } from 'react'
import { ApiKeyInput } from './components/ApiKeyInput'
import { FileUpload } from './components/FileUpload'
import { ProgressPanel } from './components/ProgressPanel'
import { TranscriptPanel } from './components/TranscriptPanel'
import { NotesPanel } from './components/NotesPanel'
import { useTranscription } from './hooks/useTranscription'
import { useLocalStorage } from './hooks/useLocalStorage'

const LANGUAGES = [
  { value: 'sk', label: '🇸🇰 Slovenčina' },
  { value: 'cs', label: '🇨🇿 Čeština' },
  { value: 'en', label: '🇬🇧 Angličtina' },
  { value: 'de', label: '🇩🇪 Nemčina' },
  { value: 'hu', label: '🇭🇺 Maďarčina' },
  { value: 'pl', label: '🇵🇱 Poľština' },
]

export default function App() {
  // API kľúč sa ukladá do localStorage – aby ho užívateľ nezadával zakaždým
  const [savedKey, setSavedKey] = useLocalStorage('groq_api_key', '')
  const [apiKey, setApiKey] = useState(savedKey)
  const [file, setFile] = useState<File | null>(null)
  const [lang, setLang] = useState('sk')
  const [notes, setNotes] = useState('')
  const [generatingNotes, setGeneratingNotes] = useState(false)

  const { state, transcribe } = useTranscription()

  const canStart = !!file && apiKey.trim().startsWith('gsk_') && !state.running

  const handleFile = (f: File) => {
    setFile(f)
    setNotes('')
  }

  const handleSaveKey = () => {
    setSavedKey(apiKey)
  }

  const handleStart = () => {
    if (!file || !canStart) return
    setNotes('')
    void transcribe(file, apiKey.trim(), lang)
  }

  const handleGenerateNotes = async () => {
    if (!state.transcript) return
    setGeneratingNotes(true)
    setNotes('')
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: `Na základe prepisu vytvor štruktúrovaný záznam zo stretnutia v slovenčine.\n\nObsahuje:\n1. Účastníci (ak sú zrejmí z prepisu)\n2. Hlavné témy diskusie\n3. Kľúčové rozhodnutia\n4. Úlohy a zodpovednosti (kto, čo, do kedy)\n5. Ďalší postup\n\nBuď konkrétny a stručný. Používaj odrážky.\n\nPREPIS:\n${state.transcript.substring(0, 12000)}`,
          }],
        }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as { error?: { message?: string } }
        throw new Error(err?.error?.message ?? `HTTP ${resp.status}`)
      }
      const data = await resp.json() as { content: Array<{ text?: string }> }
      setNotes(data.content?.map(b => b.text ?? '').join('').trim())
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Neznáma chyba'
      alert(`Chyba pri generovaní záznamu: ${msg}`)
    } finally {
      setGeneratingNotes(false)
    }
  }

  return (
    <div style={{ background: '#f5f2eb', minHeight: '100vh', padding: '2rem 1rem 4rem' }}>
      <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {/* Hlavička */}
        <div style={{ borderBottom: '2px solid #1a3a2a', paddingBottom: '1rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a3a2a', fontFamily: 'monospace' }}>
            Prepis Nahrávky
            <span style={{ background: '#1a3a2a', color: '#f5f2eb', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px', marginLeft: '0.75rem', verticalAlign: 'middle' }}>
              Groq Whisper
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7a7568', fontFamily: 'monospace', marginTop: '0.3rem' }}>
            Audio → Text → Záznam zo stretnutia
          </div>
        </div>

        <ApiKeyInput
          value={apiKey}
          onChange={setApiKey}
          onSave={handleSaveKey}
          saved={savedKey === apiKey && savedKey.length > 0}
        />

        <FileUpload onFile={handleFile} file={file} />

        {/* Jazyk */}
        <div style={{ marginBottom: '1.4rem' }}>
          <label style={labelStyle}>Jazyk nahrávky</label>
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            style={{ width: '100%', background: '#fff', border: '1px solid #ccc', color: '#1a1a16', fontFamily: 'monospace', fontSize: '0.82rem', padding: '0.7rem 0.9rem', borderRadius: '4px' }}
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Štart */}
        <div style={{ marginBottom: '1.4rem' }}>
          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{ width: '100%', padding: '0.9rem', background: canStart ? '#1a3a2a' : '#9ab5a0', color: '#f5f2eb', border: 'none', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: canStart ? 'pointer' : 'not-allowed' }}
          >
            {state.running ? '⏳  Prebieha prepis…' : '▶  Prepísať nahrávku'}
          </button>
          {!file && <div style={{ fontSize: '0.65rem', color: '#7a7568', fontFamily: 'monospace', marginTop: '0.4rem' }}>Najprv vyber súbor a zadaj Groq API kľúč</div>}
          {state.error && (
            <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.9rem', background: '#fff5f5', border: '1px solid #e8b4b4', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.72rem', color: '#8b2020' }}>
              {state.error}
            </div>
          )}
        </div>

        <ProgressPanel progress={state.progress} label={state.progressLabel} logs={state.logs} />
        <TranscriptPanel transcript={state.transcript} onGenerateNotes={handleGenerateNotes} generatingNotes={generatingNotes} />
        <NotesPanel notes={notes} />

      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#7a7568', fontFamily: 'monospace', marginBottom: '0.4rem',
}
