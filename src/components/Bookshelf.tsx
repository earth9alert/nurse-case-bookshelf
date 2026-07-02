import type { SurgicalCase } from '../types/case'
import { BookSpine } from './BookSpine'

interface BookshelfProps {
  cases: SurgicalCase[]
  onSelectCase: (surgicalCase: SurgicalCase) => void
}

export function Bookshelf({ cases, onSelectCase }: BookshelfProps) {
  return (
    <div className="bookshelf">
      <div className="bookshelf__shelf">
        <div className="bookshelf__books">
          {cases.map((surgicalCase) => (
            <BookSpine
              key={surgicalCase.id}
              surgicalCase={surgicalCase}
              onClick={() => onSelectCase(surgicalCase)}
            />
          ))}
        </div>
        <div className="bookshelf__board" aria-hidden="true" />
        <div className="bookshelf__board-shadow" aria-hidden="true" />
      </div>
    </div>
  )
}
