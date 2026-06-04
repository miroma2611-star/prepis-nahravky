/**
 * Klient pre Groq Whisper API.
 * Model: whisper-large-v3 – najlepšia presnosť pre slovenčinu.
 * Retry logika: pri 429 (rate limit) počkáme a skúsime znova.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const MAX_RETRIES = 3

export async function transcribeBlob(
  blob: Blob,
  filename: string,
  apiKey: string,
  language: string,
  attempt = 1
): Promise<string> {
  const fd = new FormData()
  fd.append('file', blob, filename)
  fd.append('model', 'whisper-large-v3')
  fd.append('language', language)
  fd.append('response_format', 'text')

  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd,
  })

  // Rate limit – počkaj a skús znova
  if (resp.status === 429 && attempt <= MAX_RETRIES) {
    await new Promise(r => setTimeout(r, 4000 * attempt))
    return transcribeBlob(blob, filename, apiKey, language, attempt + 1)
  }

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(err?.error?.message ?? `HTTP ${resp.status}`)
  }

  return await resp.text()
}
