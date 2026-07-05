import { useCallback, useEffect, useRef } from 'react'

interface RichTextEditorProps {
  value: string          // HTML string
  onChange: (html: string) => void
  placeholder?: string
  rows?: number
  id?: string
}

type FormatCommand = 'bold' | 'underline' | 'hiliteColor' | 'removeFormat'

const HIGHLIGHT_COLOR = '#fff176'   // soft yellow
const HIGHLIGHT_COLORS = [
  { color: '#fff176', label: 'เหลือง' },
  { color: '#b9f6ca', label: 'เขียว' },
  { color: '#ffd6e0', label: 'ชมพู' },
  { color: '#bbdefb', label: 'ฟ้า' },
  { color: '#ffe0b2', label: 'ส้ม' },
]

function execCmd(cmd: FormatCommand, value?: string) {
  document.execCommand(cmd, false, value)
}

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={`rte-btn ${active ? 'rte-btn--active' : ''}`}
      onMouseDown={(e) => {
        e.preventDefault()   // prevent editor losing focus
        onClick()
      }}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ value, onChange, placeholder, rows = 4, id }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isComposing = useRef(false)
  const skipNextSync = useRef(false)

  // Sync external value → DOM (only on initial mount or programmatic change)
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value
    }
  }, [value])

  const handleInput = useCallback(() => {
    if (isComposing.current) return
    const el = editorRef.current
    if (!el) return
    skipNextSync.current = true
    onChange(el.innerHTML)
  }, [onChange])

  const handleCompositionStart = () => { isComposing.current = true }
  const handleCompositionEnd = () => {
    isComposing.current = false
    handleInput()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    // Paste plain text only to avoid external HTML injection
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  const queryActive = (cmd: string) => {
    try { return document.queryCommandState(cmd) } catch { return false }
  }

  const minHeight = `${rows * 1.65 * 16}px`

  return (
    <div className="rte-wrapper">
      <div className="rte-toolbar" role="toolbar" aria-label="จัดรูปแบบข้อความ">
        <ToolbarBtn
          onClick={() => execCmd('bold')}
          active={queryActive('bold')}
          title="ตัวหนา (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarBtn>

        <ToolbarBtn
          onClick={() => execCmd('underline')}
          active={queryActive('underline')}
          title="ขีดเส้นใต้ (Ctrl+U)"
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </ToolbarBtn>

        {/* Highlight color picker */}
        <div className="rte-highlight-group" role="group" aria-label="ไฮไลท์">
          <ToolbarBtn
            onClick={() => execCmd('hiliteColor', HIGHLIGHT_COLOR)}
            title="ไฮไลท์เหลือง"
          >
            <span className="rte-highlight-icon">
              <span style={{ background: HIGHLIGHT_COLOR }}>A</span>
            </span>
          </ToolbarBtn>
          <div className="rte-color-swatches">
            {HIGHLIGHT_COLORS.map(({ color, label }) => (
              <button
                key={color}
                type="button"
                className="rte-swatch"
                style={{ background: color }}
                onMouseDown={(e) => { e.preventDefault(); execCmd('hiliteColor', color) }}
                title={`ไฮไลท์${label}`}
                aria-label={`ไฮไลท์${label}`}
              />
            ))}
            <button
              type="button"
              className="rte-swatch rte-swatch--clear"
              onMouseDown={(e) => { e.preventDefault(); execCmd('hiliteColor', 'transparent') }}
              title="ลบไฮไลท์"
              aria-label="ลบไฮไลท์"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="rte-divider" aria-hidden="true" />

        <ToolbarBtn
          onClick={() => execCmd('removeFormat')}
          title="ลบการจัดรูปแบบทั้งหมด"
        >
          <span style={{ fontSize: '0.75rem', letterSpacing: '-0.5px' }}>A̶</span>
        </ToolbarBtn>
      </div>

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
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onPaste={handlePaste}
        data-placeholder={placeholder}
      />
    </div>
  )
}
