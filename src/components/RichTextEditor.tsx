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
  { color: '#e1bee7', label: 'ม่วง' },
  { color: '#b2ebf2', label: 'ฟ้าอมเขียว' },
  { color: '#f8bbd9', label: 'ชมพูเข้ม' },
  { color: '#dcedc8', label: 'เขียวอ่อน' },
  { color: '#ffccbc', label: 'แซลมอน' },
  { color: '#fff9c4', label: 'เหลืองอ่อน' },
  { color: '#cfd8dc', label: 'เทา' },
]

function execCmd(cmd: string, value?: string) {
  document.execCommand(cmd, false, value)
}

interface FloatingToolbarPos {
  top: number
  left: number
}

export function RichTextEditor({ value, onChange, placeholder, rows = 4, id }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const isComposing = useRef(false)
  const skipNextSync = useRef(false)

  const [floatPos, setFloatPos] = useState<FloatingToolbarPos | null>(null)
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

  // Show/hide floating toolbar based on selection
  const updateFloatingToolbar = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      setFloatPos(null)
      setHasSelection(false)
      return
    }

    // Only show if selection is inside our editor
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const range = sel.getRangeAt(0)
    const ancestor = range.commonAncestorContainer
    if (!wrapper.contains(ancestor)) {
      setFloatPos(null)
      setHasSelection(false)
      return
    }

    const rect = range.getBoundingClientRect()
    const wrapRect = wrapper.getBoundingClientRect()

    // Position above the selection, centered
    const top = rect.top - wrapRect.top - 48   // 48px toolbar height + gap
    const left = rect.left - wrapRect.left + rect.width / 2

    setFloatPos({ top, left })
    setHasSelection(true)
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', updateFloatingToolbar)
    return () => document.removeEventListener('selectionchange', updateFloatingToolbar)
  }, [updateFloatingToolbar])

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  const applyFormat = (cmd: string, value?: string) => {
    editorRef.current?.focus()
    execCmd(cmd, value)
    handleInput()
    // Keep toolbar visible briefly after applying
    setTimeout(updateFloatingToolbar, 50)
  }

  const queryActive = (cmd: string) => {
    try { return document.queryCommandState(cmd) } catch { return false }
  }

  const minHeight = `${rows * 1.65 * 16}px`

  return (
    <div className="rte-wrapper" ref={wrapperRef}>

      {/* Static top toolbar — B, U, clear only */}
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
        <button
          type="button"
          className="rte-btn"
          onMouseDown={(e) => { e.preventDefault(); applyFormat('removeFormat') }}
          title="ลบการจัดรูปแบบ" aria-label="ลบการจัดรูปแบบ"
        >
          <span style={{ fontSize: '0.75rem' }}>A̶</span>
        </button>
        <div className="rte-toolbar-hint">
          เลือกข้อความเพื่อไฮไลท์ 🎨
        </div>
      </div>

      {/* Editor */}
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
        onPaste={handlePaste}
        data-placeholder={placeholder}
      />

      {/* Floating toolbar — appears above selected text */}
      {hasSelection && floatPos && (
        <div
          className="rte-float-toolbar"
          style={{
            top: Math.max(4, floatPos.top),
            left: floatPos.left,
          }}
          role="toolbar"
          aria-label="ไฮไลท์สี"
          // Prevent mousedown from collapsing selection
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* B and U inline too for convenience */}
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

          {/* Color swatches */}
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

          {/* Clear highlight */}
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
