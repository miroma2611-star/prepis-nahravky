import { useState, useEffect } from 'react'
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

function buildNotesPrompt(transcript: string, lang: string): string {
  const text = transcript.substring(0, 12000)
  if (lang === 'en') {
    return `Based on the transcript, create a structured meeting record in English.

Include:
1. Participants (if apparent from the transcript)
2. Main discussion topics
3. Key decisions
4. Tasks and responsibilities (who, what, by when)
5. Next steps

Be specific and concise. Use bullet points.

TRANSCRIPT:
${text}`
  }
  return `Na základe prepisu vytvor štruktúrovaný záznam zo stretnutia v slovenčine.

Obsahuje:
1. Účastníci (ak sú zrejmí z prepisu)
2. Hlavné témy diskusie
3. Kľúčové rozhodnutia
4. Úlohy a zodpovednosti (kto, čo, do kedy)
5. Ďalší postup

Buď konkrétny a stručný. Používaj odrážky.

PREPIS:
${text}`
}

export default function App() {
  const [savedKey, setSavedKey] = useLocalStorage('groq_api_key', '')
  const envKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  const [apiKey, setApiKey] = useState(envKey || savedKey)
  const [files, setFiles] = useState<File[]>([])
  const [lang, setLang] = useState('sk')
  const [timestamps, setTimestamps] = useState(false)
  const [notes, setNotes] = useState('')
  const [generatingNotes, setGeneratingNotes] = useState(false)
  const [darkMode, setDarkMode] = useLocalStorage('dark_mode', false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const { state, transcribe } = useTranscription()

  const canStart = files.length > 0 && apiKey.trim().startsWith('gsk_') && !state.running

  const handleFiles = (f: File[]) => {
    setFiles(f)
    setNotes('')
  }

  const handleSaveKey = () => setSavedKey(apiKey)

  const handleStart = () => {
    if (!canStart) return
    setNotes('')
    void transcribe(files, apiKey.trim(), lang, timestamps)
  }

  const handleGenerateNotes = async () => {
    if (!state.transcript) return
    setGeneratingNotes(true)
    setNotes('')
    try {
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: buildNotesPrompt(state.transcript, lang),
          }],
        }),
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({})) as { error?: { message?: string } }
        throw new Error(err?.error?.message ?? `HTTP ${resp.status}`)
      }
      const data = await resp.json() as { choices: Array<{ message?: { content?: string } }> }
      setNotes(data.choices?.[0]?.message?.content?.trim() ?? '')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Neznáma chyba'
      alert(`Chyba pri generovaní záznamu: ${msg}`)
    } finally {
      setGeneratingNotes(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '2rem 1rem 4rem' }}>
      <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {/* Hlavička */}
        <div style={{ borderBottom: `2px solid var(--accent)`, paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>
              Prepis Nahrávky
              <span style={{ background: 'var(--accent)', color: 'var(--accent-text)', fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.5rem', borderRadius: '2px', marginLeft: '0.75rem', verticalAlign: 'middle' }}>
                Groq Whisper
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.3rem' }}>
              Audio → Text → Záznam zo stretnutia
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Prepnúť na svetlý režim' : 'Prepnúť na tmavý režim'}
            style={{ background: 'var(--btn-secondary)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '4px', padding: '0.4rem 0.7rem', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {envKey ? (
          <div style={{ marginBottom: '1.4rem', fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--log-ok)' }}>
            ✓ Groq API kľúč: nakonfigurovaný
          </div>
        ) : (
          <ApiKeyInput
            value={apiKey}
            onChange={setApiKey}
            onSave={handleSaveKey}
            saved={savedKey === apiKey && savedKey.length > 0}
          />
        )}

        <FileUpload onFiles={handleFiles} files={files} />

        {/* Jazyk + Časové pečiatky */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.4rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={labelStyle}>Jazyk nahrávky</label>
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'monospace', fontSize: '0.82rem', padding: '0.7rem 0.9rem', borderRadius: '4px' }}
            >
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.05rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={timestamps}
                onChange={e => setTimestamps(e.target.checked)}
                style={{ width: '1rem', height: '1rem', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              Časové pečiatky
            </label>
          </div>
        </div>

        {/* Štart */}
        <div style={{ marginBottom: '1.4rem' }}>
          <button
            onClick={handleStart}
            disabled={!canStart}
            style={{ width: '100%', padding: '0.9rem', background: canStart ? 'var(--accent)' : 'var(--accent-muted)', color: 'var(--accent-text)', border: 'none', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: canStart ? 'pointer' : 'not-allowed' }}
          >
            {state.running ? '⏳  Prebieha prepis…' : '▶  Prepísať nahrávku'}
          </button>
          {files.length === 0 && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.4rem' }}>Najprv vyber súbor a zadaj Groq API kľúč</div>}
          {state.error && (
            <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.9rem', background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--error-text)' }}>
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
  color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '0.4rem',
}
