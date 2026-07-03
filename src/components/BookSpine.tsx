import type { CSSProperties } from 'react'
import type { SurgicalCase } from '../types/case'

interface BookSpineProps {
  surgicalCase: SurgicalCase
  onClick: () => void
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('th-TH', {
      year: '2-digit',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export function BookSpine({ surgicalCase, onClick }: BookSpineProps) {
  const dateStr = formatDate(surgicalCase.updatedAt)
  const totalImages = Object.values(surgicalCase.images).reduce(
    (sum, arr) => sum + (arr?.length ?? 0), 0
  )

  return (
    <button
      type="button"
      className="book-spine"
      style={{ '--book-color': surgicalCase.color } as CSSProperties}
      onClick={onClick}
      aria-label={`เปิดเคส ${surgicalCase.title} — อัปเดต ${dateStr}`}
      title={`อัปเดตล่าสุด: ${dateStr}`}
    >
      <span className="book-spine__title">{surgicalCase.title}</span>
      <span className="book-spine__subtitle">{surgicalCase.subtitle}</span>
      {totalImages > 0 && (
        <span className="book-spine__img-badge" aria-hidden="true">
          🖼{totalImages}
        </span>
      )}
      <span className="book-spine__date" aria-hidden="true">{dateStr}</span>
    </button>
  )
}
