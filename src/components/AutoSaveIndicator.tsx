import type { SaveStatus } from '../hooks/useAutoSave'

interface AutoSaveIndicatorProps {
  status: SaveStatus
}

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null

  return (
    <div className={`auto-save-indicator auto-save-indicator--${status}`}>
      {status === 'saving' && (
        <>
          <span className="auto-save-spinner">⟳</span>
          <span>กำลังบันทึก...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <span>✓</span>
          <span>บันทึกแล้ว</span>
        </>
      )}
      {status === 'error' && (
        <>
          <span>✕</span>
          <span>บันทึกไม่สำเร็จ</span>
        </>
      )}
    </div>
  )
}
