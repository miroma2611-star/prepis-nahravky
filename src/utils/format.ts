/** Formátovanie veľkosti súboru pre zobrazenie užívateľovi */
export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Formátovanie dátumu pre históriu prepisov */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('sk-SK', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
