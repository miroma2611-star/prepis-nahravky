import { describe, it, expect } from 'vitest'
import { splitWav } from '../src/utils/wavSplitter'

/** Vytvorí minimálny platný WAV blob pre testy */
function createTestWav(durationSamples: number): Blob {
  const dataSize = durationSamples * 2 // 16-bit PCM
  const buf = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buf)
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)) }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, 16000, true)
  view.setUint32(28, 32000, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)
  return new Blob([buf], { type: 'audio/wav' })
}

describe('splitWav', () => {
  it('vráti 1 chunk pre malý súbor', async () => {
    const wav = createTestWav(1000)
    const chunks = await splitWav(wav, 10 * 1024 * 1024)
    expect(chunks).toHaveLength(1)
  })

  it('rozdelí veľký súbor na viacero chunkov', async () => {
    // 100k samples = 200KB dát + 44B hlavička
    const wav = createTestWav(100_000)
    // Max chunk = 44 + 50_000*2 = ~100KB
    const chunks = await splitWav(wav, 44 + 50_000 * 2)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('každý chunk začína platnou WAV hlavičkou (RIFF)', async () => {
    const wav = createTestWav(100_000)
    const chunks = await splitWav(wav, 44 + 50_000 * 2)
    for (const chunk of chunks) {
      const ab = await chunk.arrayBuffer()
      const view = new DataView(ab)
      // Prvé 4 byty musia byť 'RIFF'
      const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3))
      expect(riff).toBe('RIFF')
    }
  })
})
