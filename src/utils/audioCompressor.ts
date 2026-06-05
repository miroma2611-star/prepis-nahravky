/**
 * Kompresia audio súboru na 16kHz mono WAV pomocou Web Audio API.
 * Dôvod: Groq Whisper má limit 25 MB – veľké M4A (50+ MB) treba zmenšiť.
 * Výstup: WAV blob, typicky 5–15 MB pre 1-hodinovú nahrávku.
 *
 * iOS Safari: webkitAudioContext fallback + sampleRate sa nenastavuje
 * v konštruktore (Safari ho ignoruje), resampling prebieha cez OfflineAudioContext.
 */

type AnyAudioContext = typeof AudioContext
const NativeAudioContext: AnyAudioContext =
  window.AudioContext ??
  (window as unknown as { webkitAudioContext: AnyAudioContext }).webkitAudioContext

export async function compressAudio(
  file: File,
  onProgress: (msg: string) => void
): Promise<Blob> {
  onProgress('Dekódujem audio súbor...')
  const arrayBuffer = await file.arrayBuffer()

  // Nevnucujeme sampleRate – Safari ho ignoruje; resampling robí OfflineAudioContext
  const audioCtx = new NativeAudioContext()
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  await audioCtx.close()

  onProgress('Konvertujem na 16kHz mono...')

  const offlineCtx = new OfflineAudioContext(
    1,
    Math.ceil(audioBuffer.duration * 16000),
    16000
  )
  const source = offlineCtx.createBufferSource()

  if (audioBuffer.numberOfChannels > 1) {
    const monoBuffer = offlineCtx.createBuffer(
      1,
      Math.ceil(audioBuffer.duration * 16000),
      16000
    )
    const monoData = monoBuffer.getChannelData(0)
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const chData = audioBuffer.getChannelData(c)
      const len = Math.min(monoData.length, chData.length)
      for (let i = 0; i < len; i++) {
        monoData[i] += chData[i] / audioBuffer.numberOfChannels
      }
    }
    source.buffer = monoBuffer
  } else {
    source.buffer = audioBuffer
  }

  source.connect(offlineCtx.destination)
  source.start()
  const rendered = await offlineCtx.startRendering()

  onProgress('Generujem WAV súbor...')
  return audioBufferToWav(rendered)
}

/** Konverzia AudioBuffer na WAV Blob (PCM 16-bit) */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const samples = buffer.getChannelData(0)
  const len = samples.length

  const wavBuffer = new ArrayBuffer(44 + len * 2)
  const view = new DataView(wavBuffer)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + len * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * 2, true)
  view.setUint16(32, numChannels * 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, len * 2, true)

  let offset = 44
  for (let i = 0; i < len; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }

  return new Blob([wavBuffer], { type: 'audio/wav' })
}
