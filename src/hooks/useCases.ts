import { useCallback, useEffect, useState } from 'react'
import { sampleCases } from '../data/sampleCases'
import type { SurgicalCase } from '../types/case'
import { uploadCasesToSupabase, downloadCasesFromSupabase, isSupabaseEnabled, getAnonymousUserId } from './useSupabase'

const STORAGE_KEY = 'nurse-case-bookshelf-cases'

// ── Storage helpers ─────────────────────────────────────────────────────────

function loadCasesFromCache(): SurgicalCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[useCases] Loaded ${parsed.length} cases from cache`)
        return parsed
      }
    }
  } catch (err) {
    console.error('[useCases] Failed to load from cache:', err)
  }
  return sampleCases
}

function saveCasesToCache(cases: SurgicalCase[]): void {
  try {
    const json = JSON.stringify(cases)
    localStorage.setItem(STORAGE_KEY, json)
    console.log(`[useCases] Cached ${cases.length} cases (${(json.length / 1024).toFixed(1)} KB)`)
  } catch (err) {
    console.error('[useCases] Failed to cache cases:', err)
    
    // Handle quota exceeded error
    if (err instanceof Error && err.name === 'QuotaExceededError') {
      console.warn('[useCases] localStorage quota exceeded!')
      // Try to save minimal data (IDs only) as fallback
      try {
        const minimalData = cases.map(c => ({ id: c.id, title: c.title, categoryId: c.categoryId }))
        localStorage.setItem(STORAGE_KEY + '_minimal', JSON.stringify(minimalData))
        console.log('[useCases] Saved minimal backup')
      } catch {
        console.error('[useCases] Even minimal backup failed')
      }
      
      // Notify user
      alert('⚠️ พื้นที่เก็บข้อมูลเต็ม!\n\nแนะนำ:\n1. ลบเคสที่ไม่ใช้\n2. ลดจำนวนรูปภาพ\n3. ส่งออกข้อมูลเป็นไฟล์ backup')
    }
  }
}

function loadCases(): SurgicalCase[] {
  return loadCasesFromCache()
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useCases() {
  const [cases, setCases] = useState<SurgicalCase[]>(loadCases)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load from Supabase on mount (if available)
  useEffect(() => {
    if (!isSupabaseEnabled()) {
      console.log('[useCases] Supabase disabled - using cache only')
      setIsInitialized(true)
      return
    }

    const userId = getAnonymousUserId()
    downloadCasesFromSupabase(userId)
      .then((supabaseCases) => {
        if (supabaseCases.length > 0) {
          console.log('[useCases] Loaded cases from Supabase')
          setCases(supabaseCases)
          saveCasesToCache(supabaseCases) // Update cache
        }
      })
      .catch((err) => {
        console.error('[useCases] Failed to load from Supabase:', err)
      })
      .finally(() => {
        setIsInitialized(true)
      })
  }, [])

  // Cache locally whenever cases change
  useEffect(() => {
    if (cases.length > 0) {
      saveCasesToCache(cases)
    }
  }, [cases])

  // Upload to Supabase whenever cases change (debounced with rate limiting)
  useEffect(() => {
    if (!isInitialized || !isSupabaseEnabled() || cases.length === 0) return

    const timer = setTimeout(() => {
      const userId = getAnonymousUserId()
      uploadCasesToSupabase(userId, cases).catch((err) => {
        console.error('[useCases] Upload to Supabase failed:', err)
      })
    }, 2000) // Increased debounce to 2 seconds for rate limiting

    return () => clearTimeout(timer)
  }, [cases, isInitialized])

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

  return { cases, resetToSample, upsertCase, deleteCase, importCases, duplicateCase, isInitialized }
}
