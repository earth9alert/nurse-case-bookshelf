import { useCallback, useEffect, useState } from 'react'
import { AnatomyGallery } from './AnatomyGallery'
import { SECTIONS, type SectionKey, type SurgicalCase } from '../types/case'

interface CaseReaderProps {
  surgicalCase: SurgicalCase
  onClose: () => void
}

function SectionContent({
  sectionKey,
  surgicalCase,
}: {
  sectionKey: SectionKey
  surgicalCase: SurgicalCase
}) {
  switch (sectionKey) {
    case 'dx':
      return <TextBlock content={surgicalCase.dx} />
    case 'operation':
      return <TextBlock content={surgicalCase.operation} />
    case 'anatomy':
      return (
        <>
          <TextBlock content={surgicalCase.anatomy} />
          <AnatomyGallery images={surgicalCase.anatomyImages ?? []} />
        </>
      )
    case 'roomSetup':
      return (
        <>
          <TextBlock content={surgicalCase.roomSetup} />
          <AnatomyGallery images={surgicalCase.roomSetupImages ?? []} />
        </>
      )
    case 'equipment':
      return (
        <div className="equipment-grid">
          <EquipmentList title="ของใน Store" items={surgicalCase.equipment.store} icon="📦" />
          <EquipmentList title="ของในห้องเวช" items={surgicalCase.equipment.room} icon="🏥" />
          <EquipmentList title="ของในตะกร้า" items={surgicalCase.equipment.basket} icon="🧺" />
        </div>
      )
    case 'positioning':
      return <TextBlock content={surgicalCase.positioning} />
    case 'draping':
      return (
        <>
          <TextBlock content={surgicalCase.draping} />
          <AnatomyGallery images={surgicalCase.drapingImages ?? []} />
        </>
      )
    case 'steps':
      return (
        <ol className="steps-list">
          {surgicalCase.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )
  }
}

function TextBlock({ content }: { content: string }) {
  return (
    <div className="text-block">
      {content.split('\n').map((line, i) => (
        <p key={i}>{line || '\u00A0'}</p>
      ))}
    </div>
  )
}

function EquipmentList({
  title,
  items,
  icon,
}: {
  title: string
  items: string[]
  icon: string
}) {
  return (
    <div className="equipment-list">
      <h3>
        <span aria-hidden="true">{icon}</span> {title}
      </h3>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export function CaseReader({ surgicalCase, onClose }: CaseReaderProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('dx')
  const [readSections, setReadSections] = useState<Set<SectionKey>>(new Set())

  const markRead = useCallback((key: SectionKey) => {
    setReadSections((prev) => new Set(prev).add(key))
  }, [])

  const goToSection = useCallback(
    (key: SectionKey) => {
      markRead(activeSection)
      setActiveSection(key)
    },
    [activeSection, markRead],
  )

  const handleClose = useCallback(() => {
    markRead(activeSection)
    onClose()
  }, [activeSection, markRead, onClose])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  const readCount = readSections.size
  const totalSections = SECTIONS.length
  const allRead = readCount >= totalSections

  return (
    <div
      className="case-reader-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-title"
    >
      <div className="case-reader">
        <header className="case-reader__header">
          <button type="button" className="btn-back" onClick={handleClose}>
            ← กลับชั้นวาง
          </button>
          <div className="case-reader__title-block">
            <h1 id="reader-title">{surgicalCase.title}</h1>
            <p>{surgicalCase.subtitle}</p>
          </div>
          <div
            className="read-progress"
            role="progressbar"
            aria-valuenow={readCount}
            aria-valuemin={0}
            aria-valuemax={totalSections}
            aria-label={`อ่านแล้ว ${readCount} จาก ${totalSections} หัวข้อ`}
          >
            <div className="read-progress__bar">
              <div
                className="read-progress__fill"
                style={{ width: `${(readCount / totalSections) * 100}%` }}
              />
            </div>
            <span className="read-progress__label">
              {allRead ? '✓ อ่านครบแล้ว — พร้อมเข้าเคส' : `${readCount}/${totalSections} หัวข้อ`}
            </span>
          </div>
        </header>

        <nav className="section-nav" aria-label="หัวข้อในเคส">
          {SECTIONS.map((section, idx) => (
            <button
              key={section.key}
              type="button"
              className={`section-nav__btn ${activeSection === section.key ? 'active' : ''} ${readSections.has(section.key) ? 'read' : ''}`}
              onClick={() => goToSection(section.key)}
            >
              <span className="section-nav__num">
                {readSections.has(section.key) ? '✓' : idx + 1}
              </span>
              <span className="section-nav__label">{section.shortLabel}</span>
            </button>
          ))}
        </nav>

        <main className="case-reader__content">
          <h2>{SECTIONS.find((s) => s.key === activeSection)?.label}</h2>
          <SectionContent sectionKey={activeSection} surgicalCase={surgicalCase} />
        </main>

        <footer className="case-reader__footer">
          <button
            type="button"
            className="btn-mark-read"
            onClick={() => markRead(activeSection)}
            disabled={readSections.has(activeSection)}
          >
            {readSections.has(activeSection) ? 'อ่านแล้ว ✓' : 'ทำเครื่องหมายว่าอ่านแล้ว'}
          </button>
          {(() => {
            const idx = SECTIONS.findIndex((s) => s.key === activeSection)
            const next = SECTIONS[idx + 1]
            if (!next) return null
            return (
              <button type="button" className="btn-next" onClick={() => goToSection(next.key)}>
                ถัดไป: {next.label} →
              </button>
            )
          })()}
        </footer>
      </div>
    </div>
  )
}
