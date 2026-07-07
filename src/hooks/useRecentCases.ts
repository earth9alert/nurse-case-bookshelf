import { useEffect, useState } from 'react'
import type { SurgicalCase } from '../types/case'

const STORAGE_KEY = 'nurse-bookshelf-recent'
const MAX_RECENT = 10

export interface RecentCase {
  id: string
  title: string
  openedAt: string // ISO timestamp
}

export function useRecentCases() {
  const [recentCases, setRecentCases] = useState<RecentCase[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setRecentCases(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  // Save to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentCases))
    } catch { /* ignore */ }
  }, [recentCases])

  const addRecent = (surgicalCase: SurgicalCase) => {
    setRecentCases((prev) => {
      // Remove if exists
      const filtered = prev.filter((r) => r.id !== surgicalCase.id)
      // Add to front
      const updated = [
        { id: surgicalCase.id, title: surgicalCase.title, openedAt: new Date().toISOString() },
        ...filtered,
      ]
      // Keep only MAX_RECENT
      return updated.slice(0, MAX_RECENT)
    })
  }

  const clearRecent = () => setRecentCases([])

  return { recentCases, addRecent, clearRecent }
}
