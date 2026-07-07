import { useCallback, useEffect, useRef, useState } from 'react'
import type { RecentCase, SurgicalCase } from '../types/case'

const RECENT_KEY = 'nurse-case-bookshelf-recent'
const MAX_RECENT = 10

function loadRecent(): RecentCase[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return (parsed as unknown[])
          .filter(
            (item): item is RecentCase =>
              typeof item === 'object' &&
              item !== null &&
              'caseId' in item &&
              'visitedAt' in item &&
              typeof (item as any).caseId === 'string' &&
              typeof (item as any).visitedAt === 'string'
          )
          .slice(0, MAX_RECENT)
      }
    }
  } catch {
    // corrupted storage → fall through to defaults
  }
  return []
}

function saveRecent(recent: RecentCase[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
  } catch (err) {
    console.warn('[useRecent] Could not persist to localStorage:', err)
  }
}

export function useRecent() {
  const [recent, setRecent] = useState<RecentCase[]>(loadRecent)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveRecent(recent), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [recent])

  const addRecent = useCallback((caseId: string) => {
    setRecent((prev) => {
      // Remove if already exists
      const filtered = prev.filter((r) => r.caseId !== caseId)
      // Add to front
      const updated: RecentCase = { caseId, visitedAt: new Date().toISOString() }
      return [updated, ...filtered].slice(0, MAX_RECENT)
    })
  }, [])

  const getRecentCases = useCallback(
    (cases: SurgicalCase[]): SurgicalCase[] => {
      const caseMap = new Map(cases.map((c) => [c.id, c]))
      return recent
        .map((r) => caseMap.get(r.caseId))
        .filter((c): c is SurgicalCase => c !== undefined)
    },
    [recent]
  )

  return { recent, addRecent, getRecentCases }
}
