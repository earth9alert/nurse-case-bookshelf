import { useRef, useState } from 'react'
import { DEFAULT_CATEGORIES, UNCATEGORIZED_ID, type Category, type SurgicalCase } from '../types/case'

interface CategoryLobbyProps {
  categories: Category[]
  cases: SurgicalCase[]
  onEnterRoom: (categoryId: string) => void
  onAddCategory: () => void
  onEditCategory: (cat: Category) => void
  onDeleteCategory: (id: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function CategoryLobby({
  categories,
  cases,
  onEnterRoom,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onReorder,
}: CategoryLobbyProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  // Touch drag state
  const touchDragIndex = useRef<number | null>(null)
  const touchOverIndex = useRef<number | null>(null)

  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    count: cases.filter((c) => c.categoryId === cat.id).length,
  }))

  const isDefault = (id: string) => DEFAULT_CATEGORIES.some((d) => d.id === id)

  // ── Mouse drag handlers ───────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    // Ghost image — slight delay so the drag image captures the element
    setTimeout(() => {
      setDragIndex(index)
    }, 0)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== index) {
      onReorder(dragIndex, index)
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setOverIndex(null)
  }

  // ── Touch drag handlers ───────────────────────────────────────────────────

  const handleTouchStart = (index: number) => {
    touchDragIndex.current = index
    touchOverIndex.current = index
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const wrapper = el?.closest('[data-door-index]')
    if (wrapper) {
      const idx = Number(wrapper.getAttribute('data-door-index'))
      if (!isNaN(idx)) {
        touchOverIndex.current = idx
        setOverIndex(idx)
      }
    }
  }

  const handleTouchEnd = () => {
    const from = touchDragIndex.current
    const to = touchOverIndex.current
    if (from !== null && to !== null && from !== to) {
      onReorder(from, to)
    }
    touchDragIndex.current = null
    touchOverIndex.current = null
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div className="lobby">
      <div className="lobby__hallway">
        <p className="lobby__hint">
          เลือกห้องที่ต้องการ
          <span className="lobby__hint-drag"> · ลากเพื่อเรียงลำดับ</span>
        </p>
        <div className="lobby__doors">
          {categoriesWithCount.map((cat, index) => {
            const isDragging = dragIndex === index
            const isOver = overIndex === index && dragIndex !== null && dragIndex !== index
            return (
              <div
                key={cat.id}
                data-door-index={index}
                className={[
                  'lobby__door-wrapper',
                  hoveredId === cat.id ? 'hovered' : '',
                  isDragging ? 'dragging' : '',
                  isOver ? 'drag-over' : '',
                ].filter(Boolean).join(' ')}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onMouseEnter={() => setHoveredId(cat.id)}
                onMouseLeave={() => setHoveredId(null)}
                onTouchStart={() => handleTouchStart(index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Drag handle */}
                <div className="lobby__drag-handle" aria-hidden="true" title="ลากเพื่อเรียงลำดับ">
                  ⠿
                </div>

                <button
                  type="button"
                  className="lobby__door"
                  style={{ '--door-color': cat.color } as React.CSSProperties}
                  onClick={() => {
                    // Don't open if we just finished a drag
                    if (dragIndex === null) onEnterRoom(cat.id)
                  }}
                  aria-label={`เข้าห้อง ${cat.name} (${cat.count} เคส)`}
                >
                  <span className="lobby__door-icon">{cat.icon}</span>
                  <span className="lobby__door-name">{cat.name}</span>
                  <span className="lobby__door-count">
                    {cat.count > 0 ? `${cat.count} เคส` : 'ยังไม่มีเคส'}
                  </span>
                  <span className="lobby__door-knob" aria-hidden="true" />
                </button>

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
            )
          })}

          {/* Add new */}
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
