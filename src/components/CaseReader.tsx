import { useCallback, useEffect, useState } from 'react'
import { sanitizeForDisplay } from '../utils/sanitizer'
import { AnatomyGallery } from './AnatomyGallery'
import { HandwritingPad } from './HandwritingPad'
import { SECTIONS, type HandwritingStroke, type SectionKey, type SurgicalCase } from '../types/case'

const READING_SETTINGS_KEY = 'nurse-bookshelf-reading-settings'
const DEFAULT_READING_SETTINGS = { fontSize: 18, lineHeight: 1.8 }
const READING_FONT_SIZES = [16, 18, 20, 22, 24, 26, 28]

type ReadingSettings = typeof DEFAULT_READING_SETTINGS

interface CaseReaderProps {
  surgicalCase: SurgicalCase
  onUpdate: (surgicalCase: SurgicalCase) => void
  onClose: () => void
}

function getInitialReadingSettings(): ReadingSettings {
  try {
    const stored = localStorage.getItem(READING_SETTINGS_KEY)
    if (stored) {
      const parsed: unknown = JSON.parse(stored)
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'fontSize' in parsed &&
        typeof parsed.fontSize === 'number' &&
        READING_FONT_SIZES.includes(parsed.fontSize) &&
        'lineHeight' in parsed &&
        typeof parsed.lineHeight === 'number' &&
        [1.8, 2].includes(parsed.lineHeight)
      ) {
        return { fontSize: parsed.fontSize, lineHeight: parsed.lineHeight }
      }
    }
  } catch (error) {
    console.warn('[CaseReader] Could not load reading preferences:', error)
  }
  return DEFAULT_READING_SETTINGS
}

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function SectionContent({
  sectionKey,
  surgicalCase,
  onUpdateCase,
}: {
  sectionKey: SectionKey
  surgicalCase: SurgicalCase
  onUpdateCase: (surgicalCase: SurgicalCase) => void
}) {
  const imgs = surgicalCase.images[sectionKey] ?? []
  // Map section key → gallery title
  const galleryTitle: Record<SectionKey, string> = {
    dx:          'รูปประกอบ — Dx',
    operation:   'รูปประกอบ — Operation',
    anatomy:     'รูประบบ Anatomy',
    roomSetup:   'รูปประกอบ — การจัดห้อง',
    equipment:   'รูปประกอบ — อุปกรณ์',
    positioning: 'รูปประกอบ — การจัดท่า',
    draping:     'รูปประกอบ — การปูผ้า',
    steps:       'รูปประกอบ — Step',
  }
  const title = galleryTitle[sectionKey]
  const gallery = (
    <AnatomyGallery
      images={imgs}
      title={title}
      onUpdateImage={(image) => {
        const sectionImages = surgicalCase.images[sectionKey] ?? []
        onUpdateCase({
          ...surgicalCase,
          images: {
            ...surgicalCase.images,
            [sectionKey]: sectionImages.map((existing) => existing.id === image.id ? image : existing),
          },
        })
      }}
    />
  )

  switch (sectionKey) {
    case 'dx':
      return <><TextBlock content={surgicalCase.dx} />{gallery}</>
    case 'operation':
      return <><TextBlock content={surgicalCase.operation} />{gallery}</>
    case 'anatomy':
      return <><TextBlock content={surgicalCase.anatomy} />{gallery}</>
    case 'roomSetup':
      return <><TextBlock content={surgicalCase.roomSetup} />{gallery}</>
    case 'equipment':
      return (
        <>
          <div className="equipment-grid">
            <EquipmentList title="ของใน Store" items={surgicalCase.equipment.store} icon="📦" />
            <EquipmentList title="ของในห้องเวช" items={surgicalCase.equipment.room} icon="🏥" />
            <EquipmentList title="ของในตะกร้า" items={surgicalCase.equipment.basket} icon="🧺" />
          </div>
          {gallery}
        </>
      )
    case 'positioning':
      return <><TextBlock content={surgicalCase.positioning} />{gallery}</>
    case 'draping':
      return <><TextBlock content={surgicalCase.draping} />{gallery}</>
    case 'steps':
      return (
        <>
          <TextBlock content={surgicalCase.steps} />
          {gallery}
        </>
      )
  }
}

function TextBlock({ content }: { content: string }) {
  // Content may be plain text (legacy) or HTML (rich text)
  const isHtml = /<[a-z][\s\S]*>/i.test(content)
  if (isHtml) {
    // Sanitize HTML before rendering
    const sanitized = sanitizeForDisplay(content)
    return (
      <div
        className="text-block text-block--rich"
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    )
  }
  const bulletMarkers = content.match(/\*\s+/g)?.length ?? 0
  const bulletItems = content.split(/\*\s+/).map((item) => item.trim()).filter(Boolean)
  if (bulletMarkers >= 2 && bulletItems.length > 1) {
    return (
      <ul className="text-block__list">
        {bulletItems.map((item, i) => {
          const separatorIndex = item.indexOf('=')
          return (
            <li key={i}>
              {separatorIndex > 0 ? (
                <>
                  <strong>{item.slice(0, separatorIndex).trim()}</strong>
                  {' = '}
                  {item.slice(separatorIndex + 1).trim()}
                </>
              ) : item}
            </li>
          )
        })}
      </ul>
    )
  }
  return (
    <div className="text-block">
      {content.split('\n').map((line, i) => (
        <p key={i}>{line || '\u00A0'}</p>
      ))}
    </div>
  )
}

