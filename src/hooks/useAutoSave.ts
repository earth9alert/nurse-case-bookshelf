import { useCallback, useEffect, useRef, useState } from 'react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutoSave(onSave: () => Promise<void>, debounceMs = 1000) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [lastError, setLastError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
    }
  }, [])

  const triggerSave = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        setStatus('saving')
        setLastError(null)
        await onSave()
        setStatus('saved')
        // Show "saved" status for 1.5 seconds
        savedTimeoutRef.current = setTimeout(() => setStatus('idle'), 1500)
      } catch (error) {
        setStatus('error')
        setLastError(error instanceof Error ? error.message : 'Unknown error')
      }
    }, debounceMs)
  }, [onSave, debounceMs])

  return { status, lastError, triggerSave }
}
