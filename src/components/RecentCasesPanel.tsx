import type { RecentCase } from '../hooks/useRecentCases'
import type { SurgicalCase } from '../types/case'

interface RecentCasesPanelProps {
  recentCases: RecentCase[]
  allCases: SurgicalCase[]
  onSelectCase: (c: SurgicalCase) => void
  onClearRecent: () => void
}

export function RecentCasesPanel({
  recentCases,
  allCases,
  onSelectCase,
  onClearRecent,
}: RecentCasesPanelProps) {
  if (recentCases.length === 0) return null

  const handleSelectRecent = (caseId: string) => {
    const found = allCases.find((c) => c.id === caseId)
    if (found) onSelectCase(found)
  }

  return (
    <section className="recent-cases">
      <div className="recent-cases__header">
        <h3>📖 เคสที่เปิดล่าสุด</h3>
        <button
          type="button"
          className="btn-clear-recent"
          onClick={onClearRecent}
          title="ล้างประวัติ"
        >
          ×
        </button>
      </div>
      <ul className="recent-cases__list">
        {recentCases.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => handleSelectRecent(r.id)}
              className="recent-cases__item"
            >
              <span className="recent-cases__title">{r.title}</span>
              <span className="recent-cases__time">
                {formatTimeAgo(r.openedAt)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function formatTimeAgo(iso: string): string {
  try {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'เมื่อสักครู่'
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`

    return date.toLocaleDateString('th-TH')
  } catch {
    return 'ไม่ทราบ'
  }
}
