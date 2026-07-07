import type { Category } from '../types/case'
import type { Statistics } from '../hooks/useStatistics'

interface StatisticsDashboardProps {
  stats: Statistics
  categories: Category[]
  storageUsedMB: number
}

export function StatisticsDashboard({
  stats,
  categories,
  storageUsedMB,
}: StatisticsDashboardProps) {
  return (
    <section className="stats-dashboard">
      <h3>📊 สถิติ</h3>

      {/* Main stats */}
      <div className="stats-grid">
        <div className="stats-card">
          <span className="stats-card__value">{stats.totalCases}</span>
          <span className="stats-card__label">เคสทั้งหมด</span>
        </div>
        <div className="stats-card">
          <span className="stats-card__value">{stats.totalImages}</span>
          <span className="stats-card__label">รูปทั้งหมด</span>
        </div>
        <div className="stats-card">
          <span className="stats-card__value">{stats.totalCategories}</span>
          <span className="stats-card__label">ห้อง/หมวด</span>
        </div>
        <div className="stats-card">
          <span className="stats-card__value">{storageUsedMB}MB</span>
          <span className="stats-card__label">พื้นที่ใช้</span>
        </div>
      </div>

      {/* Per-category breakdown */}
      {categories.length > 0 && (
        <div className="stats-breakdown">
          <h4>เคสแยกตามห้อง</h4>
          <div className="stats-breakdown__grid">
            {categories.map((cat) => {
              const count = stats.casesByCategory[cat.id] ?? 0
              const imgs = stats.imagesByCategory[cat.id] ?? 0
              return (
                <div key={cat.id} className="stats-breakdown__item">
                  <span className="stats-breakdown__icon">{cat.icon}</span>
                  <span className="stats-breakdown__name">{cat.name}</span>
                  <span className="stats-breakdown__count">
                    {count} เคส · {imgs} รูป
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
