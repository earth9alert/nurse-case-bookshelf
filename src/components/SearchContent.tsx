import type { SurgicalCase, Category } from '../types/case'

interface SearchContentProps {
  query: string
  cases: SurgicalCase[]
  categories: Category[]
  onSelectCase: (c: SurgicalCase) => void
}

interface SearchResult {
  case: SurgicalCase
  matches: string[] // หัวข้อที่ตรงกัน เช่น ['title', 'dx', 'steps']
}

export function SearchContent({
  query,
  cases,
  categories,
  onSelectCase,
}: SearchContentProps) {
  if (!query.trim()) return null

  const normalize = (s: string) => s.toLowerCase().trim()
  const q = normalize(query)

  const results: SearchResult[] = []

  cases.forEach((c) => {
    const matches: string[] = []

    // ค้นหาในชื่อและ subtitle
    if (normalize(c.title).includes(q)) matches.push('ชื่อเคส')
    if (normalize(c.subtitle).includes(q)) matches.push('subtitle')

    // ค้นหาในเนื้อหาทั้งหมด
    if (normalize(c.dx).includes(q)) matches.push('Dx')
    if (normalize(c.operation).includes(q)) matches.push('Operation')
    if (normalize(c.anatomy).includes(q)) matches.push('Anatomy')
    if (normalize(c.roomSetup).includes(q)) matches.push('การจัดห้อง')
    if (
      c.equipment.store.some((e) => normalize(e).includes(q)) ||
      c.equipment.room.some((e) => normalize(e).includes(q)) ||
      c.equipment.basket.some((e) => normalize(e).includes(q))
    ) {
      matches.push('อุปกรณ์')
    }
    if (normalize(c.positioning).includes(q)) matches.push('การจัดท่า')
    if (normalize(c.draping).includes(q)) matches.push('การปูผ้า')
    if (normalize(c.steps).includes(q)) matches.push('ขั้นตอน')

    if (matches.length > 0) {
      results.push({ case: c, matches })
    }
  })

  if (results.length === 0) {
    return (
      <section className="search-results">
        <p className="search-results__meta">ไม่พบข้อมูลที่ตรงกับ "{query}"</p>
      </section>
    )
  }

  return (
    <section className="search-results">
      <p className="search-results__meta">พบ {results.length} เคสที่ตรงกับ "{query}"</p>
      <ul className="case-list__ul">
        {results.map(({ case: c, matches }) => {
          const cat = categories.find((ct) => ct.id === c.categoryId)
          return (
            <li key={c.id}>
              <button
                type="button"
                className="case-list__item"
                onClick={() => onSelectCase(c)}
              >
                <span className="case-list__dot" style={{ background: c.color }} />
                <span>
                  <strong>{c.title}</strong>
                  <small>
                    {cat ? `${cat.icon} ${cat.name}` : ''}
                    {c.subtitle ? ` · ${c.subtitle}` : ''}
                  </small>
                  <small className="search-results__matches">
                    ตรงกับ: {matches.join(', ')}
                  </small>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
