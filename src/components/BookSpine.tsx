import type { CSSProperties } from 'react'
import type { SurgicalCase } from '../types/case'

interface BookSpineProps {
  surgicalCase: SurgicalCase
  onClick: () => void
}

export function BookSpine({ surgicalCase, onClick }: BookSpineProps) {
  return (
    <button
      type="button"
      className="book-spine"
      style={{ '--book-color': surgicalCase.color } as CSSProperties}
      onClick={onClick}
      aria-label={`เปิดเคส ${surgicalCase.title}`}
    >
      <span className="book-spine__title">{surgicalCase.title}</span>
      <span className="book-spine__subtitle">{surgicalCase.subtitle}</span>
    </button>
  )
}
