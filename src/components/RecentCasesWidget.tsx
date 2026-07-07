import type { Category, SurgicalCase } from '../types/case'

interface RecentCasesWidgetProps {
  recentCases: SurgicalCase[]
  categories: Category[]
  onSelectCase: (surgicalCase: SurgicalCase) => void
}

export function RecentCasesWidget({ recentCases, categories, onSelectCase }: RecentCasesWidgetProps) {
  if (recentCases.length === 0) {
    return null
  }

  return (
    <section className="recent-cases-widget">
      <h2>⏰ เคสที่เข้าล่าสุด</h2>
      <ul className="recent-cases__list">
        {recentCases.slice(0, 5).map((c) => {
          const cat = categories.find((ct) => ct.id === c.categoryId)
          return (
            <li key={c.id}>
              <button
                type="button"
                className="recent-cases__item"
                onClick={() => onSelectCase(c)}
              >
                <span className="recent-cases__icon">{cat?.icon}</span>
                <div className="recent-cases__info">
                  <strong>{c.title}</strong>
                  <small>{c.subtitle}</small>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
