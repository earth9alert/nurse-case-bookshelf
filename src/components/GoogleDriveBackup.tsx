import { useState, useEffect } from 'react'
import { useGoogleDrive } from '../hooks/useGoogleDrive'
import type { SurgicalCase } from '../types/case'

interface GoogleDriveBackupProps {
  cases: SurgicalCase[]
}

export function GoogleDriveBackup({ cases }: GoogleDriveBackupProps) {
  const { status, loading, error, authenticate, uploadBackup, logout } = useGoogleDrive()
  const [showModal, setShowModal] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // Auto-sync every 30 minutes when authenticated
  useEffect(() => {
    if (!status.isAuthenticated) return

    const interval = setInterval(() => {
      uploadBackup(cases)
        .then((success) => {
          if (success) {
            console.log('Auto-sync to Google Drive successful')
          }
        })
        .catch((err) => console.error('Auto-sync failed:', err))
    }, 30 * 60 * 1000) // 30 minutes

    return () => clearInterval(interval)
  }, [status.isAuthenticated, cases, uploadBackup])

  const handleAuthenticate = async () => {
    await authenticate()
    setUploadSuccess(true)
    setTimeout(() => setUploadSuccess(false), 3000)
  }

  const handleUpload = async () => {
    const success = await uploadBackup(cases)
    if (success) {
      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn-google-drive"
        onClick={() => setShowModal(true)}
        title={status.isAuthenticated ? `${cases.length} เคสพร้อม sync` : 'เชื่อมต่อ Google Drive'}
      >
        ☁️ Google Drive
        {status.isAuthenticated && (
          <span className="badge-connected">✓</span>
        )}
      </button>

      {showModal && (
        <div className="google-drive-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="google-drive-modal" onClick={(e) => e.stopPropagation()}>
            <div className="google-drive-modal__header">
              <h3>Google Drive Backup</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="google-drive-modal__body">
              {!status.isAuthenticated ? (
                <div className="google-drive-login">
                  <p className="google-drive-info">
                    บันทึกข้อมูลลง Google Drive เพื่อการป้องกันสูญหาย
                  </p>
                  <button
                    type="button"
                    className="btn-google-login"
                    onClick={handleAuthenticate}
                    disabled={loading}
                  >
                    {loading ? '⏳ เชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google'}
                  </button>
                  {error && (
                    <p className="google-drive-error">❌ {error}</p>
                  )}
                </div>
              ) : (
                <div className="google-drive-connected">
                  <p className="google-drive-success">✓ เชื่อมต่อสำเร็จ</p>
                  {status.userEmail && (
                    <p className="google-drive-email">{status.userEmail}</p>
                  )}
                  {status.lastSync && (
                    <p className="google-drive-sync">
                      Sync ล่าสุด: {new Date(status.lastSync).toLocaleString('th-TH')}
                    </p>
                  )}
                  <p className="google-drive-info">
                    ข้อมูล {cases.length} เคส พร้อม sync
                  </p>

                  <div className="google-drive-actions">
                    <button
                      type="button"
                      className="btn-backup-now"
                      onClick={handleUpload}
                      disabled={loading}
                    >
                      {loading ? '⏳ กำลัง...' : '☁️ บันทึกเดี๋ยว'}
                    </button>
                    <button
                      type="button"
                      className="btn-disconnect"
                      onClick={logout}
                    >
                      ตัดการเชื่อมต่อ
                    </button>
                  </div>

                  {uploadSuccess && (
                    <p className="google-drive-uploaded">✓ บันทึกไป Google Drive สำเร็จ</p>
                  )}
                  {error && (
                    <p className="google-drive-error">❌ {error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
