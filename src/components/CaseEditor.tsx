import { useState } from 'react'
import { AnatomyImageUpload } from './AnatomyImageUpload'
import type { Category, SurgicalCase } from '../types/case'
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
  color: '#457b9d',
  dx: '',
  operation: '',
  anatomy: '',
  anatomyImages: [],
  roomSetup: '',
  roomSetupImages: [],
  equipment: { store: [], room: [], basket: [] },
  positioning: '',
  draping: '',
  drapingImages: [],
  steps: [],
})

const MAX_SHORT_TEXT = 200
const MAX_LONG_TEXT = 5000
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

function linesToArray(text: string) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

function arrayToLines(arr: string[]) {
  return arr.join('\n')
}

export function CaseEditor({ initial, categories, defaultCategoryId, onSave, onCancel }: CaseEditorProps) {
  const [form, setForm] = useState<SurgicalCase>(initial ?? emptyCase(defaultCategoryId ?? UNCATEGORIZED_ID))
  const [storeText, setStoreText] = useState(arrayToLines(initial?.equipment.store ?? []))
  const [roomText, setRoomText] = useState(arrayToLines(initial?.equipment.room ?? []))
  const [basketText, setBasketText] = useState(arrayToLines(initial?.equipment.basket ?? []))
  const [stepsText, setStepsText] = useState(arrayToLines(initial?.steps ?? []))

  const update = <K extends keyof SurgicalCase>(key: K, value: SurgicalCase[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const color = HEX_COLOR_RE.test(form.color) ? form.color : '#457b9d'
    onSave({
      ...form,
      color,
      equipment: {
        store: linesToArray(storeText),
        room: linesToArray(roomText),
        basket: linesToArray(basketText),
      },
      steps: linesToArray(stepsText),
    })
  }

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
            <select
              value={form.categoryId}
              onChange={(e) => update('categoryId', e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            สีปกหนังสือ
            <input
              type="color"
              value={form.color}
              onChange={(e) => update('color', e.target.value)}
            />
          </label>
        </div>

        <fieldset>
          <legend>1. Dx — การวินิจฉัย</legend>
          <textarea
            rows={4}
            maxLength={MAX_LONG_TEXT}
            value={form.dx}
            onChange={(e) => update('dx', e.target.value)}
            placeholder="การวินิจฉัย อาการ และผลตรวจ"
          />
        </fieldset>

        <fieldset>
          <legend>2. Operation — หัตถการ</legend>
          <textarea
            rows={4}
            maxLength={MAX_LONG_TEXT}
            value={form.operation}
            onChange={(e) => update('operation', e.target.value)}
            placeholder="รายละเอียดหัตถการ approach ports เวลา"
          />
        </fieldset>

        <fieldset>
          <legend>3. Anatomy — กายวิภาค</legend>
          <textarea
            rows={4}
            maxLength={MAX_LONG_TEXT}
            value={form.anatomy}
            onChange={(e) => update('anatomy', e.target.value)}
            placeholder="โครงสร้างที่เกี่ยวข้อง จุดที่ต้องระวัง"
          />
          <AnatomyImageUpload
            images={form.anatomyImages}
            onChange={(anatomyImages) => update('anatomyImages', anatomyImages)}
          />
        </fieldset>

        <fieldset>
          <legend>4. การจัดห้อง</legend>
          <textarea
            rows={4}
            maxLength={MAX_LONG_TEXT}
            value={form.roomSetup}
            onChange={(e) => update('roomSetup', e.target.value)}
            placeholder="ขั้นตอนเตรียมห้องผ่าตัด"
          />
          <AnatomyImageUpload
            images={form.roomSetupImages}
            onChange={(roomSetupImages) => update('roomSetupImages', roomSetupImages)}
          />
        </fieldset>

        <fieldset className="equipment-fieldset">
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
        </fieldset>

        <fieldset>
          <legend>6. การจัดท่า</legend>
          <textarea
            rows={3}
            maxLength={MAX_LONG_TEXT}
            value={form.positioning}
            onChange={(e) => update('positioning', e.target.value)}
          />
        </fieldset>

        <fieldset>
          <legend>7. การปูผ้า</legend>
          <textarea rows={3} maxLength={MAX_LONG_TEXT} value={form.draping} onChange={(e) => update('draping', e.target.value)} />
          <AnatomyImageUpload
            images={form.drapingImages}
            onChange={(drapingImages) => update('drapingImages', drapingImages)}
          />
        </fieldset>

        <fieldset>
          <legend>8. Step — ขั้นตอน (หนึ่ง step ต่อบรรทัด)</legend>
          <textarea rows={6} maxLength={MAX_LONG_TEXT} value={stepsText} onChange={(e) => setStepsText(e.target.value)} />
        </fieldset>

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
