import { useEffect, useState } from 'react'

const STORAGE_KEY = 'nurse-bookshelf-theme'

function getInitial(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) return stored === 'dark'
  } catch { /* ignore */ }
  // Default: follow system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useDarkMode() {
  const [dark, setDark] = useState(getInitial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    try { localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light') } catch { /* ignore */ }
  }, [dark])

  const toggle = () => setDark((d) => !d)

  return { dark, toggle }
}
