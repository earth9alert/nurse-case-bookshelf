import { useCallback, useEffect, useRef, useState } from 'react'
import { sampleCases } from '../data/sampleCases'
import type { SurgicalCase } from '../types/case'
import { validateCase } from '../utils/caseValidator'
import { loadCasesFromIDB, saveCasesToIDB } from './useIndexedDB'

const STORAGE_KEY = 'nurse-case-bookshelf-cases'
const SAVE_DEBOUNCE_MS = 500

// ── Storage helpers ─────────────────────────────────────────────────────────

function loadCases(): SurgicalCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const valid = (parsed as unknown[])
          .map(validateCase)
          .filter((c): c is SurgicalCase => c !== null)
        if (valid.length > 0) return valid
      }
    }
  } catch {
    // corrupted storage → fall through to defaults
  }
  return sampleCases
}

function saveCases(cases: SurgicalCase[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
    console.log(`[useCases] Saved ${cases.length} cases to localStorage`)
  } catch (err) {
    // QuotaExceededError or similar — warn without crashing
    console.error('[useCases] Could not persist to localStorage:', err)
    // Try to free up space by removing old auto-backups
    try {
      const keys = Object.keys(localStorage)
      const backupKeys = keys.filter((k) => k.startsWith('backup-')).sort()
      if (backupKeys.length > 1) {
        localStorage.removeItem(backupKeys[0])
        console.log('[useCases] Removed old backup, retrying save...')
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
      }
    } catch {
      console.error('[useCases] Storage full and cleanup failed')
    }
  }

  // Also save to IndexedDB for better persistence
  saveCasesToIDB(cases).catch((err) => {
    console.error('[useCases] IndexedDB save error:', err)
  })
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useCases() {
  const [cases, setCases] = useState<SurgicalCase[]>(loadCases)
  const [isInitialized, setIsInitialized] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Try to load from IndexedDB if localStorage is empty
  useEffect(() => {
    if (!isInitialized && cases.length === sampleCases.length) {
      // Only try IndexedDB if we're still on sample data
      loadCasesFromIDB().then((idbCases) => {
        if (idbCases.length > 0) {
          console.log('[useCases] Restored cases from IndexedDB')
          setCases(idbCases)
        }
        setIsInitialized(true)
      })
    } else {
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveCases(cases), SAVE_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [cases])

  const resetToSample = useCallback(() => {
    setCases(sampleCases)
  }, [])

  const upsertCase = useCallback((surgicalCase: SurgicalCase) => {
    setCases((prev) => {
      const idx = prev.findIndex((c) => c.id === surgicalCase.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = surgicalCase
        return next
      }
      return [...prev, surgicalCase]
    })
  }, [])

  const deleteCase = useCallback((id: string) => {
    setCases((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const importCases = useCallback((incoming: SurgicalCase[], merge?: boolean) => {
    setCases((prev) => {
      if (!merge) return incoming
      // Merge: incoming cases override existing ones with same id, new ones appended
      const existingMap = new Map(prev.map((c) => [c.id, c]))
      for (const c of incoming) existingMap.set(c.id, c)
      return Array.from(existingMap.values())
    })
  }, [])

  const duplicateCase = useCallback((id: string) => {
    setCases((prev) => {
      const original = prev.find((c) => c.id === id)
      if (!original) return prev
      const copy: SurgicalCase = {
        ...original,
        id: crypto.randomUUID(),
        title: `${original.title} (สำเนา)`,
        updatedAt: new Date().toISOString(),
      }
      const idx = prev.findIndex((c) => c.id === id)
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }, [])

  return { cases, resetToSample, upsertCase, deleteCase, importCases, duplicateCase }
}
