import { useState } from 'react'
import { DEFAULT_CATEGORIES, UNCATEGORIZED_ID, type Category, type SurgicalCase } from '../types/case'

interface CategoryLobbyProps {
  categories: Category[]
  cases: SurgicalCase[]
  onEnterRoom: (categoryId: string) => void
  onAddCategory: () => void
  onEditCategory: (cat: Category) => void
  onDeleteCategory: (id: string) => void
}

export function CategoryLobby({
  categories,
  cases,
  onEnterRoom,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: CategoryLobbyProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Only show categories that have cases, plus always show the "add" prompt
  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    count: cases.filter((c) => c.categoryId === cat.id).length,
  }))

  const isDefault = (id: string) => DEFAULT_CATEGORIES.some((d) => d.id === id)

  return (
    <div className="lobby">
      <div className="lobby__hallway">
        <p className="lobby__hint">เลือกห้องที่ต้องการ</p>
        <div className="lobby__doors">
          {categoriesWithCount.map((cat) => (
            <div
              key={cat.id}
              className={`lobby__door-wrapper ${hoveredId === cat.id ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredId(cat.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                type="button"
                className="lobby__door"
                style={{ '--door-color': cat.color } as React.CSSProperties}
                onClick={() => onEnterRoom(cat.id)}
                aria-label={`เข้าห้อง ${cat.name} (${cat.count} เคส)`}
              >
                <span className="lobby__door-icon">{cat.icon}</span>
                <span className="lobby__door-name">{cat.name}</span>
                <span className="lobby__door-count">
                  {cat.count > 0 ? `${cat.count} เคส` : 'ยังไม่มีเคส'}
                </span>
                <span className="lobby__door-knob" aria-hidden="true" />
              </button>

              {/* Edit/delete controls — hidden for uncategorized */}
              {cat.id !== UNCATEGORIZED_ID && (
                <div className="lobby__door-actions">
                  <button
                    type="button"
                    onClick={() => onEditCategory(cat)}
                    aria-label={`แก้ไขหมวด ${cat.name}`}
                    title="แก้ไข"
                  >
                    ✏️
                  </button>
                  {!isDefault(cat.id) && (
                    <button
                      type="button"
                      className="danger"
                      onClick={() => {
                        if (confirm(`ลบหมวด "${cat.name}"?\nเคสในหมวดนี้จะถูกย้ายไป "ไม่ระบุหมวด"`))
                          onDeleteCategory(cat.id)
                      }}
                      aria-label={`ลบหมวด ${cat.name}`}
                      title="ลบ"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Add new category door */}
          <button
            type="button"
            className="lobby__door lobby__door--add"
            onClick={onAddCategory}
            aria-label="เพิ่มห้องใหม่"
          >
            <span className="lobby__door-icon">＋</span>
            <span className="lobby__door-name">เพิ่มห้องใหม่</span>
          </button>
        </div>
      </div>
    </div>
  )
}
