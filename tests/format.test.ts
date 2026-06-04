import { describe, it, expect } from 'vitest'
import { formatSize, formatDate } from '../src/utils/format'

describe('formatSize', () => {
  it('zobrazí KB pre malé súbory', () => {
    expect(formatSize(512 * 1024)).toBe('512 KB')
  })
  it('zobrazí MB pre veľké súbory', () => {
    expect(formatSize(54 * 1024 * 1024)).toBe('54.0 MB')
  })
  it('zaokrúhli na 1 desatinné miesto pre MB', () => {
    expect(formatSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
  })
})

describe('formatDate', () => {
  it('vráti formátovaný dátum v slovenskom formáte', () => {
    const result = formatDate('2026-06-04T10:00:00.000Z')
    // Kontroluj že obsahuje rok a čas
    expect(result).toContain('2026')
  })
})
