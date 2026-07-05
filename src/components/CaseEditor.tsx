import { useState } from 'react'
import { AnatomyImageUpload } from './AnatomyImageUpload'
import { RichTextEditor } from './RichTextEditor'
import type { AnatomyImage, Category, SectionKey, SurgicalCase } from '../types/case'
import { UNCATEGORIZED_ID } from '../types/case'

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
  steps: '',
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

export function CaseEditor({ initial, categories, defaultCategoryId, onSave, onCancel }: CaseEditorProps) {
  const [form, setForm] = useState<SurgicalCase>(initial ?? emptyCase(defaultCategoryId ?? UNCATEGORIZED_ID))
  const [storeText, setStoreText] = useState(arrayToLines(initial?.equipment.store ?? []))
  const [roomText, setRoomText] = useState(arrayToLines(initial?.equipment.room ?? []))
  const [basketText, setBasketText] = useState(arrayToLines(initial?.equipment.basket ?? []))

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
    })
  }

  const imgUpload = (key: SectionKey) => (
    <AnatomyImageUpload
      images={sectionImages(key)}
      label={`📷 เพิ่มรูป (${sectionImages(key).length} รูป)`}
      onChange={(next) => updateImages(key, next)}
    />
  )

  return (
    <div className="editor-overlay" role="dialog" aria-modal="true" aria-labelledby="editor-title">
      <form className="editor-form" onSubmit={handleSubmit}>
        <header className="editor-form__header">
          <h2 id="editor-title">{initial ? 'แก้ไขเคส' : 'เพิ่มเคสใหม่'}</h2>
          <button type="button" className="btn-close" onClick={onCancel} aria-label="ปิด">
            ✕
          </button>
        </header>

        {/* Meta */}
        <div className="editor-form__grid">
          <label>
            ชื่อเคส (Operation)
            <input required maxLength={MAX_SHORT_TEXT} value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="เช่น Laparoscopic Cholecystectomy" />
          </label>
          <label>
            คำอธิบาย (ภาษาไทย)
            <input maxLength={MAX_SHORT_TEXT} value={form.subtitle}
              onChange={(e) => update('subtitle', e.target.value)}
              placeholder="เช่น ตัดถุงน้ำดีแบบส่องกล้อง" />
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

        {/* Rich-text sections */}
        <fieldset>
          <legend>1. Dx — การวินิจฉัย</legend>
          <RichTextEditor value={form.dx} onChange={(v) => update('dx', v)}
            placeholder="การวินิจฉัย อาการ และผลตรวจ" rows={4} />
          {imgUpload('dx')}
        </fieldset>

        <fieldset>
          <legend>2. Operation — หัตถการ</legend>
          <RichTextEditor value={form.operation} onChange={(v) => update('operation', v)}
            placeholder="รายละเอียดหัตถการ approach ports เวลา" rows={4} />
          {imgUpload('operation')}
        </fieldset>

        <fieldset>
          <legend>3. Anatomy — กายวิภาค</legend>
          <RichTextEditor value={form.anatomy} onChange={(v) => update('anatomy', v)}
            placeholder="โครงสร้างที่เกี่ยวข้อง จุดที่ต้องระวัง" rows={4} />
          {imgUpload('anatomy')}
        </fieldset>

        <fieldset>
          <legend>4. การจัดห้อง</legend>
          <RichTextEditor value={form.roomSetup} onChange={(v) => update('roomSetup', v)}
            placeholder="ขั้นตอนเตรียมห้องผ่าตัด" rows={4} />
          {imgUpload('roomSetup')}
        </fieldset>

        {/* Equipment stays as plain textarea (line-based lists) */}
        <fieldset className="equipment-fieldset">
          <legend>5. อุปกรณ์</legend>
          <label>
            ของใน Store (หนึ่งรายการต่อบรรทัด)
            <textarea rows={4} maxLength={MAX_LONG_TEXT} value={storeText}
              onChange={(e) => setStoreText(e.target.value)} />
          </label>
          <label>
            ของในห้องเวช
            <textarea rows={4} maxLength={MAX_LONG_TEXT} value={roomText}
              onChange={(e) => setRoomText(e.target.value)} />
          </label>
          <label>
            ของในตะกร้า
            <textarea rows={4} maxLength={MAX_LONG_TEXT} value={basketText}
              onChange={(e) => setBasketText(e.target.value)} />
          </label>
          {imgUpload('equipment')}
        </fieldset>

        <fieldset>
          <legend>6. การจัดท่า</legend>
          <RichTextEditor value={form.positioning} onChange={(v) => update('positioning', v)}
            placeholder="Position ที่ใช้" rows={3} />
          {imgUpload('positioning')}
        </fieldset>

        <fieldset>
          <legend>7. การปูผ้า</legend>
          <RichTextEditor value={form.draping} onChange={(v) => update('draping', v)}
            placeholder="ขั้นตอนการปูผ้า" rows={3} />
          {imgUpload('draping')}
        </fieldset>

        {/* Steps — rich text, user types numbers themselves */}
        <fieldset>
          <legend>8. Step — ขั้นตอน</legend>
          <RichTextEditor value={form.steps} onChange={(v) => update('steps', v)}
            placeholder="พิมพ์ขั้นตอน เช่น&#10;1. รับ patient + Time Out&#10;2. Position + Drape" rows={6} />
          {imgUpload('steps')}
        </fieldset>

        <footer className="editor-form__footer">
          <button type="button" className="btn-secondary" onClick={onCancel}>ยกเลิก</button>
          <button type="submit" className="btn-primary">บันทึก</button>
        </footer>
      </form>
    </div>
  )
}
