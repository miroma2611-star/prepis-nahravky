import { useState } from 'react'

/**
 * Hook pre uloženie hodnoty v localStorage.
 * Bezpečný voči SSR a JSON parse chybám.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage môže byť nedostupný (private mode, quota)
      console.warn(`localStorage: nedá sa uložiť kľúč "${key}"`)
    }
  }

  return [storedValue, setValue] as const
}
