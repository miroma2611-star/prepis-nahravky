import { useRef, useState } from 'react'
import { formatSize } from '../utils/format'

interface Props {
  onFiles: (files: File[]) => void
  files: File[]
}

const ACCEPTED = 'audio/*,video/*,.mp3,.mp4,.wav,.m4a,.ogg,.flac,.webm'
const GROQ_LIMIT = 24 * 1024 * 1024

export function FileUpload({ onFiles, files }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    if (list && list.length > 0) onFiles(Array.from(list))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const list = e.dataTransfer.files
    if (list && list.length > 0) onFiles(Array.from(list))
  }

  return (
    <div style={{ marginBottom: '1.4rem' }}>
      <label style={labelStyle}>Nahrávka</label>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `1.5px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
          background: dragging ? 'var(--surface-accent)' : 'var(--surface)',
          borderRadius: '4px', padding: '1.5rem', textAlign: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>🎙</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem', lineHeight: 1.5 }}>
          Klikni sem alebo presuň súbor(y)<br />
          <span style={{ fontSize: '0.65rem' }}>MP3 · WAV · M4A · MP4 · FLAC · OGG · WEBM · viac súborov naraz</span>
        </div>
        <span style={pickBtnStyle}>Vybrať súbor(y)</span>
      </div>
      {files.length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {files.map((f, i) => (
            <div key={i} style={{ padding: '0.5rem 0.9rem', background: 'var(--surface-accent)', border: '1px solid var(--border-accent)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent)' }}>
              ✓ {f.name} · {formatSize(f.size)}
              {f.size > GROQ_LIMIT && ' · bude skomprimovaný'}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.65rem', fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: '0.4rem',
}
const pickBtnStyle: React.CSSProperties = {
  display: 'inline-block', background: 'var(--accent)', color: 'var(--accent-text)',
  fontFamily: 'monospace', fontSize: '0.68rem', fontWeight: 600,
  letterSpacing: '0.08em', textTransform: 'uppercase',
  padding: '0.5rem 1.2rem', borderRadius: '4px',
}
