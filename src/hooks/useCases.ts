import { useCallback, useEffect, useState } from 'react'
import { sampleCases } from '../data/sampleCases'
import type { SurgicalCase } from '../types/case'
import { uploadCasesToSupabase, downloadCasesFromSupabase, isSupabaseEnabled, getAnonymousUserId } from './useSupabase'
import { migrateCasesToStorageUrls } from '../utils/imageMigration'

const STORAGE_KEY = 'nurse-case-bookshelf-cases'

// ── Storage helpers ─────────────────────────────────────────────────────────

function loadCasesFromCache(): SurgicalCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[useCases] Loaded ${parsed.length} cases from cache`)
        // Migrate old string IDs to UUIDs
        const migrated = parsed.map((c: any) => {
          // Check if ID is not a valid UUID (contains non-hex chars or wrong format)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.id)
          if (!isUUID) {
            console.log(`[useCases] Migrating old ID "${c.id}" to UUID`)
            return { ...c, id: crypto.randomUUID() }
          }
          return c
        })
        return migrated
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
  // Always start empty - data comes from Supabase only
  return []
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
      .then(async (supabaseCases) => {
        if (supabaseCases.length > 0) {
          console.log('[useCases] Loaded cases from Supabase')
          
          // Migrate base64 images to Supabase Storage
          const migratedCases = await migrateCasesToStorageUrls(supabaseCases, userId)
          
          // If any images were migrated, upload the updated cases back
          const hasChanges = migratedCases.some((c, i) => 
            JSON.stringify(c) !== JSON.stringify(supabaseCases[i])
          )
          
          setCases(migratedCases)
          saveCasesToCache(migratedCases) // Update cache
          
          if (hasChanges) {
            console.log('[useCases] Uploading migrated cases back to Supabase...')
            uploadCasesToSupabase(userId, migratedCases)
              .then(() => console.log('[useCases] Migration upload complete'))
              .catch((err) => console.error('[useCases] Migration upload failed:', err))
          }
        } else {
          // If Supabase is empty, upload current cases (sample or cached)
          console.log('[useCases] Supabase empty - uploading initial cases')
          const currentCases = loadCasesFromCache()
          if (currentCases.length > 0) {
            uploadCasesToSupabase(userId, currentCases)
              .then(() => console.log('[useCases] Initial upload complete'))
              .catch((err) => console.error('[useCases] Initial upload failed:', err))
          }
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
    if (!isInitialized || !isSupabaseEnabled() || cases.length === 0) {
      console.log(`[useCases] Upload skipped - initialized:${isInitialized} enabled:${isSupabaseEnabled()} cases:${cases.length}`)
      return
    }

    console.log(`[useCases] Scheduling upload in 2s (${cases.length} cases)`)
    const timer = setTimeout(() => {
      const userId = getAnonymousUserId()
      console.log(`[useCases] Uploading ${cases.length} cases...`)
      uploadCasesToSupabase(userId, cases).catch((err) => {
        console.error('[useCases] Upload to Supabase failed:', err)
      })
    }, 2000) // Increased debounce to 2 seconds for rate limiting

    return () => clearTimeout(timer)
  }, [cases, isInitialized])

  const resetToSample = useCallback(() => {
    // Reset to empty since we no longer have sample cases
    console.log('[useCases] Reset to empty (no sample cases)')
    setCases([])
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
    // Find the case being deleted (to get images for cleanup)
    const caseToDelete = cases.find(c => c.id === id)
    
    // Delete from local state
    setCases((prev) => prev.filter((c) => c.id !== id))
    
    // Delete from Supabase if enabled
    if (isSupabaseEnabled() && caseToDelete) {
      const userId = getAnonymousUserId()
      console.log(`[useCases] Deleting case "${caseToDelete.title}" from Supabase...`)
      
      // Get current cases from state and filter out the deleted one
      setCases((prev) => {
        const updated = prev.filter((c) => c.id !== id)
        
        // Upload updated list without the deleted case
        uploadCasesToSupabase(userId, updated)
          .then(() => console.log(`[useCases] ✓ Case deleted from Supabase`))
          .catch((err) => console.error('[useCases] Failed to delete case from Supabase:', err))
        
        return updated
      })
    }
  }, [cases, isSupabaseEnabled])

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
