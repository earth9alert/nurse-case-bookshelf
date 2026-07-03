import { useState } from 'react'
import { AnatomyImageUpload } from './AnatomyImageUpload'
import type { AnatomyImage, Category, SectionKey, SurgicalCase } from '../types/case'
import { SECTIONS, UNCATEGORIZED_ID } from '../types/case'

interface CaseEditorProps {
  initial?: SurgicalCase
  categories: Category[]
  defaultCategoryId?: string
  onSave: (surgicalCase: SurgicalCase) => void
  onCancel: () => void
}

const emptyCase = (categoryId: string): SurgicalCase => ({
  id: crypto.randomUUID(),
  categoryId,
  title: '',
  subtitle: '',
  color: '#c2607a',
  updatedAt: new Date().toISOString(),
  dx: '',
  operation: '',
  anatomy: '',
  roomSetup: '',
  equipment: { store: [], room: [], basket: [] },
  positioning: '',
  draping: '',
  steps: [],
  images: {},
})

const MAX_SHORT_TEXT = 200
const MAX_LONG_TEXT = 5000
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

function linesToArray(text: string) {
  return text.split('\n').map((l) => l.trim()).filter(Boolean)
}

function arrayToLines(arr: string[]) {
  return arr.join('\n')
}

// Sections that support image upload (all except equipment which has its own UI)
const IMAGE_SECTIONS: SectionKey[] = ['dx', 'operation', 'anatomy', 'roomSetup', 'equipment', 'positioning', 'draping', 'steps']

