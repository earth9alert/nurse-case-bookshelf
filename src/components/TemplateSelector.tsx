import type { SurgicalCase } from '../types/case'
import { UNCATEGORIZED_ID } from '../types/case'

interface TemplateSelectorProps {
  onSelectTemplate: (template: Partial<SurgicalCase>) => void
}

const TEMPLATES: Array<{ name: string; desc: string; data: Partial<SurgicalCase> }> = [
  {
    name: 'เคสว่าง',
    desc: 'เริ่มต้นจากศูนย์',
    data: {
      title: '',
      subtitle: '',
      color: '#457b9d',
      categoryId: UNCATEGORIZED_ID,
      dx: '',
      operation: '',
      anatomy: '',
      roomSetup: '',
      equipment: { store: [], room: [], basket: [] },
      positioning: '',
      draping: '',
      steps: '',
      images: {},
    },
  },
  {
    name: 'ศัลยกรรมทั่วไป',
    desc: 'Template สำหรับศัลยกรรม General',
    data: {
      title: 'General Surgery - ',
      subtitle: 'General Surgery',
      color: '#2d6a4f',
      categoryId: 'general',
      dx: '<p><strong>การวินิจฉัย:</strong></p>',
      operation: '<p><strong>หัตถการ:</strong></p>',
      anatomy: '<p><strong>กายวิภาค:</strong></p>',
      roomSetup: '<p><strong>การจัดห้อง:</strong></p>',
      equipment: { store: [], room: [], basket: [] },
      positioning: '<p><strong>การจัดท่า:</strong></p>',
      draping: '<p><strong>การปูผ้า:</strong></p>',
      steps: '<ol><li>ขั้นตอนที่ 1</li><li>ขั้นตอนที่ 2</li></ol>',
      images: {},
    },
  },
  {
    name: 'ศัลยกรรมกระดูก',
    desc: 'Template สำหรับ Orthopedics',
    data: {
      title: 'Orthopedic Surgery - ',
      subtitle: 'Orthopedic Surgery',
      color: '#1d3557',
      categoryId: 'ortho',
      dx: '<p><strong>การวินิจฉัย:</strong></p><p>บาดเจอ / โรค ...</p>',
      operation: '<p><strong>หัตถการ:</strong></p>',
      anatomy: '<p><strong>กายวิภาค:</strong></p><p>กระดูก ข้อต่อ เอ็นกล้ามเนื้อ</p>',
      roomSetup: '<p><strong>การจัดห้อง:</strong></p>',
      equipment: { store: [], room: [], basket: [] },
      positioning: '<p><strong>การจัดท่า:</strong></p>',
      draping: '<p><strong>การปูผ้า:</strong></p>',
      steps: '<ol><li>ขั้นตอนที่ 1</li><li>ขั้นตอนที่ 2</li></ol>',
      images: {},
    },
  },
]

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  return (
    <div className="template-selector">
      <h3>เลือก Template</h3>
      <div className="template-selector__grid">
        {TEMPLATES.map((t) => (
          <button
            key={t.name}
            type="button"
            className="template-selector__card"
            onClick={() => onSelectTemplate(t.data)}
          >
            <strong>{t.name}</strong>
            <small>{t.desc}</small>
          </button>
        ))}
      </div>
    </div>
  )
}
