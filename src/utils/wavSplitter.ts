/**
 * Rozdelenie WAV blob na platné WAV chunky s max veľkosťou.
 * Dôvod: Groq limit 25 MB – každý chunk musí mať vlastnú WAV hlavičku,
 * inak Groq vráti "could not process file – is it a valid media file?"
 * Poznámka: raw binary slice M4A/MP3 nie je platný audio súbor!
 */
export async function splitWav(wavBlob: Blob, maxBytes: number): Promise<Blob[]> {
  const ab = await wavBlob.arrayBuffer()
  const view = new DataView(ab)

  // WAV hlavička = 44 bytov, dáta začínajú na offset 44
  const header = ab.slice(0, 44)
  const dataSize = view.getUint32(40, true)
  const maxDataBytes = maxBytes - 44

  const chunks: Blob[] = []
  let offset = 44

  while (offset < 44 + dataSize) {
    const chunkDataSize = Math.min(maxDataBytes, 44 + dataSize - offset)

    // Každý chunk dostane vlastnú platnú WAV hlavičku
    const chunkBuf = new ArrayBuffer(44 + chunkDataSize)
    const chunkView = new DataView(chunkBuf)

    // Kopíruj pôvodnú hlavičku
    new Uint8Array(chunkBuf).set(new Uint8Array(header))

    // Aktualizuj veľkosti pre tento chunk
    chunkView.setUint32(4, 36 + chunkDataSize, true)
    chunkView.setUint32(40, chunkDataSize, true)

    // Kopíruj audio dáta
    new Uint8Array(chunkBuf, 44).set(new Uint8Array(ab, offset, chunkDataSize))

    chunks.push(new Blob([chunkBuf], { type: 'audio/wav' }))
    offset += chunkDataSize
  }

  return chunks
}
