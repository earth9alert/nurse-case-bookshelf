import { useEffect } from 'react'
import type { SurgicalCase } from '../types/case'

const DB_NAME = 'NurseCaseBookshelf'
const STORE_NAME = 'cases'
const DB_VERSION = 1

// Initialize IndexedDB
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

// Save cases to IndexedDB
export async function saveCasesToIDB(cases: SurgicalCase[]): Promise<void> {
  try {
    const db = await initDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    // Clear old data
    await new Promise<void>((resolve, reject) => {
      store.clear().onsuccess = () => resolve()
      store.clear().onerror = () => reject(store.clear().error)
    })

    // Add new data (no sanitization - store as-is)
    for (const caseData of cases) {
      await new Promise<void>((resolve, reject) => {
        store.add(caseData).onsuccess = () => resolve()
        store.add(caseData).onerror = () => reject(store.add(caseData).error)
      })
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })

    console.log(`✓ IndexedDB: ${cases.length} cases saved`)
  } catch (err) {
    console.error('IndexedDB save failed:', err)
  }
}

// Load cases from IndexedDB
export async function loadCasesFromIDB(): Promise<SurgicalCase[]> {
  try {
    const db = await initDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const cases = request.result as SurgicalCase[]
        console.log(`✓ IndexedDB: ${cases.length} cases loaded`)
        resolve(cases)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (err) {
    console.error('IndexedDB load failed:', err)
    return []
  }
}

// Hook to sync cases with IndexedDB
export function useIndexedDBSync(cases: SurgicalCase[]) {
  useEffect(() => {
    if (cases.length > 0) {
      saveCasesToIDB(cases)
    }
  }, [cases])
}

// Get IndexedDB storage size
export async function getIndexedDBSize(): Promise<number> {
  try {
    if (!navigator.storage || !navigator.storage.estimate) {
      return 0
    }
    const estimate = await navigator.storage.estimate()
    return estimate.usage ?? 0
  } catch {
    return 0
  }
}
