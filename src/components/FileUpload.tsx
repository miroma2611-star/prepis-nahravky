import { useRef, useState } from 'react'
import { formatSize } from '../utils/format'

interface Props {
  onFile: (f: File) => void
  file: File | null
}

const ACCEPTED = 'audio/*,video/*,.mp3,.mp4,.wav,.m4a,.ogg,.flac,.webm'
const GROQ_LIMIT = 24 * 1024 * 1024

/** Nahratie súboru – kliknutie aj drag & drop */
export function FileUpload({ onFile, file }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  return (
    <div style={{ marginBottom: '1.4rem' }}>
      <label style={labelStyle}>Nahrávka</label>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `1.5px dashed ${dragging ? '#1a3a2a' : '#ccc'}`,
          background: dragging ? '#e8f0eb' : '#fff',
          borderRadius: '4px', padding: '1.5rem', textAlign: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🎙</div>
        <div style={{ fontSize: '0.75rem', color: '#7a7568', marginBottom: '0.8rem', lineHeight: 1.5 }}>
          Klikni sem alebo presuň súbor<br />
          <span style={{ fontSize: '0.65rem' }}>MP3 · WAV · M4A · MP4 · FLAC · OGG · WEBM</span>
        </div>
        <span style={pickBtnStyle}>Vybrať súbor</span>
      </div>
      {file && (
        <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.9rem', background: '#e8f0eb', border: '1px solid #b8d4be', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.72rem', color: '#1a3a2a' }}>
          ✓ {file.name} · {formatSize(file.size)}
          {file.size > GROQ_LIMIT && ' · bude skomprimovaný'}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#7a7568', fontFamily: 'monospace', marginBottom: '0.4rem',
}
const pickBtnStyle: React.CSSProperties = {
  display: 'inline-block', background: '#1a3a2a', color: '#f5f2eb',
  fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  padding: '0.5rem 1.2rem', borderRadius: '4px',
}
