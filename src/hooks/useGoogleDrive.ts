import { useState, useCallback } from 'react'
import type { SurgicalCase } from '../types/case'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export interface GoogleDriveStatus {
  isAuthenticated: boolean
  userEmail?: string
  lastSync?: string
}

export function useGoogleDrive() {
  const [status, setStatus] = useState<GoogleDriveStatus>({ isAuthenticated: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const authenticate = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID not configured')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Simplified: just save a token for now
      // In production, use proper OAuth flow
      const token = `mock-token-${Date.now()}`
      localStorage.setItem('google-drive-token', token)
      
      setStatus({
        isAuthenticated: true,
        userEmail: 'user@gmail.com',
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      setError(msg)
      console.error('[useGoogleDrive] Auth error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadBackup = useCallback(
    async (cases: SurgicalCase[]) => {
      if (!status.isAuthenticated) {
        setError('Not authenticated')
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const backupData = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          caseCount: cases.length,
          cases: cases,
        }

        const json = JSON.stringify(backupData, null, 2)
        
        // Save to localStorage as backup
        const fileName = `backup-drive-${Date.now()}`
        localStorage.setItem(fileName, json)

        const lastSync = new Date().toISOString()
        localStorage.setItem('google-drive-last-sync', lastSync)
        setStatus((prev) => ({ ...prev, lastSync }))

        console.log('[useGoogleDrive] Backup saved:', fileName)
        return true
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setError(msg)
        console.error('[useGoogleDrive] Upload error:', err)
        return false
      } finally {
        setLoading(false)
      }
    },
    [status]
  )

  const logout = useCallback(() => {
    localStorage.removeItem('google-drive-token')
    localStorage.removeItem('google-drive-last-sync')
    setStatus({ isAuthenticated: false })
  }, [])

  return {
    status,
    loading,
    error,
    authenticate,
    uploadBackup,
    logout,
  }
}
