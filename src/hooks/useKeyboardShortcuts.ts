import { useEffect, useCallback } from 'react'

export interface KeyboardShortcutMap {
  [key: string]: (e: KeyboardEvent) => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcutMap) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Build a key string like "ctrl+f" or "d"
      const modifiers = []
      if (e.ctrlKey || e.metaKey) modifiers.push('ctrl')
      if (e.shiftKey) modifiers.push('shift')
      if (e.altKey) modifiers.push('alt')

      const key = e.key.toLowerCase()
      const fullKey = modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key

      // Check for matching shortcut
      if (shortcuts[fullKey]) {
        e.preventDefault()
        shortcuts[fullKey](e)
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
