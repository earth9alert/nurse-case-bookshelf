import { useState, useEffect } from 'react'
import { isSupabaseEnabled } from './useSupabase'

export type StorageSource = 'supabase' | 'cache' | 'loading'

export interface StorageStatus {
  source: StorageSource
  label: string
  icon: string
  color: string
}

const STATUS_MAP: Record<StorageSource, StorageStatus> = {
  supabase: {
    source: 'supabase',
    label: 'Syncing to Cloud',
    icon: '☁️',
    color: '#2d6a4f',
  },
  cache: {
    source: 'cache',
    label: 'Offline (cached)',
    icon: '💾',
    color: '#c1666b',
  },
  loading: {
    source: 'loading',
    label: 'Loading...',
    icon: '⏳',
    color: '#666',
  },
}

export function useStorageStatus(isInitialized: boolean): StorageStatus {
  const [status, setStatus] = useState<StorageSource>('loading')

  useEffect(() => {
    if (!isInitialized) {
      setStatus('loading')
      return
    }

    // Check if online and Supabase enabled
    if (isSupabaseEnabled() && navigator.onLine) {
      setStatus('supabase')
    } else {
      setStatus('cache')
    }
  }, [isInitialized])

  // Listen for online/offline events
  useEffect(() => {
    if (!isInitialized || !isSupabaseEnabled()) return

    const handleOnline = () => setStatus('supabase')
    const handleOffline = () => setStatus('cache')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isInitialized])

  return STATUS_MAP[status]
}
