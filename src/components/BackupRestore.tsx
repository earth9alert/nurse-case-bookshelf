import { useRef, useState } from 'react'
import type { SurgicalCase } from '../types/case'
import { exportBackup, importBackup } from '../utils/backup'

interface BackupRestoreProps {
  cases: SurgicalCase[]
  onImport: (cases: SurgicalCase[], merge: boolean) => void
}

type ImportState =
  | { status: 'idle' }
  | { status: 'confirm'; cases: SurgicalCase[]; skipped: number; fileName: string }
  | { status: 'error'; message: string }
  | { status: 'success'; count: number }

type ExportState =
  | { status: 'idle' }
  | { status: 'done'; fileName: string }

export function BackupRestore({ cases, onImport }: BackupRestoreProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importState, setImportState] = useState<ImportState>({ status: 'idle' })
  const [exportState, setExportState] = useState<ExportState>({ status: 'idle' })

  const handleExport = () => {
    const fileName = exportBackup(cases)
    setImportState({ status: 'idle' }) // dismiss any import toast
    setExportState({ status: 'done', fileName })
    // Auto-dismiss after 8s
    setTimeout(() => setExportState({ status: 'idle' }), 8000)
  }

  const handleCopyToClipboard = async () => {
    try {
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        cases: cases,
      }
      const json = JSON.stringify(backupData, null, 2)
      await navigator.clipboard.writeText(json)
      setExportState({ status: 'done', fileName: 'copied-to-clipboard' })
      setTimeout(() => setExportState({ status: 'idle' }), 3000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const result = await importBackup(file)
    if (!result.ok) {
      setImportState({ status: 'error', message: result.message })
      return
    }
    setImportState({
      status: 'confirm',
      cases: result.cases,
      skipped: result.skipped,
      fileName: file.name,
    })
  }

  const handleConfirmReplace = () => {
    if (importState.status !== 'confirm') return
    onImport(importState.cases, false)
    setImportState({ status: 'success', count: importState.cases.length })
  }

  const handleConfirmMerge = () => {
    if (importState.status !== 'confirm') return
    onImport(importState.cases, true)
    setImportState({ status: 'success', count: importState.cases.length })
  }

  const handleDismiss = () => setImportState({ status: 'idle' })

  return (
    <>
      <div className="backup-actions">
        <button
          type="button"
          className="btn-backup"
          onClick={handleExport}
          title={`สำรองข้อมูล ${cases.length} เคส`}
          aria-label="สำรองข้อมูลทั้งหมดเป็นไฟล์ JSON"
        >
          💾 สำรองข้อมูล
        </button>
        <button
          type="button"
          className="btn-backup"
          onClick={handleCopyToClipboard}
          title="คัดลอก JSON ไปยังคลิปบอร์ด"
          aria-label="คัดลอกข้อมูล JSON"
        >
          📋 คัดลอก
        </button>
        <button
          type="button"
          className="btn-restore"
          onClick={() => fileInputRef.current?.click()}
          aria-label="นำเข้าข้อมูลจากไฟล์ backup"
        >
          📂 นำเข้าข้อมูล
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={handleFileChange}
        />
      </div>

      {/* Export success toast */}
      {exportState.status === 'done' && (
        <div className="backup-toast backup-toast--export" role="status">
          <div className="backup-toast__body">
            <span className="backup-toast__title">
              {exportState.fileName === 'copied-to-clipboard' ? '📋 คัดลอกแล้ว' : '💾 บันทึกไฟล์แล้ว'}
            </span>
            {exportState.fileName !== 'copied-to-clipboard' && (
              <>
                <span className="backup-toast__filename">{exportState.fileName}</span>
                <span className="backup-toast__hint">
                  ดูได้ที่โฟลเดอร์ Downloads ในเครื่องของคุณ
                </span>
              </>
            )}
            {exportState.fileName === 'copied-to-clipboard' && (
              <span className="backup-toast__hint">
                JSON อยู่ในคลิปบอร์ด — paste ได้ที่ editor หรือบันทึกเป็นไฟล์
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExportState({ status: 'idle' })}
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>
      )}

      {/* Import confirm dialog */}
      {importState.status === 'confirm' && (
        <div className="backup-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="backup-confirm-title">
          <div className="backup-modal">
            <h3 id="backup-confirm-title">นำเข้าข้อมูล</h3>
            <p className="backup-modal__file">📄 {importState.fileName}</p>
            <p>
              พบ <strong>{importState.cases.length} เคส</strong>
              {importState.skipped > 0 && (
                <span className="backup-modal__skipped"> (ข้ามไป {importState.skipped} รายการที่ไม่ถูกต้อง)</span>
              )}
            </p>
            <p className="backup-modal__warning">เลือกวิธีนำเข้า:</p>
            <div className="backup-modal__options">
              <button type="button" className="btn-import-merge" onClick={handleConfirmMerge}>
                ผสมกับข้อมูลเดิม
                <small>เคสที่ ID ซ้ำจะถูกอัปเดต เคสใหม่จะถูกเพิ่ม</small>
              </button>
              <button type="button" className="btn-import-replace" onClick={handleConfirmReplace}>
                แทนที่ข้อมูลทั้งหมด
                <small>ลบข้อมูลเดิมทั้งหมดและใช้ข้อมูลจากไฟล์นี้</small>
              </button>
            </div>
            <button type="button" className="btn-import-cancel" onClick={handleDismiss}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* Import error */}
      {importState.status === 'error' && (
        <div className="backup-toast backup-toast--error" role="alert">
          <span>❌ {importState.message}</span>
          <button type="button" onClick={handleDismiss} aria-label="ปิด">✕</button>
        </div>
      )}

      {/* Import success */}
      {importState.status === 'success' && (
        <div className="backup-toast backup-toast--success" role="status">
          <span>✅ นำเข้า {importState.count} เคสเรียบร้อยแล้ว</span>
          <button type="button" onClick={handleDismiss} aria-label="ปิด">✕</button>
        </div>
      )}
    </>
  )
}
