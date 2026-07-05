import { useCallback, useEffect, useRef, useState } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  rows?: number
  id?: string
}

const HIGHLIGHT_COLORS = [
  { color: '#fff176', label: 'เหลือง' },
  { color: '#b9f6ca', label: 'เขียว' },
  { color: '#ffd6e0', label: 'ชมพู' },
  { color: '#bbdefb', label: 'ฟ้า' },
  { color: '#ffe0b2', label: 'ส้ม' },
]

function execCmd(cmd: string, value?: string) {
  document.execCommand(cmd, false, value)
}

interface FloatPos { top: number; left: number }

export function RichTextEditor({ value, onChange, placeholder, rows = 4, id }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const isComposing = useRef(false)
  const skipNextSync = useRef(false)
  const [floatPos, setFloatPos] = useState<FloatPos | null>(null)
  const [hasSelection, setHasSelection] = useState(false)

  // Sync external value → DOM
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (skipNextSync.current) { skipNextSync.current = false; return }
    if (el.innerHTML !== value) el.innerHTML = value
  }, [value])

  const handleInput = useCallback(() => {
    if (isComposing.current) return
    const el = editorRef.current
    if (!el) return
    skipNextSync.current = true
    onChange(el.innerHTML)
  }, [onChange])

  // Floating toolbar position — above selected text
  const updateFloat = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setFloatPos(null); setHasSelection(false); return
    }
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const range = sel.getRangeAt(0)
    if (!wrapper.contains(range.commonAncestorContainer)) {
      setFloatPos(null); setHasSelection(false); return
    }
    const rect = range.getBoundingClientRect()
    const wRect = wrapper.getBoundingClientRect()
    setFloatPos({
      top: rect.top - wRect.top - 50,
      left: rect.left - wRect.left + rect.width / 2,
    })
    setHasSelection(true)
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', updateFloat)
    return () => document.removeEventListener('selectionchange', updateFloat)
  }, [updateFloat])

  const applyFormat = (cmd: string, val?: string) => {
    editorRef.current?.focus()
    execCmd(cmd, val)
    handleInput()
    setTimeout(updateFloat, 50)
  }

  const queryActive = (cmd: string) => {
    try { return document.queryCommandState(cmd) } catch { return false }
  }

  const minHeight = `${rows * 1.65 * 16}px`

  // Shared color swatches renderer
  const ColorSwatches = ({ onMouseDown }: { onMouseDown?: () => void }) => (
    <>
      {HIGHLIGHT_COLORS.map(({ color, label }) => (
        <button
          key={color}
          type="button"
          className="rte-swatch"
          style={{ background: color }}
          onMouseDown={(e) => {
            e.preventDefault()
            onMouseDown?.()
            applyFormat('hiliteColor', color)
          }}
          title={`ไฮไลท์${label}`}
          aria-label={`ไฮไลท์${label}`}
        />
      ))}
      <button
        type="button"
        className="rte-swatch rte-swatch--clear"
        onMouseDown={(e) => {
          e.preventDefault()
          onMouseDown?.()
          applyFormat('hiliteColor', 'transparent')
        }}
        title="ลบไฮไลท์"
        aria-label="ลบไฮไลท์"
      >
        ✕
      </button>
    </>
  )

  return (
    <div className="rte-wrapper" ref={wrapperRef}>

      {/* ── Static top toolbar ── */}
      <div className="rte-toolbar" role="toolbar" aria-label="จัดรูปแบบข้อความ">
        <button
          type="button"
          className={`rte-btn ${queryActive('bold') ? 'rte-btn--active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); applyFormat('bold') }}
          title="ตัวหนา (Ctrl+B)" aria-label="ตัวหนา"
        >
          <strong>B</strong>
        </button>

        <button
          type="button"
          className={`rte-btn ${queryActive('underline') ? 'rte-btn--active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); applyFormat('underline') }}
          title="ขีดเส้นใต้ (Ctrl+U)" aria-label="ขีดเส้นใต้"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>

        <div className="rte-divider" aria-hidden="true" />

        {/* Highlight label */}
        <span className="rte-label">ไฮไลท์:</span>
        <ColorSwatches />

        <div className="rte-divider" aria-hidden="true" />

        <button
          type="button"
          className="rte-btn"
          onMouseDown={(e) => { e.preventDefault(); applyFormat('removeFormat') }}
          title="ลบการจัดรูปแบบ" aria-label="ลบการจัดรูปแบบ"
        >
          <span style={{ fontSize: '0.75rem' }}>A̶</span>
        </button>
      </div>

      {/* ── Editor content ── */}
      <div
        id={id}
        ref={editorRef}
        className="rte-content"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-placeholder={placeholder}
        style={{ minHeight }}
        onInput={handleInput}
        onCompositionStart={() => { isComposing.current = true }}
        onCompositionEnd={() => { isComposing.current = false; handleInput() }}
        onPaste={(e) => {
          e.preventDefault()
          const text = e.clipboardData.getData('text/plain')
          execCmd('insertText', text)
        }}
        data-placeholder={placeholder}
      />

      {/* ── Floating toolbar above selection ── */}
      {hasSelection && floatPos && (
        <div
          className="rte-float-toolbar"
          style={{ top: Math.max(4, floatPos.top), left: floatPos.left }}
          role="toolbar"
          aria-label="จัดรูปแบบข้อความที่เลือก"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            type="button"
            className={`rte-float-btn rte-float-fmt ${queryActive('bold') ? 'active' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); applyFormat('bold') }}
            title="ตัวหนา" aria-label="ตัวหนา"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`rte-float-btn rte-float-fmt ${queryActive('underline') ? 'active' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); applyFormat('underline') }}
            title="ขีดเส้นใต้" aria-label="ขีดเส้นใต้"
          >
            <span style={{ textDecoration: 'underline' }}>U</span>
          </button>

          <div className="rte-float-divider" aria-hidden="true" />

          {/* Same colors in float bar */}
          {HIGHLIGHT_COLORS.map(({ color, label }) => (
            <button
              key={color}
              type="button"
              className="rte-float-btn rte-float-swatch"
              style={{ background: color }}
              onMouseDown={(e) => { e.preventDefault(); applyFormat('hiliteColor', color) }}
              title={`ไฮไลท์${label}`}
              aria-label={`ไฮไลท์${label}`}
            />
          ))}
          <button
            type="button"
            className="rte-float-btn rte-float-clear"
            onMouseDown={(e) => { e.preventDefault(); applyFormat('hiliteColor', 'transparent') }}
            title="ลบไฮไลท์" aria-label="ลบไฮไลท์"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
