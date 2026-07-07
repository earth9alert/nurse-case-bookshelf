import { useEffect, useState, useRef } from 'react'
import type { SurgicalCase } from '../types/case'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface UseAutoSaveOptions {
  debounceMs?: number
  autoHideAfterMs?: number
}

export function useAutoSave(
  case_: SurgicalCase | undefined,
  onSave: (c: SurgicalCase) => void,
  options: UseAutoSaveOptions = {}
) {
  const { debounceMs = 1000, autoHideAfterMs = 2000 } = options
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce auto-save
  useEffect(() => {
    if (!case_) {
      setStatus('idle')
      return
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      setStatus('saving')
      // Simulate async save
      saveTimeoutRef.current = setTimeout(() => {
        try {
          onSave(case_)
          setStatus('saved')
          // Auto-hide after delay
          setTimeout(() => setStatus('idle'), autoHideAfterMs)
        } catch {
          setStatus('error')
          setTimeout(() => setStatus('idle'), autoHideAfterMs)
        }
      }, 300)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [case_, onSave, debounceMs, autoHideAfterMs])

  return { status }
}
