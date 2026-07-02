import { useState } from 'react'
import { Bookshelf } from './components/Bookshelf'
import { CaseEditor } from './components/CaseEditor'
import { CaseReader } from './components/CaseReader'
import { BackupRestore } from './components/BackupRestore'
import { useCases } from './hooks/useCases'
import type { SurgicalCase } from './types/case'
import './App.css'

type View = 'shelf' | 'read' | 'edit'

function App() {
  const { cases, resetToSample, upsertCase, deleteCase, importCases } = useCases()
  const [view, setView] = useState<View>('shelf')
  const [selectedCase, setSelectedCase] = useState<SurgicalCase | null>(null)
  const [editingCase, setEditingCase] = useState<SurgicalCase | undefined>(undefined)

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
    setView('shelf')
    setEditingCase(undefined)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__icon" aria-hidden="true">
            📚
          </span>
          <div>
            <h1>อ่านก่อนเข้าเคส</h1>
            <p>ชั้นวางหนังสือสำหรับพยาบาลห้องผ่าตัด</p>
          </div>
        </div>
        {view === 'shelf' && (
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
      </header>

      {view === 'shelf' && (
        <main className="app-main">
          <p className="shelf-hint">เลือกหนังสือเพื่ออ่านก่อนเข้าเคส — ครบ 8 หัวข้อ</p>
          <Bookshelf cases={cases} onSelectCase={openCase} />

          <section className="case-list">
            <h2>รายการเคสทั้งหมด</h2>
            <ul>
              {cases.map((c) => (
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

      {view === 'read' && selectedCase && (
        <CaseReader
          surgicalCase={selectedCase}
          onClose={() => {
            setView('shelf')
            setSelectedCase(null)
          }}
        />
      )}

      {view === 'edit' && (
        <CaseEditor
          initial={editingCase}
          onSave={handleSave}
          onCancel={() => {
            setView('shelf')
            setEditingCase(undefined)
          }}
        />
      )}
    </div>
  )
}

export default App
