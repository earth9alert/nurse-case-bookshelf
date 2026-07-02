import { useCallback, useEffect, useRef, useState } from 'react'
import { sampleCases } from '../data/sampleCases'
import type { SurgicalCase } from '../types/case'
import { validateCase } from '../utils/caseValidator'

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
  } catch (err) {
    // QuotaExceededError or similar — warn without crashing
    console.warn('[useCases] Could not persist to localStorage:', err)
  }
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useCases() {
  const [cases, setCases] = useState<SurgicalCase[]>(loadCases)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const importCases = useCallback((incoming: SurgicalCase[], merge: boolean) => {
    setCases((prev) => {
      if (!merge) return incoming
      // Merge: incoming cases override existing ones with same id, new ones appended
      const existingMap = new Map(prev.map((c) => [c.id, c]))
      for (const c of incoming) existingMap.set(c.id, c)
      return Array.from(existingMap.values())
    })
  }, [])

  return { cases, resetToSample, upsertCase, deleteCase, importCases }
}