export function CaseEditor({ initial, categories, defaultCategoryId, onSave, onCancel }: CaseEditorProps) {
  const [form, setForm] = useState<SurgicalCase>(initial ?? emptyCase(defaultCategoryId ?? UNCATEGORIZED_ID))
  const [storeText, setStoreText] = useState(arrayToLines(initial?.equipment.store ?? []))
  const [roomText, setRoomText] = useState(arrayToLines(initial?.equipment.room ?? []))
  const [basketText, setBasketText] = useState(arrayToLines(initial?.equipment.basket ?? []))
  const [stepsText, setStepsText] = useState(arrayToLines(initial?.steps ?? []))

  const update = <K extends keyof SurgicalCase>(key: K, value: SurgicalCase[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const updateImages = (sectionKey: SectionKey, imgs: AnatomyImage[]) => {
    setForm((prev) => ({
      ...prev,
      images: { ...prev.images, [sectionKey]: imgs },
    }))
  }

  const sectionImages = (key: SectionKey): AnatomyImage[] => form.images[key] ?? []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const color = HEX_COLOR_RE.test(form.color) ? form.color : '#c2607a'
    onSave({
      ...form,
      color,
      updatedAt: new Date().toISOString(),
      equipment: {
        store: linesToArray(storeText),
        room: linesToArray(roomText),
        basket: linesToArray(basketText),
      },
      steps: linesToArray(stepsText),
    })
  }

  // Suppress unused warning — IMAGE_SECTIONS used below
  void IMAGE_SECTIONS

  return (
    <div className="editor-overlay" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <form className="editor-form" onSubmit={handleSubmit}>
        <header className="editor-form__header">
          <h2 id="editor-title">{initial ? 'แก้ไขเคส' : 'เพิ่มเคสใหม่'}</h2>
          <button type="button" className="btn-close" onClick={onCancel} aria-label="ปิด">
            ✕
          </button>
        </header>

        <div className="editor-form__grid">
          <label>
            ชื่อเคส (Operation)
            <input
              required
              maxLength={MAX_SHORT_TEXT}
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="เช่น Laparoscopic Cholecystectomy"
            />
          </label>
          <label>
            คำอธิบาย (ภาษาไทย)
            <input
              maxLength={MAX_SHORT_TEXT}
              value={form.subtitle}
              onChange={(e) => update('subtitle', e.target.value)}
              placeholder="เช่น ตัดถุงน้ำดีแบบส่องกล้อง"
            />
          </label>
          <label>
            หมวดหมู่
            <select value={form.categoryId} onChange={(e) => update('categoryId', e.target.value)}>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </label>
          <label>
            สีปกหนังสือ
            <input type="color" value={form.color} onChange={(e) => update('color', e.target.value)} />
          </label>
        </div>

        {/* Section labels from SECTIONS for consistency */}
        {SECTIONS.map((section) => {
          const key = section.key
          const imgs = sectionImages(key)
          const uploadBlock = (
            <AnatomyImageUpload
              images={imgs}
              label={`📷 เพิ่มรูป (${imgs.length} รูป)`}
              onChange={(next) => updateImages(key, next)}
            />
          )

          if (key === 'dx') return (
            <fieldset key={key}>
              <legend>1. Dx — การวินิจฉัย</legend>
              <textarea rows={4} maxLength={MAX_LONG_TEXT} value={form.dx}
                onChange={(e) => update('dx', e.target.value)} placeholder="การวินิจฉัย อาการ และผลตรวจ" />
              {uploadBlock}
            </fieldset>
          )

          if (key === 'operation') return (
            <fieldset key={key}>
              <legend>2. Operation — หัตถการ</legend>
              <textarea rows={4} maxLength={MAX_LONG_TEXT} value={form.operation}
                onChange={(e) => update('operation', e.target.value)} placeholder="รายละเอียดหัตถการ approach ports เวลา" />
              {uploadBlock}
            </fieldset>
          )

          if (key === 'anatomy') return (
            <fieldset key={key}>
              <legend>3. Anatomy — กายวิภาค</legend>
              <textarea rows={4} maxLength={MAX_LONG_TEXT} value={form.anatomy}
                onChange={(e) => update('anatomy', e.target.value)} placeholder="โครงสร้างที่เกี่ยวข้อง จุดที่ต้องระวัง" />
              {uploadBlock}
            </fieldset>
          )

          if (key === 'roomSetup') return (
            <fieldset key={key}>
              <legend>4. การจัดห้อง</legend>
              <textarea rows={4} maxLength={MAX_LONG_TEXT} value={form.roomSetup}
                onChange={(e) => update('roomSetup', e.target.value)} placeholder="ขั้นตอนเตรียมห้องผ่าตัด" />
              {uploadBlock}
            </fieldset>
          )

          if (key === 'equipment') return (
            <fieldset key={key} className="equipment-fieldset">
              <legend>5. อุปกรณ์</legend>
              <label>
                ของใน Store (หนึ่งรายการต่อบรรทัด)
                <textarea rows={4} maxLength={MAX_LONG_TEXT} value={storeText} onChange={(e) => setStoreText(e.target.value)} />
              </label>
              <label>
                ของในห้องเวช
                <textarea rows={4} maxLength={MAX_LONG_TEXT} value={roomText} onChange={(e) => setRoomText(e.target.value)} />
              </label>
              <label>
                ของในตะกร้า
                <textarea rows={4} maxLength={MAX_LONG_TEXT} value={basketText} onChange={(e) => setBasketText(e.target.value)} />
              </label>
              {uploadBlock}
            </fieldset>
          )

          if (key === 'positioning') return (
            <fieldset key={key}>
              <legend>6. การจัดท่า</legend>
              <textarea rows={3} maxLength={MAX_LONG_TEXT} value={form.positioning}
                onChange={(e) => update('positioning', e.target.value)} />
              {uploadBlock}
            </fieldset>
          )

          if (key === 'draping') return (
            <fieldset key={key}>
              <legend>7. การปูผ้า</legend>
              <textarea rows={3} maxLength={MAX_LONG_TEXT} value={form.draping}
                onChange={(e) => update('draping', e.target.value)} />
              {uploadBlock}
            </fieldset>
          )

          if (key === 'steps') return (
            <fieldset key={key}>
              <legend>8. Step — ขั้นตอน (หนึ่ง step ต่อบรรทัด)</legend>
              <textarea rows={6} maxLength={MAX_LONG_TEXT} value={stepsText}
                onChange={(e) => setStepsText(e.target.value)} />
              {uploadBlock}
            </fieldset>
          )

          return null
        })}

        <footer className="editor-form__footer">
          <button type="button" className="btn-secondary" onClick={onCancel}>ยกเลิก</button>
          <button type="submit" className="btn-primary">บันทึก</button>
        </footer>
      </form>
    </div>
  )
}
