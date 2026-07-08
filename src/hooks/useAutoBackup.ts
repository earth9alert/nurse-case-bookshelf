import { useEffect } from 'react'
import type { SurgicalCase } from '../types/case'

export function useAutoBackup(cases: SurgicalCase[]) {
  useEffect(() => {
    if (cases.length === 0) return

    // Auto backup every 30 minutes
    const backupInterval = setInterval(() => {
      try {
        const backupData = {
          timestamp: new Date().toISOString(),
          caseCount: cases.length,
          data: cases,
        }
        const json = JSON.stringify(backupData)
        
        // Store in localStorage with timestamp
        localStorage.setItem(`backup-${Date.now()}`, json)
        console.log(`✓ Auto-backup: ${cases.length} cases saved`)

        // Keep only last 3 backups (clean old ones)
        const allKeys = Object.keys(localStorage)
        const backupKeys = allKeys.filter((k) => k.startsWith('backup-')).sort().reverse()
        backupKeys.slice(3).forEach((k) => localStorage.removeItem(k))
      } catch (err) {
        console.error('Auto-backup failed:', err)
      }
    }, 30 * 60 * 1000) // 30 minutes

    return () => clearInterval(backupInterval)
  }, [cases])
}

// Function to list all backups
export function listBackups() {
  const backups: Array<{ key: string; timestamp: string; caseCount: number }> = []
  Object.keys(localStorage)
    .filter((k) => k.startsWith('backup-'))
    .forEach((key) => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        backups.push({
          key,
          timestamp: data.timestamp,
          caseCount: data.caseCount,
        })
      } catch {
        /* ignore */
      }
    })
  return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

// Function to restore from backup
export function restoreFromBackup(backupKey: string): SurgicalCase[] | null {
  try {
    const data = JSON.parse(localStorage.getItem(backupKey) || 'null')
    return data?.data ?? null
  } catch {
    return null
  }
}
