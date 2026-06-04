import { useState, useCallback } from 'react'
import { compressAudio } from '../utils/audioCompressor'
import { splitWav } from '../utils/wavSplitter'
import { transcribeBlob } from '../utils/groqClient'
import { formatSize } from '../utils/format'

const MAX_CHUNK_BYTES = 22 * 1024 * 1024 // 22 MB – bezpečný limit pod 25 MB Groq limitom

export interface LogEntry {
  msg: string
  type: 'ok' | 'err' | 'wait'
}

export interface TranscriptionState {
  running: boolean
  progress: number
  progressLabel: string
  logs: LogEntry[]
  transcript: string
  error: string
}

export function useTranscription() {
  const [state, setState] = useState<TranscriptionState>({
    running: false,
    progress: 0,
    progressLabel: '',
    logs: [],
    transcript: '',
    error: '',
  })

  const addLog = useCallback((msg: string, type: LogEntry['type']) => {
    setState(s => ({ ...s, logs: [...s.logs, { msg, type }] }))
  }, [])

  const setProgress = useCallback((pct: number, label: string) => {
    setState(s => ({ ...s, progress: pct, progressLabel: label }))
  }, [])

  const transcribe = useCallback(async (file: File, apiKey: string, language: string) => {
    setState(s => ({
      ...s,
      running: true,
      progress: 0,
      progressLabel: '',
      logs: [],
      transcript: '',
      error: '',
    }))

    try {
      addLog(`Súbor: ${file.name} (${formatSize(file.size)})`, 'ok')
      setProgress(5, 'Komprimujem audio...')

      const wavBlob = await compressAudio(file, msg => addLog(msg, 'wait'))
      addLog(`Skomprimované: ${formatSize(wavBlob.size)}`, 'ok')

      setProgress(20, 'Rozdeľujem na úseky...')
      const chunks = await splitWav(wavBlob, MAX_CHUNK_BYTES)
      addLog(`Počet úsekov: ${chunks.length}`, 'ok')

      let fullText = ''
      for (let i = 0; i < chunks.length; i++) {
        const pct = 20 + Math.round((i / chunks.length) * 75)
        setProgress(pct, `Úsek ${i + 1} / ${chunks.length}…`)
        addLog(`Úsek ${i + 1}/${chunks.length} – odosielam (${formatSize(chunks[i].size)})…`, 'wait')

        const text = await transcribeBlob(chunks[i], `chunk_${i}.wav`, apiKey, language)
        fullText += (fullText ? '\n' : '') + text.trim()
        addLog(`Úsek ${i + 1}/${chunks.length} – hotovo ✓`, 'ok')
      }

      setProgress(100, 'Prepis dokončený ✓')
      addLog('Celý prepis dokončený', 'ok')
      setState(s => ({ ...s, transcript: fullText, running: false }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Neznáma chyba'
      addLog('Zastavené kvôli chybe', 'err')
      setState(s => ({ ...s, error: `Chyba: ${msg}`, running: false }))
    }
  }, [addLog, setProgress])

  return { state, transcribe }
}
