import { useEffect, useState } from 'react'

const STORAGE_KEY = 'nurse-case-bookshelf-cases'

export type StorageLevel = 'ok'

export interface StorageInfo {
  level: StorageLevel
  usedMB: number
}

function measure(): StorageInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? ''
    const bytes = new Blob([raw]).size
    const usedMB = parseFloat((bytes / 1024 / 1024).toFixed(2))
    return { level: 'ok', usedMB }
  } catch {
    return { level: 'ok', usedMB: 0 }
  }
}

export function useStorageWarning() {
  const [info, setInfo] = useState<StorageInfo>(measure)

  // Re-measure whenever localStorage might have changed
  useEffect(() => {
    const update = () => setInfo(measure())
    window.addEventListener('storage', update)
    // Also poll every 10 s in case updates happen in-tab
    const id = setInterval(update, 10_000)
    return () => {
      window.removeEventListener('storage', update)
      clearInterval(id)
    }
  }, [])

  // Expose a manual refresh for after save operations
  const refresh = () => setInfo(measure())

  return { ...info, refresh }
}
