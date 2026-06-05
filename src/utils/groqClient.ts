/**
 * Klient pre Groq Whisper API.
 * Model: whisper-large-v3 – najlepšia presnosť pre slovenčinu aj angličtinu.
 * Retry logika: pri 429 (rate limit) počkáme a skúsime znova.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const MAX_RETRIES = 3

interface VerboseSegment {
  start: number
  text: string
}

interface VerboseResponse {
  segments: VerboseSegment[]
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `[${m}:${s.toString().padStart(2, '0')}]`
}

export async function transcribeBlob(
  blob: Blob,
  filename: string,
  apiKey: string,
  language: string,
  timestamps = false,
  attempt = 1
): Promise<string> {
  const fd = new FormData()
  fd.append('file', blob, filename)
  fd.append('model', 'whisper-large-v3')
  fd.append('language', language)
  fd.append('response_format', timestamps ? 'verbose_json' : 'text')

  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd,
  })

  if (resp.status === 429 && attempt <= MAX_RETRIES) {
    await new Promise(r => setTimeout(r, 4000 * attempt))
    return transcribeBlob(blob, filename, apiKey, language, timestamps, attempt + 1)
  }

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err?.error?.message ?? `HTTP ${resp.status}`)
  }

  if (!timestamps) return resp.text()

  const data = await resp.json() as VerboseResponse
  return data.segments
    .map(seg => `${formatTimestamp(seg.start)} ${seg.text.trim()}`)
    .join('\n')
}