function EquipmentList({ title, items, icon }: { title: string; items: string[]; icon: string }) {
  return (
    <div className="equipment-list">
      <h3><span aria-hidden="true">{icon}</span> {title}</h3>
      <ul>
        {items.map((item, i) => (
          <li key={i} className={item.trim() ? undefined : 'equipment-list__blank'}>
            {item.trim() ? item : '\u00a0'}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CaseReader({ surgicalCase, onUpdate, onClose }: CaseReaderProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>('dx')
  const [readSections, setReadSections] = useState<Set<SectionKey>>(new Set())
  const [readingSettings, setReadingSettings] = useState<ReadingSettings>(getInitialReadingSettings)
  const [isWritingOpen, setIsWritingOpen] = useState(false)
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [noteMode, setNoteMode] = useState<'type' | 'write'>('type')

  useEffect(() => {
    try {
      localStorage.setItem(READING_SETTINGS_KEY, JSON.stringify(readingSettings))
    } catch (error) {
      console.warn('[CaseReader] Could not save reading preferences:', error)
    }
  }, [readingSettings])

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

  const sectionStrokes = surgicalCase.annotations?.[activeSection] ?? []
  const updateSectionStrokes = (strokes: HandwritingStroke[]) => {
    const annotations = { ...surgicalCase.annotations }
    if (strokes.length > 0) annotations[activeSection] = strokes
    else delete annotations[activeSection]
    onUpdate({ ...surgicalCase, annotations })
  }
  const updatePersonalNoteStrokes = (strokes: HandwritingStroke[]) => {
    const updatedCase = { ...surgicalCase }
    if (strokes.length > 0) updatedCase.personalNoteStrokes = strokes
    else delete updatedCase.personalNoteStrokes
    onUpdate(updatedCase)
  }

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

  // Count total images across all sections
  const totalImages = Object.values(surgicalCase.images).reduce(
    (sum, arr) => sum + (arr?.length ?? 0), 0
  )

  return (
    <div className="case-reader-overlay" role="dialog" aria-modal="true" aria-labelledby="reader-title">
      <div className="case-reader">
        <header className="case-reader__header">
          <button type="button" className="btn-back" onClick={handleClose}>
            ← กลับชั้นวาง
          </button>
          <div className="case-reader__title-block">
            <h1 id="reader-title">{surgicalCase.title}</h1>
            <p>{surgicalCase.subtitle}</p>
            <span className="case-reader__meta">
              อัปเดตล่าสุด: {formatUpdatedAt(surgicalCase.updatedAt)}
              {totalImages > 0 && ` · 🖼 ${totalImages} รูป`}
            </span>
          </div>
          <div className="case-reader__header-end">
            <button
              type="button"
              className="btn-print"
              onClick={() => window.print()}
              aria-label="พิมพ์เคสนี้"
              title="พิมพ์ / บันทึก PDF"
            >
              🖨️
            </button>
            <div
              className="read-progress"
              role="progressbar"
              aria-valuenow={readCount}
              aria-valuemin={0}
              aria-valuemax={totalSections}
              aria-label={`อ่านแล้ว ${readCount} จาก ${totalSections} หัวข้อ`}
            >
              <div className="read-progress__bar">
                <div className="read-progress__fill" style={{ width: `${(readCount / totalSections) * 100}%` }} />
              </div>
              <span className="read-progress__label">
                {allRead ? '✓ อ่านครบแล้ว — พร้อมเข้าเคส' : `${readCount}/${totalSections} หัวข้อ`}
              </span>
            </div>
          </div>
        </header>

        <nav className="section-nav" aria-label="หัวข้อในเคส">
          {SECTIONS.map((section, idx) => {
            const hasImages = (surgicalCase.images[section.key]?.length ?? 0) > 0
            const hasHandwriting = (surgicalCase.annotations?.[section.key]?.length ?? 0) > 0
            return (
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
                {(hasImages || hasHandwriting) && (
                  <span
                    className="section-nav__img-dot"
                    aria-label={[
                      hasImages ? 'มีรูป' : '',
                      hasHandwriting ? 'มีบันทึกลายมือ' : '',
                    ].filter(Boolean).join(' และ ')}
                  />
                )}
              </button>
            )
          })}
        </nav>

        <main className="case-reader__content">
          <div className="reading-controls" role="group" aria-label="ปรับแต่งการอ่าน">
            <span className="reading-controls__label">ปรับการอ่าน</span>
            <div className="reading-controls__size">
              <button
                type="button"
                onClick={() => setReadingSettings((current) => ({
                  ...current,
                  fontSize: Math.max(16, current.fontSize - 2),
                }))}
                disabled={readingSettings.fontSize === 16}
                aria-label="ลดขนาดตัวอักษร"
              >
                ก−
              </button>
              <output aria-live="polite" aria-label="ขนาดตัวอักษร">
                {readingSettings.fontSize}px
              </output>
              <button
                type="button"
                onClick={() => setReadingSettings((current) => ({
                  ...current,
                  fontSize: Math.min(28, current.fontSize + 2),
                }))}
                disabled={readingSettings.fontSize === 28}
                aria-label="เพิ่มขนาดตัวอักษร"
              >
                ก+
              </button>
            </div>
            <button
              type="button"
              className="reading-controls__spacing"
              onClick={() => setReadingSettings((current) => ({
                ...current,
                lineHeight: current.lineHeight === 1.8 ? 2 : 1.8,
              }))}
              aria-pressed={readingSettings.lineHeight === 2}
              aria-label="ปรับระยะห่างบรรทัด"
            >
              ↕ <span>{readingSettings.lineHeight === 2 ? 'บรรทัดโปร่ง' : 'บรรทัดปกติ'}</span>
            </button>
            <button
              type="button"
              className="reading-controls__reset"
              onClick={() => setReadingSettings(DEFAULT_READING_SETTINGS)}
              disabled={
                readingSettings.fontSize === DEFAULT_READING_SETTINGS.fontSize &&
                readingSettings.lineHeight === DEFAULT_READING_SETTINGS.lineHeight
              }
            >
              คืนค่า
            </button>
            <button
              type="button"
              className="reading-controls__notes"
              aria-expanded={isNotesOpen}
              onClick={() => setIsNotesOpen((open) => !open)}
            >
              {isNotesOpen ? '✕ ปิดสมุดจด' : '📝 สมุดจด'}
            </button>
          </div>
          {isNotesOpen && (
            <section className="case-personal-notes" aria-labelledby="personal-notes-title">
              <header className="case-personal-notes__header">
                <div>
                  <h3 id="personal-notes-title">สมุดจดส่วนตัว</h3>
                  <p>จดเพิ่มได้ทั้งแบบพิมพ์และเขียนด้วยมือ · บันทึกอัตโนมัติ</p>
                </div>
                <div className="case-personal-notes__modes" role="group" aria-label="วิธีจดบันทึก">
                  <button
                    type="button"
                    className={noteMode === 'type' ? 'is-active' : ''}
                    aria-pressed={noteMode === 'type'}
                    onClick={() => setNoteMode('type')}
                  >
                    พิมพ์
                  </button>
                  <button
                    type="button"
                    className={noteMode === 'write' ? 'is-active' : ''}
                    aria-pressed={noteMode === 'write'}
                    onClick={() => setNoteMode('write')}
                  >
                    ✎ เขียน
                  </button>
                </div>
              </header>
              {noteMode === 'type' ? (
                <div className="case-personal-notes__typed">
                  <textarea
                    value={surgicalCase.personaNotes ?? ''}
                    maxLength={5000}
                    onChange={(event) => onUpdate({ ...surgicalCase, personaNotes: event.target.value })}
                    placeholder="พิมพ์บันทึกส่วนตัวของคุณที่นี่..."
                    aria-label="บันทึกส่วนตัวแบบพิมพ์"
                  />
                  <span>{(surgicalCase.personaNotes ?? '').length}/5000</span>
                </div>
              ) : (
                <HandwritingPad
                  strokes={surgicalCase.personalNoteStrokes ?? []}
                  onChange={updatePersonalNoteStrokes}
                  isActive
                >
                  <div className="case-personal-notes__paper" aria-label="พื้นที่เขียนบันทึกด้วยมือ" />
                </HandwritingPad>
              )}
            </section>
          )}
          <h2>{SECTIONS.find((s) => s.key === activeSection)?.label}</h2>
          <section className="case-handwriting" aria-label="บันทึกลายมือประจำหัวข้อ">
            <button
              type="button"
              className="case-handwriting__toggle"
              aria-expanded={isWritingOpen}
              onClick={() => setIsWritingOpen((open) => !open)}
            >
              <span>{isWritingOpen ? '✕ ปิดโหมดเขียน' : '✎ เขียนทับบนเนื้อหา'}</span>
              {sectionStrokes.length > 0 && (
                <span className="case-handwriting__count">{sectionStrokes.length} เส้น</span>
              )}
            </button>
          </section>
          <div
            className="case-reader__text case-reader__text--annotated"
            style={{ fontSize: `${readingSettings.fontSize}px`, lineHeight: readingSettings.lineHeight }}
          >
            <HandwritingPad
              strokes={sectionStrokes}
              onChange={updateSectionStrokes}
              isActive={isWritingOpen}
            >
              <SectionContent
                sectionKey={activeSection}
                surgicalCase={surgicalCase}
                onUpdateCase={onUpdate}
              />
            </HandwritingPad>
          </div>
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
