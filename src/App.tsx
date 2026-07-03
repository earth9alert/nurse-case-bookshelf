import { useState } from 'react'
import { Bookshelf } from './components/Bookshelf'
import { CaseEditor } from './components/CaseEditor'
import { CaseReader } from './components/CaseReader'
import { BackupRestore } from './components/BackupRestore'
import { CategoryLobby } from './components/CategoryLobby'
import { CategoryEditor } from './components/CategoryEditor'
import { SearchBar } from './components/SearchBar'
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
  const [lobbyQuery, setLobbyQuery] = useState('')
  const [roomQuery, setRoomQuery] = useState('')

  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? null
  const roomCases = cases.filter((c) => c.categoryId === activeCategoryId)

  // filtered lists
  const normalize = (s: string) => s.toLowerCase().trim()
  const lobbyResults = lobbyQuery.trim()
    ? cases.filter(
        (c) =>
          normalize(c.title).includes(normalize(lobbyQuery)) ||
          normalize(c.subtitle).includes(normalize(lobbyQuery)),
      )
    : []
  const filteredRoomCases = roomQuery.trim()
    ? roomCases.filter(
        (c) =>
          normalize(c.title).includes(normalize(roomQuery)) ||
          normalize(c.subtitle).includes(normalize(roomQuery)),
      )
    : roomCases

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
    setActiveCategoryId(surgicalCase.categoryId)
    setView('room')
    setEditingCase(undefined)
  }

  const handleDeleteCategory = (id: string) => {
    cases
      .filter((c) => c.categoryId === id)
      .forEach((c) => upsertCase({ ...c, categoryId: UNCATEGORIZED_ID }))
    deleteCategory(id)
  }

  const goLobby = () => {
    setView('lobby')
    setActiveCategoryId(null)
    setRoomQuery('')
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
          <span className="app-header__icon" aria-hidden="true">🌸</span>
          <div>
            <h1>ห้องสมุดของน้องสมาย</h1>
            <p>
              {view === 'lobby' && 'คู่มืออ่านก่อนเข้าเคส · พยาบาลห้องผ่าตัด'}
              {view === 'room' && activeCategory && `${activeCategory.icon} ${activeCategory.name}`}
              {view === 'read' && selectedCase?.subtitle}
              {view === 'edit' && (editingCase ? 'แก้ไขเคส' : 'เพิ่มเคสใหม่')}
              {view === 'editCategory' && (editingCategory ? 'แก้ไขห้อง' : 'เพิ่มห้องใหม่')}
            </p>
          </div>
        </div>

        {(view === 'lobby' || view === 'room') && (
          <div className="app-header__actions">
            {view === 'lobby' && (
              <SearchBar
                query={lobbyQuery}
                onChange={setLobbyQuery}
                placeholder="ค้นหาเคสทุกห้อง..."
                id="lobby-search"
              />
            )}
            {view === 'room' && (
              <SearchBar
                query={roomQuery}
                onChange={setRoomQuery}
                placeholder="ค้นหาในห้องนี้..."
                id="room-search"
              />
            )}
            <BackupRestore cases={cases} onImport={importCases} />
            {view === 'room' && (
              <>
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
              </>
            )}
          </div>
        )}
      </header>

      {/* ── Lobby ── */}
      {view === 'lobby' && (
        <main className="app-main">
          {/* Global search results */}
          {lobbyQuery.trim() && (
            <section className="search-results">
              <p className="search-results__meta">
                {lobbyResults.length > 0
                  ? `พบ ${lobbyResults.length} เคสที่ตรงกับ "${lobbyQuery}"`
                  : `ไม่พบเคสที่ตรงกับ "${lobbyQuery}"`}
              </p>
              {lobbyResults.length > 0 && (
                <ul className="case-list__ul">
                  {lobbyResults.map((c) => {
                    const cat = categories.find((ct) => ct.id === c.categoryId)
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="case-list__item"
                          onClick={() => {
                            setActiveCategoryId(c.categoryId)
                            openCase(c)
                          }}
                        >
                          <span className="case-list__dot" style={{ background: c.color }} />
                          <span>
                            <strong>{c.title}</strong>
                            <small>
                              {cat ? `${cat.icon} ${cat.name}` : ''}{c.subtitle ? ` · ${c.subtitle}` : ''}
                            </small>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}

          {!lobbyQuery.trim() && (
            <CategoryLobby
              categories={categories}
              cases={cases}
              onEnterRoom={(id) => { setActiveCategoryId(id); setView('room') }}
              onAddCategory={() => { setEditingCategory(undefined); setView('editCategory') }}
              onEditCategory={(cat) => { setEditingCategory(cat); setView('editCategory') }}
              onDeleteCategory={handleDeleteCategory}
            />
          )}
        </main>
      )}

      {/* ── Room (bookshelf) ── */}
      {view === 'room' && activeCategoryId && (
        <main className="app-main">
          {!roomQuery.trim() && (
            <>
              <p className="shelf-hint">เลือกหนังสือเพื่ออ่านก่อนเข้าเคส — ครบ 8 หัวข้อ</p>
              <Bookshelf cases={roomCases} onSelectCase={openCase} />
            </>
          )}

          <section className="case-list">
            <h2>
              {roomQuery.trim()
                ? filteredRoomCases.length > 0
                  ? `พบ ${filteredRoomCases.length} เคส`
                  : `ไม่พบเคสที่ตรงกับ "${roomQuery}"`
                : 'รายการเคสในห้องนี้'}
            </h2>
            {roomCases.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>
                ยังไม่มีเคส — กด <strong>+ เพิ่มเคส</strong> เพื่อเริ่มต้น
              </p>
            ) : (
              <ul>
                {filteredRoomCases.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="case-list__item" onClick={() => openCase(c)}>
                      <span className="case-list__dot" style={{ background: c.color }} />
                      <span>
                        <strong>{c.title}</strong>
                        <small>{c.subtitle}</small>
                      </span>
                    </button>
                    <div className="case-list__actions">
                      <button type="button" onClick={() => openEditor(c)} aria-label={`แก้ไขเคส ${c.title}`}>
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        className="danger"
                        aria-label={`ลบเคส ${c.title}`}
                        onClick={() => { if (confirm(`ลบเคส "${c.title}"?`)) deleteCase(c.id) }}
                      >
                        ลบ
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!roomQuery.trim() && (
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
          )}
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
