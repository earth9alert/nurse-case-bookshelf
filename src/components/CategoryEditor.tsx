import { useState } from 'react'
import { type Category } from '../types/case'

const PRESET_ICONS = ['🔪', '🦴', '👶', '🧠', '❤️', '🫘', '👁️', '🦷', '🫁', '🩺', '💊', '🏥']
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

interface CategoryEditorProps {
  initial?: Category
  onSave: (cat: Category) => void
  onCancel: () => void
}

export function CategoryEditor({ initial, onSave, onCancel }: CategoryEditorProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? '#457b9d')
  const [icon, setIcon] = useState(initial?.icon ?? '🏥')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      color: HEX_COLOR_RE.test(color) ? color : '#457b9d',
      icon,
    })
  }

  return (
    <div className="editor-overlay" role="dialog" aria-modal="true" aria-labelledby="cat-editor-title">
      <form className="editor-form category-editor-form" onSubmit={handleSubmit}>
        <header className="editor-form__header">
          <h2 id="cat-editor-title">{initial ? 'แก้ไขหมวดหมู่' : 'เพิ่มห้องใหม่'}</h2>
          <button type="button" className="btn-close" onClick={onCancel} aria-label="ปิด">
            ✕
          </button>
        </header>

        <label>
          ชื่อห้อง / หมวดหมู่
          <input
            required
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น Laparoscopic, Orthopedics"
            autoFocus
          />
        </label>

        <fieldset>
          <legend>เลือก Emoji ประจำห้อง</legend>
          <div className="cat-icon-grid">
            {PRESET_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={`cat-icon-btn ${icon === ic ? 'selected' : ''}`}
                onClick={() => setIcon(ic)}
                aria-label={ic}
                aria-pressed={icon === ic}
              >
                {ic}
              </button>
            ))}
          </div>
        </fieldset>

        <label>
          สีประตู
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: color,
                border: '1px solid rgba(0,0,0,0.15)',
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
          </div>
        </label>

        <footer className="editor-form__footer">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="submit" className="btn-primary">
            บันทึก
          </button>
        </footer>
      </form>
    </div>
  )
}
