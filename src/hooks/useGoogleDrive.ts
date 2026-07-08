import { useEffect, useState, useCallback } from 'react'
import type { SurgicalCase } from '../types/case'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export interface GoogleDriveStatus {
  isAuthenticated: boolean
  userEmail?: string
  folderId?: string
  lastSync?: string
}

export function useGoogleDrive() {
  const [status, setStatus] = useState<GoogleDriveStatus>({ isAuthenticated: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize Google API
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('[useGoogleDrive] VITE_GOOGLE_CLIENT_ID not set')
      return
    }

    const initGoogleAPI = async () => {
      try {
        // Load Google API script
        if (!window.gapi) {
          await loadGoogleAPI()
        }
        // Check if already authenticated
        const token = localStorage.getItem('google-drive-token')
        if (token) {
          setStatus((prev) => ({ ...prev, isAuthenticated: true }))
        }
      } catch (err) {
        console.error('[useGoogleDrive] Init failed:', err)
      }
    }

    initGoogleAPI()
  }, [])

  const loadGoogleAPI = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => {
        window.gapi.load('client:auth2', () => {
          resolve()
        })
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  const authenticate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (!window.gapi || !window.gapi.auth2) {
        throw new Error('Google API not loaded')
      }

      const auth2 = window.gapi.auth2.getAuthInstance()
      if (!auth2) {
        throw new Error('Auth2 instance not available')
      }

      const user = await auth2.signIn()
      const token = user.getAuthResponse().id_token
      
      localStorage.setItem('google-drive-token', token)
      setStatus({
        isAuthenticated: true,
        userEmail: user.getBasicProfile().getEmail(),
      })

      await initDriveAPI(token)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      setError(msg)
      console.error('[useGoogleDrive] Auth error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const initDriveAPI = async (token: string) => {
    try {
      window.gapi.client.setToken({ access_token: token })
      await window.gapi.client.load('drive', 'v3')
    } catch (err) {
      console.error('[useGoogleDrive] Drive API init failed:', err)
    }
  }

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

        const fileName = `nurse-case-backup-${new Date().toISOString().split('T')[0]}.json`
        const fileContent = JSON.stringify(backupData, null, 2)

        // Create file in Google Drive
        const response = await window.gapi.client.drive.files.create({
          name: fileName,
          mimeType: 'application/json',
          parents: [status.folderId || 'root'],
          body: {
            name: fileName,
            mimeType: 'application/json',
          },
          media: {
            mimeType: 'application/json',
            body: fileContent,
          },
        })

        if (!response.result.id) {
          throw new Error('Upload failed: no file ID')
        }

        const lastSync = new Date().toISOString()
        localStorage.setItem('google-drive-last-sync', lastSync)
        setStatus((prev) => ({ ...prev, lastSync }))

        console.log('[useGoogleDrive] Backup uploaded:', response.result.id)
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

// Extend window for Google API
declare global {
  interface Window {
    gapi: any
  }
}
