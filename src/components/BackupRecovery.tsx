import { useState } from 'react'
import { listBackups, restoreFromBackup } from '../hooks/useAutoBackup'
import type { SurgicalCase } from '../types/case'

interface BackupRecoveryProps {
  onRestore: (cases: SurgicalCase[], merge?: boolean) => void
}

export function BackupRecovery({ onRestore }: BackupRecoveryProps) {
  const [showModal, setShowModal] = useState(false)
  const backups = listBackups()

  if (backups.length === 0) return null

  const handleRestore = (backupKey: string) => {
    const restored = restoreFromBackup(backupKey)
    if (restored && window.confirm(`ต้องการกู้คืน ${restored.length} เคส?`)) {
      onRestore(restored, false) // false = replace, not merge
      setShowModal(false)
      alert('✓ กู้คืนข้อมูลสำเร็จ')
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn-backup-recovery"
        onClick={() => setShowModal(true)}
        title={`มี ${backups.length} backup`}
      >
        🔄 กู้คืน
      </button>

      {showModal && (
        <div className="backup-recovery-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="backup-recovery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="backup-recovery-modal__header">
              <h3>📦 กู้คืนจาก Backup</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="backup-recovery-modal__body">
              {backups.length === 0 ? (
                <p className="backup-recovery__empty">ยังไม่มี backup</p>
              ) : (
                <div className="backup-recovery__list">
                  {backups.map((b) => (
                    <div key={b.key} className="backup-recovery__item">
                      <div className="backup-recovery__info">
                        <strong>{b.caseCount} เคส</strong>
                        <small>
                          {new Date(b.timestamp).toLocaleString('th-TH')}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="btn-restore"
                        onClick={() => handleRestore(b.key)}
                      >
                        กู้คืน
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
