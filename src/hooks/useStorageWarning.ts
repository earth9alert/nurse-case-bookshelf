import { useEffect, useState } from 'react'

const STORAGE_KEY = 'nurse-case-bookshelf-cases'
const WARN_BYTES = 3.5 * 1024 * 1024   // warn at 3.5 MB
const CRIT_BYTES = 4.5 * 1024 * 1024   // critical at 4.5 MB
const QUOTA_BYTES = 5 * 1024 * 1024    // typical localStorage quota ~5 MB

export type StorageLevel = 'ok' | 'warn' | 'critical'

export interface StorageInfo {
  level: StorageLevel
  usedMB: number
  pct: number
}

function measure(): StorageInfo {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? ''
    const bytes = new Blob([raw]).size
    const pct = Math.round((bytes / QUOTA_BYTES) * 100)
    const usedMB = parseFloat((bytes / 1024 / 1024).toFixed(1))
    const level: StorageLevel = bytes >= CRIT_BYTES ? 'critical' : bytes >= WARN_BYTES ? 'warn' : 'ok'
    return { level, usedMB, pct }
  } catch {
    return { level: 'ok', usedMB: 0, pct: 0 }
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
