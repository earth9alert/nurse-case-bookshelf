import type { AppStats } from '../types/case'

interface StatsDashboardProps {
  stats: AppStats
}

export function StatsDashboard({ stats }: StatsDashboardProps) {
  const storagePercent = Math.round((stats.storageUsed / 5120) * 100) // ~5MB limit

  return (
    <section className="stats-dashboard">
      <h2>📊 สถิติ</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__value">{stats.totalCases}</div>
          <div className="stat-card__label">เคสทั้งหมด</div>
          <div className="stat-card__icon">📚</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__value">{stats.totalImages}</div>
          <div className="stat-card__label">รูปภาพทั้งหมด</div>
          <div className="stat-card__icon">🖼️</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__value">{stats.casesRead}</div>
          <div className="stat-card__label">เคสที่ทำเครื่องหมาย</div>
          <div className="stat-card__icon">✓</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__value">{stats.storageUsed} KB</div>
          <div className="stat-card__label">พื้นที่ใช้</div>
          <div className="stat-card__icon">💾</div>
          <div className="stat-card__bar">
            <div
              className="stat-card__bar-fill"
              style={{
                width: `${Math.min(storagePercent, 100)}%`,
                backgroundColor:
                  storagePercent > 80 ? '#c1666b' : storagePercent > 50 ? '#f77f00' : '#06a77d',
              }}
            />
          </div>
          <small>{storagePercent.toFixed(0)}%</small>
        </div>
      </div>
    </section>
  )
}
