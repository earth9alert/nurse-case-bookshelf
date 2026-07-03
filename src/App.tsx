import { useState } from 'react'
import { Bookshelf } from './components/Bookshelf'
import { CaseEditor } from './components/CaseEditor'
import { CaseReader } from './components/CaseReader'
import { BackupRestore } from './components/BackupRestore'
import { CategoryLobby } from './components/CategoryLobby'
import { CategoryEditor } from './components/CategoryEditor'
import { useCases } from './hooks/useCases'
import { useCategories } from './hooks/useCategories'
import type { Category, SurgicalCase } from './types/case'
import { UNCATEGORIZED_ID } from './types/case'
import './App.css'

type View = 'lobby' | 'room' | 'read' | 'edit' | 'editCategory'

function App() {
  const { cases, resetToSample, upsertCase, deleteCase, importCases } = useCases()
  const { categories, upsertCategory, deleteCategory } = useCategories()

  const [view, setView] = useState<View>('lobby')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [selectedCase, setSelectedCase] = useState<SurgicalCase | null>(null)
  const [editingCase, setEditingCase] = useState<SurgicalCase | undefined>(undefined)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)

  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? null
  const roomCases = cases.filter((c) => c.categoryId === activeCategoryId)

  const openCase = (surgicalCase: SurgicalCase) => {
    setSelectedCase(surgicalCase)
    setView('read')
  }

  const openEditor = (surgicalCase?: SurgicalCase) => {
    setEditingCase(surgicalCase)
    setView('edit')
  }

  const handleSave = (surgicalCase: SurgicalCase) => {
    upsertCase(surgicalCase)
    // Return to the room the case belongs to
    setActiveCategoryId(surgicalCase.categoryId)
    setView('room')
    setEditingCase(undefined)
  }

  const handleDeleteCategory = (id: string) => {
    // Move all cases in deleted category to uncategorized
    cases
      .filter((c) => c.categoryId === id)
      .forEach((c) => upsertCase({ ...c, categoryId: UNCATEGORIZED_ID }))
    deleteCategory(id)
  }

  const goLobby = () => {
    setView('lobby')
    setActiveCategoryId(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          {view !== 'lobby' && (
            <button type="button" className="btn-back-lobby" onClick={goLobby} aria-label="กลับหน้าหลัก">
              ←
            </button>
          )}
          <span className="app-header__icon" aria-hidden="true">📚</span>
          <div>
            <h1>อ่านก่อนเข้าเคส</h1>
            <p>
              {view === 'lobby' && 'เลือกห้องที่ต้องการ'}
              {view === 'room' && activeCategory && `${activeCategory.icon} ${activeCategory.name}`}
              {view === 'read' && selectedCase?.subtitle}
              {view === 'edit' && (editingCase ? 'แก้ไขเคส' : 'เพิ่มเคสใหม่')}
              {view === 'editCategory' && (editingCategory ? 'แก้ไขห้อง' : 'เพิ่มห้องใหม่')}
            </p>
          </div>
        </div>

        {view === 'room' && (
          <div className="app-header__actions">
            <BackupRestore cases={cases} onImport={importCases} />
            <button type="button" className="btn-secondary" onClick={() => openEditor()}>
              + เพิ่มเคส
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                if (confirm('รีเซ็ตข้อมูลเป็นตัวอย่างเริ่มต้น?')) resetToSample()
              }}
            >
              รีเซ็ตตัวอย่าง
            </button>
          </div>
        )}

        {view === 'lobby' && (
          <div className="app-header__actions">
            <BackupRestore cases={cases} onImport={importCases} />
          </div>
        )}
      </header>

      {/* ── Lobby ── */}
      {view === 'lobby' && (
        <main className="app-main">
          <CategoryLobby
            categories={categories}
            cases={cases}
            onEnterRoom={(id) => { setActiveCategoryId(id); setView('room') }}
            onAddCategory={() => { setEditingCategory(undefined); setView('editCategory') }}
            onEditCategory={(cat) => { setEditingCategory(cat); setView('editCategory') }}
            onDeleteCategory={handleDeleteCategory}
          />
        </main>
      )}

      {/* ── Room (bookshelf) ── */}
      {view === 'room' && activeCategoryId && (
        <main className="app-main">
          <p className="shelf-hint">เลือกหนังสือเพื่ออ่านก่อนเข้าเคส — ครบ 8 หัวข้อ</p>
          <Bookshelf cases={roomCases} onSelectCase={openCase} />

          <section className="case-list">
            <h2>รายการเคสในห้องนี้</h2>
            {roomCases.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                ยังไม่มีเคส — กด <strong>+ เพิ่มเคส</strong> เพื่อเริ่มต้น
              </p>
            ) : (
              <ul>
                {roomCases.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="case-list__item" onClick={() => openCase(c)}>
                      <span className="case-list__dot" style={{ background: c.color }} />
                      <span>
                        <strong>{c.title}</strong>
                        <small>{c.subtitle}</small>
                      </span>
                    </button>
                    <div className="case-list__actions">
                      <button
                        type="button"
                        onClick={() => openEditor(c)}
                        aria-label={`แก้ไขเคส ${c.title}`}
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        className="danger"
                        aria-label={`ลบเคส ${c.title}`}
                        onClick={() => {
                          if (confirm(`ลบเคส "${c.title}"?`)) deleteCase(c.id)
                        }}
                      >
                        ลบ
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="sections-guide">
            <h2>โครงสร้างในแต่ละเคส (8 หัวข้อ)</h2>
            <div className="sections-guide__grid">
              {[
                ['1', 'Dx', 'การวินิจฉัย'],
                ['2', 'Operation', 'หัตถการ'],
                ['3', 'Anatomy', 'กายวิภาค'],
                ['4', 'การจัดห้อง', 'เตรียมห้อง OR'],
                ['5', 'อุปกรณ์', 'Store / ห้องเวช / ตะกร้า'],
                ['6', 'การจัดท่า', 'Position'],
                ['7', 'การปูผ้า', 'Draping'],
                ['8', 'Step', 'ขั้นตอนการทำงาน'],
              ].map(([num, en, th]) => (
                <div key={num} className="sections-guide__card">
                  <span className="sections-guide__num">{num}</span>
                  <strong>{en}</strong>
                  <span>{th}</span>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* ── Case Reader ── */}
      {view === 'read' && selectedCase && (
        <CaseReader
          surgicalCase={selectedCase}
          onClose={() => {
            setView('room')
            setSelectedCase(null)
          }}
        />
      )}

      {/* ── Case Editor ── */}
      {view === 'edit' && (
        <CaseEditor
          initial={editingCase}
          categories={categories}
          defaultCategoryId={activeCategoryId ?? UNCATEGORIZED_ID}
          onSave={handleSave}
          onCancel={() => setView('room')}
        />
      )}

      {/* ── Category Editor ── */}
      {view === 'editCategory' && (
        <CategoryEditor
          initial={editingCategory}
          onSave={(cat) => {
            upsertCategory(cat)
            setView('lobby')
            setEditingCategory(undefined)
          }}
          onCancel={() => {
            setView('lobby')
            setEditingCategory(undefined)
          }}
        />
      )}
    </div>
  )
}

export default App
