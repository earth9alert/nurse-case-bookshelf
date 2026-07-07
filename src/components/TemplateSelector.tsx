import type { SurgicalCase } from '../types/case'

interface TemplateSelectorProps {
  isOpen: boolean
  onSelectTemplate: (template: Partial<SurgicalCase>) => void
  onClose: () => void
}

const CASE_TEMPLATES = [
  {
    id: 'general-surgery',
    name: 'General Surgery',
    icon: '🔪',
    template: {
      dx: '',
      operation: '',
      anatomy: '',
      roomSetup: '',
      positioning: '',
      draping: '',
      steps: '',
      equipment: { store: [], room: [], basket: [] },
    },
  },
  {
    id: 'orthopedic',
    name: 'Orthopedic Surgery',
    icon: '🦴',
    template: {
      dx: 'Diagnosis: ',
      operation: 'Procedure: ',
      anatomy: '',
      roomSetup: '',
      positioning: 'Patient position: ',
      draping: '',
      steps: '',
      equipment: { store: [], room: [], basket: [] },
    },
  },
  {
    id: 'minimal',
    name: 'Minimal Template',
    icon: '📄',
    template: {
      dx: '',
      operation: '',
      anatomy: '',
      roomSetup: '',
      positioning: '',
      draping: '',
      steps: '',
      equipment: { store: [], room: [], basket: [] },
    },
  },
]

export function TemplateSelector({ isOpen, onSelectTemplate, onClose }: TemplateSelectorProps) {
  if (!isOpen) return null

  return (
    <div className="template-selector-overlay" role="dialog" aria-modal="true">
      <div className="template-selector">
        <header className="template-selector__header">
          <h2>📋 เลือกแม่แบบเคส</h2>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="ปิด"
          >
            ✕
          </button>
        </header>

        <div className="template-selector__grid">
          {CASE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              className="template-selector__item"
              onClick={() => {
                onSelectTemplate(tmpl.template)
                onClose()
              }}
            >
              <span className="template-selector__icon">{tmpl.icon}</span>
              <span className="template-selector__name">{tmpl.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
