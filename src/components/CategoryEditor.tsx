import { useState } from 'react'
import { type Category } from '../types/case'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

const ICON_GROUPS: { label: string; icons: string[] }[] = [
  {
    label: '🏥 ทางการแพทย์',
    icons: ['🏥', '🩺', '💊', '💉', '🩹', '🩻', '🧬', '🔬', '🩸', '🧪', '🧫', '⚕️'],
  },
  {
    label: '🔪 ศัลยกรรม',
    icons: ['🔪', '✂️', '🩹', '🫀', '🫁', '🧠', '🦴', '🦷', '👁️', '👂', '🦵', '🦾'],
  },
  {
    label: '👶 สูติ-กุมาร',
    icons: ['👶', '🍼', '🤰', '👼', '🧒', '🐣', '🌱', '💝', '🎀', '🧸', '🌸', '🌷'],
  },
  {
    label: '❤️ หัวใจ & ทรวงอก',
    icons: ['❤️', '🫀', '💓', '💗', '🫁', '🩺', '💨', '🌬️', '💙', '🩵', '🔵', '⚡'],
  },
  {
    label: '🧠 สมอง & ประสาท',
    icons: ['🧠', '💭', '⚡', '🔭', '🎯', '🌀', '🧩', '🔮', '💡', '🌐', '🫧', '✨'],
  },
  {
    label: '🦴 กระดูก & ข้อ',
    icons: ['🦴', '🦵', '🦿', '🦾', '💪', '🏋️', '⚙️', '🔩', '🪛', '🔧', '🛠️', '🪝'],
  },
  {
    label: '🫘 ระบบทางเดิน',
    icons: ['🫘', '🫃', '🫄', '🥩', '🍖', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫'],
  },
  {
    label: '👁️ ตา-หู-จมูก',
    icons: ['👁️', '👀', '👂', '👃', '🦻', '🫦', '🦷', '👅', '🌟', '💫', '✨', '🌙'],
  },
  {
    label: '🌿 ทั่วไป & อื่นๆ',
    icons: ['📚', '📖', '📋', '📌', '🗂️', '🗃️', '📁', '🏷️', '🔖', '📝', '✏️', '🖊️'],
  },
  {
    label: '🌸 สัญลักษณ์',
    icons: ['🌸', '🌺', '🌻', '🌹', '💐', '🌷', '🍀', '🌿', '⭐', '🌟', '💎', '🏆'],
  },
]

interface CategoryEditorProps {
  initial?: Category
  onSave: (cat: Category) => void
  onCancel: () => void
}

export function CategoryEditor({ initial, onSave, onCancel }: CategoryEditorProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? '#c2607a')
  const [icon, setIcon] = useState(initial?.icon ?? '🏥')
  const [customIcon, setCustomIcon] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const finalIcon = customIcon.trim() || icon
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      color: HEX_COLOR_RE.test(color) ? color : '#c2607a',
      icon: finalIcon,
    })
  }

  const handleCustomIconChange = (val: string) => {
    // Keep only the first grapheme cluster (one emoji or character)
    const segments = [...new Intl.Segmenter().segment(val)]
    const first = segments[0]?.segment ?? ''
    setCustomIcon(first)
    if (first) setIcon(first)
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

        {/* Preview */}
        <div className="cat-preview">
          <span
            className="cat-preview__door"
            style={{ background: color }}
            aria-hidden="true"
          >
            {icon}
          </span>
          <span className="cat-preview__name">{name || 'ชื่อห้อง'}</span>
        </div>

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

          {/* Custom emoji input */}
          <div className="cat-custom-icon">
            <label htmlFor="custom-icon-input" className="cat-custom-icon__label">
              พิมพ์ emoji เอง:
            </label>
            <input
              id="custom-icon-input"
              type="text"
              className="cat-custom-icon__input"
              value={customIcon}
              onChange={(e) => handleCustomIconChange(e.target.value)}
              placeholder="🎯"
              maxLength={4}
            />
            <span className="cat-custom-icon__hint">หรือเลือกจากด้านล่าง</span>
          </div>

          {/* Grouped grid */}
          <div className="cat-icon-groups">
            {ICON_GROUPS.map((group) => (
              <div key={group.label} className="cat-icon-group">
                <p className="cat-icon-group__label">{group.label}</p>
                <div className="cat-icon-grid">
                  {group.icons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      className={`cat-icon-btn ${icon === ic ? 'selected' : ''}`}
                      onClick={() => { setIcon(ic); setCustomIcon('') }}
                      aria-label={ic}
                      aria-pressed={icon === ic}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
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
