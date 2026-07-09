import type { SurgicalCase } from '../types/case'
import { validateCase } from './caseValidator'

const BACKUP_VERSION = 1

export interface BackupFile {
  version: number
  exportedAt: string
  cases: SurgicalCase[]
}

// ── Export (without images for readability) ──────────────────────────────

export function exportBackupReadable(cases: SurgicalCase[]): string {
  // Remove images to make JSON readable
  const casesWithoutImages = cases.map(c => ({
    ...c,
    images: Object.keys(c.images).reduce((acc, key) => {
      const imgs = c.images[key as keyof typeof c.images]
      acc[key] = imgs ? `[${imgs.length} รูป]` : []
      return acc
    }, {} as any)
  }))

  const payload = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    note: 'ไฟล์นี้ไม่มีรูปภาพ - ใช้สำหรับอ่านข้อมูลเท่านั้น ไม่สามารถนำเข้ากลับได้',
    totalCases: cases.length,
    cases: casesWithoutImages,
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const dateStr = new Date()
    .toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '-')

  const fileName = `nurse-cases-readable-${dateStr}.json`

  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()

  setTimeout(() => URL.revokeObjectURL(url), 10_000)

  return fileName
}

// ── Export ───────────────────────────────────────────────────────────────────

export function exportBackup(cases: SurgicalCase[]): string {
  const payload: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    cases,
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const dateStr = new Date()
    .toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\//g, '-')

  const fileName = `nurse-cases-backup-${dateStr}.json`

  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()

  // Clean up object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 10_000)

  return fileName
}

// ── Export single case ────────────────────────────────────────────────────

export function exportSingleCase(surgicalCase: SurgicalCase): string {
  const payload: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    cases: [surgicalCase],
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  // Sanitize filename
  const safeName = surgicalCase.title
    .replace(/[^a-zA-Z0-9ก-๙\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 40)
  const fileName = `case-${safeName}.json`

  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)

  return fileName
}

export interface ImportResult {
  ok: true
  cases: SurgicalCase[]
  skipped: number
}

export interface ImportError {
  ok: false
  message: string
}

const MAX_IMPORT_CASES = 1000
const MAX_FILE_SIZE_MB = 20

export async function importBackup(file: File): Promise<ImportResult | ImportError> {
  if (!file.name.endsWith('.json') && file.type !== 'application/json') {
    return { ok: false, message: 'ไฟล์ต้องเป็น .json เท่านั้น' }
  }

  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return { ok: false, message: `ไฟล์ใหญ่เกิน ${MAX_FILE_SIZE_MB} MB` }
  }

  let raw: string
  try {
    raw = await file.text()
  } catch {
    return { ok: false, message: 'อ่านไฟล์ไม่ได้' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, message: 'ไฟล์ JSON ไม่ถูกต้อง' }
  }

  // Accept both the versioned backup format and a plain array of cases
  let rawCases: unknown[]
  if (Array.isArray(parsed)) {
    rawCases = parsed
  } else if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'cases' in parsed &&
    Array.isArray((parsed as Record<string, unknown>).cases)
  ) {
    rawCases = (parsed as BackupFile).cases
  } else {
    return { ok: false, message: 'รูปแบบไฟล์ไม่ถูกต้อง — ต้องเป็นไฟล์ backup จากแอปนี้' }
  }

  // Limit number of cases to prevent DoS
  if (rawCases.length > MAX_IMPORT_CASES) {
    return { ok: false, message: `ไฟล์มีเคสมากเกินไป (${rawCases.length} เคส) — อนุญาตสูงสุด ${MAX_IMPORT_CASES} เคส` }
  }

  const valid: SurgicalCase[] = []
  let skipped = 0

  for (const item of rawCases) {
    const result = validateCase(item)
    if (result !== null) {
      valid.push(result)
    } else {
      skipped++
    }
  }

  if (valid.length === 0) {
    return { ok: false, message: `ไม่พบเคสที่ถูกต้องในไฟล์ (ถูกข้าม ${skipped} รายการ)` }
  }

  return { ok: true, cases: valid, skipped }
}
