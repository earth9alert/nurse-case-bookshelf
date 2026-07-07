import { useState, useEffect } from 'react'
import type { SurgicalCase } from '../types/case'

interface CaseNotesProps {
  surgicalCase: SurgicalCase
  onUpdate: (surgicalCase: SurgicalCase) => void
  isOpen: boolean
  onClose: () => void
}

export function CaseNotes({ surgicalCase, onUpdate, isOpen, onClose }: CaseNotesProps) {
  const [notes, setNotes] = useState(surgicalCase.personaNotes ?? '')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    setNotes(surgicalCase.personaNotes ?? '')
  }, [surgicalCase.id])

  const handleSave = () => {
    onUpdate({ ...surgicalCase, personaNotes: notes })
    setIsEditing(false)
  }

  if (!isOpen) return null

  return (
    <aside className="case-notes-panel">
      <header className="case-notes__header">
        <h3>📝 บันทึกส่วนตัว</h3>
        <button
          type="button"
          className="btn-close-notes"
          onClick={onClose}
          aria-label="ปิดบันทึก"
        >
          ✕
        </button>
      </header>

      <div className="case-notes__content">
        {isEditing ? (
          <>
            <textarea
              className="case-notes__textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เขียนบันทึกส่วนตัวของคุณที่นี่..."
              maxLength={5000}
            />
            <div className="case-notes__footer">
              <span className="case-notes__char-count">
                {notes.length}/5000
              </span>
              <div className="case-notes__actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setNotes(surgicalCase.personaNotes ?? '')
                    setIsEditing(false)
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSave}
                >
                  บันทึก
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {notes ? (
              <div className="case-notes__display">
                {notes.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))}
              </div>
            ) : (
              <p className="case-notes__empty">ยังไม่มีบันทึก</p>
            )}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsEditing(true)}
              style={{ width: '100%' }}
            >
              {notes ? '✏️ แก้ไข' : '✏️ เพิ่มบันทึก'}
            </button>
          </>
        )}
      </div>
    </aside>
  )
}
