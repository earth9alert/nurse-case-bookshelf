import { useRef, useState } from 'react'
import html2pdf from 'html2pdf.js'
import { SECTIONS, type SurgicalCase } from '../types/case'

interface CasePrintViewProps {
  surgicalCase: SurgicalCase
  onClose: () => void
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

function RichContent({ content }: { content: string }) {
  const isHtml = /<[a-z][\s\S]*>/i.test(content)
  if (isHtml) {
    return <div className="print-rich" dangerouslySetInnerHTML={{ __html: content }} />
  }
  return (
    <div className="print-plain">
      {content.split('\n').map((line, i) => (
        <p key={i}>{line || '\u00A0'}</p>
      ))}
    </div>
  )
}

export function CasePrintView({ surgicalCase, onClose }: CasePrintViewProps) {
  const docRef = useRef<HTMLDivElement>(null)
  const [generating, setGenerating] = useState(false)

  const handleDownloadPdf = async () => {
    if (!docRef.current) return
    setGenerating(true)
    try {
      const safeTitle = surgicalCase.title.replace(/[^a-zA-Z0-9\u0E00-\u0E7F _-]/g, '').trim() || 'surgical-case'
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `${safeTitle}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(docRef.current)
        .save()
    } catch (err) {
      console.error('[CasePrintView] PDF generation failed:', err)
      alert('ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่อีกครั้ง')
    } finally {
      setGenerating(false)
    }
  }

  const totalImages = Object.values(surgicalCase.images)
    .reduce((sum, arr) => sum + (arr?.length ?? 0), 0)

  return (
    <div className="print-overlay" id="print-view">
      {/* Toolbar — hidden on print */}
      <div className="print-toolbar no-print">
        <button
          type="button"
          className="btn-print-manual"
          onClick={handleDownloadPdf}
          disabled={generating}
        >
          {generating ? '⏳ กำลังสร้าง PDF…' : '📥 ดาวน์โหลด PDF'}
        </button>
        <button type="button" className="btn-print-manual" onClick={() => window.print()}>
          🖨️ พิมพ์
        </button>
        <button type="button" className="btn-print-close" onClick={onClose}>
          ✕ ปิด
        </button>
      </div>

      {/* Print content */}
      <div className="print-doc" ref={docRef}>
        {/* Cover header */}
        <header className="print-header">
          <div className="print-header__color-bar" style={{ background: surgicalCase.color }} />
          <div className="print-header__body">
            <h1 className="print-title">{surgicalCase.title}</h1>
            {surgicalCase.subtitle && (
              <p className="print-subtitle">{surgicalCase.subtitle}</p>
            )}
            <p className="print-meta">
              อัปเดตล่าสุด: {formatDate(surgicalCase.updatedAt)}
              {totalImages > 0 && ` · ${totalImages} รูปภาพ`}
            </p>
          </div>
        </header>

        {/* All 8 sections */}
        {SECTIONS.map((section) => {
          const imgs = surgicalCase.images[section.key] ?? []
          const key = section.key

          return (
            <section key={key} className="print-section">
              <h2 className="print-section__title">{section.label}</h2>

              {/* Text content */}
              {key === 'dx' && <RichContent content={surgicalCase.dx} />}
              {key === 'operation' && <RichContent content={surgicalCase.operation} />}
              {key === 'anatomy' && <RichContent content={surgicalCase.anatomy} />}
              {key === 'roomSetup' && <RichContent content={surgicalCase.roomSetup} />}
              {key === 'equipment' && (
                <div className="print-equipment">
                  <div className="print-equipment__col">
                    <h3>📦 ของใน Store</h3>
                    <ul>{surgicalCase.equipment.store.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                  <div className="print-equipment__col">
                    <h3>🏥 ของในห้องเวช</h3>
                    <ul>{surgicalCase.equipment.room.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                  <div className="print-equipment__col">
                    <h3>🧺 ของในตะกร้า</h3>
                    <ul>{surgicalCase.equipment.basket.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                </div>
              )}
              {key === 'positioning' && <RichContent content={surgicalCase.positioning} />}
              {key === 'draping' && <RichContent content={surgicalCase.draping} />}
              {key === 'steps' && <RichContent content={surgicalCase.steps} />}

              {/* Images for this section */}
              {imgs.length > 0 && (
                <div className="print-images">
                  {imgs.map((img) => (
                    <figure key={img.id} className="print-image">
                      <img src={img.imageUrl} alt={img.caption || 'รูปประกอบ'} />
                      {img.caption && <figcaption>{img.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              )}
            </section>
          )
        })}

        <footer className="print-footer">
          <p>ห้องสมุดของน้องสมาย · พิมพ์เมื่อ {formatDate(new Date().toISOString())}</p>
        </footer>
      </div>
    </div>
  )
}
