import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_CATEGORIES, type Category } from '../types/case'

const STORAGE_KEY = 'nurse-case-bookshelf-categories'
const SAVE_DEBOUNCE_MS = 500

function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = (parsed as unknown[]).filter(
          (c): c is Category =>
            typeof c === 'object' &&
            c !== null &&
            typeof (c as Record<string, unknown>).id === 'string' &&
            typeof (c as Record<string, unknown>).name === 'string' &&
            typeof (c as Record<string, unknown>).color === 'string' &&
            typeof (c as Record<string, unknown>).icon === 'string',
        )
        if (valid.length > 0) return valid
      }
    }
  } catch {
    // fall through
  }
  return DEFAULT_CATEGORIES
}

function saveCategories(cats: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats))
  } catch (err) {
    console.warn('[useCategories] Could not persist:', err)
  }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(loadCategories)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => saveCategories(categories), SAVE_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [categories])

  const upsertCategory = useCallback((cat: Category) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.id === cat.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = cat
        return next
      }
      return [...prev, cat]
    })
  }, [])

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const resetToDefault = useCallback(() => {
    setCategories(DEFAULT_CATEGORIES)
  }, [])

  return { categories, upsertCategory, deleteCategory, resetToDefault }
}
