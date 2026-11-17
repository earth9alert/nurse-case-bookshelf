import { useCallback, useEffect, useRef, useState } from 'react'
import type { HandwritingPoint, HandwritingStroke, HandwritingTool } from '../types/case'
import type { ReactNode } from 'react'
import { HANDWRITING_PEN_COLORS } from '../utils/handwriting'

interface HandwritingPadProps {
  strokes: HandwritingStroke[]
  onChange: (strokes: HandwritingStroke[]) => void
  isActive: boolean
  children: ReactNode
}

interface ActiveStroke {
  pointerId: number
  stroke: HandwritingStroke
}

interface HandwritingCanvasProps {
  strokes: HandwritingStroke[]
  onChange: (strokes: HandwritingStroke[]) => void
  isActive: boolean
  tool: HandwritingTool
  color: string
  surfaceClassName?: string
  children: ReactNode
}

interface HandwritingToolbarProps {
  tool: HandwritingTool
  color: string
  strokeCount: number
  onToolChange: (tool: HandwritingTool) => void
  onColorChange: (color: string) => void
  onUndo: () => void
  onClear: () => void
}

function drawStroke(
  context: CanvasRenderingContext2D,
  stroke: HandwritingStroke,
  width: number,
  height: number,
) {
  const firstPoint = stroke.points[0]
  if (!firstPoint) return

  context.save()
  context.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
  context.strokeStyle = stroke.color
  context.fillStyle = stroke.color
  context.lineWidth = stroke.width * width
  context.lineCap = 'round'
  context.lineJoin = 'round'

  if (stroke.points.length === 1) {
    context.beginPath()
    context.arc(firstPoint.x * width, firstPoint.y * height, context.lineWidth / 2, 0, Math.PI * 2)
    context.fill()
  } else {
    context.beginPath()
    context.moveTo(firstPoint.x * width, firstPoint.y * height)
    for (let index = 1; index < stroke.points.length; index += 1) {
      const point = stroke.points[index]
      if (point) context.lineTo(point.x * width, point.y * height)
    }
    context.stroke()
  }
  context.restore()
}

function getPoint(event: React.PointerEvent<HTMLCanvasElement>): HandwritingPoint {
  const rect = event.currentTarget.getBoundingClientRect()
  return {
    x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
    y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
  }
}

export function HandwritingCanvas({
  strokes,
  onChange,
  isActive,
  tool,
  color,
  surfaceClassName = '',
  children,
}: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeStrokeRef = useRef<ActiveStroke | null>(null)
  const [canvasError, setCanvasError] = useState(false)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return

    const pixelRatio = window.devicePixelRatio || 1
    const pixelWidth = Math.round(width * pixelRatio)
    const pixelHeight = Math.round(height * pixelRatio)
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth
      canvas.height = pixelHeight
    }

    const context = canvas.getContext('2d')
    if (!context) {
      setCanvasError(true)
      return
    }
    setCanvasError(false)
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    context.clearRect(0, 0, width, height)
    strokes.forEach((stroke) => drawStroke(context, stroke, width, height))
  }, [strokes])

  useEffect(() => {
    redraw()
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(redraw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [isActive, redraw])

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!event.isPrimary || activeStrokeRef.current) return
    event.preventDefault()
    event.stopPropagation()

    const point = getPoint(event)
    const nextStroke: HandwritingStroke = {
      tool,
      color,
      width: tool === 'eraser' ? 0.03 : 0.004,
      points: [point],
    }
    const canvas = event.currentTarget
    const context = canvas.getContext('2d')
    if (!context) {
      setCanvasError(true)
      return
    }

    activeStrokeRef.current = { pointerId: event.pointerId, stroke: nextStroke }
    canvas.setPointerCapture(event.pointerId)
    drawStroke(context, nextStroke, canvas.clientWidth, canvas.clientHeight)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const active = activeStrokeRef.current
    if (!active || active.pointerId !== event.pointerId) return
    event.preventDefault()
    event.stopPropagation()

    const nextPoint = getPoint(event)
    const points = active.stroke.points
    const lastPoint = points[points.length - 1]
    if (!lastPoint) return

    const canvas = event.currentTarget
    const distance = Math.hypot(
      (nextPoint.x - lastPoint.x) * canvas.clientWidth,
      (nextPoint.y - lastPoint.y) * canvas.clientHeight,
    )
    if (distance < 1.5) return

    points.push(nextPoint)
    const context = event.currentTarget.getContext('2d')
    if (!context) {
      setCanvasError(true)
      return
    }
    drawStroke(context, { ...active.stroke, points: [lastPoint, nextPoint] }, canvas.clientWidth, canvas.clientHeight)
  }

  const finishStroke = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const active = activeStrokeRef.current
    if (!active || active.pointerId !== event.pointerId) return
    event.preventDefault()
    event.stopPropagation()
    activeStrokeRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    onChange([...strokes, active.stroke])
  }

  return (
    <>
      <div className={`handwriting-pad__surface ${surfaceClassName}`}>
        {children}
        {(isActive || strokes.length > 0) && (
          <canvas
            ref={canvasRef}
            className={`handwriting-pad__canvas${isActive ? ' is-active' : ''}`}
            aria-label={isActive ? 'เขียนบันทึกด้วย Apple Pencil หรือสัมผัส' : 'บันทึกลายมือ'}
            aria-hidden={!isActive}
            tabIndex={isActive ? 0 : -1}
            onPointerDown={isActive ? handlePointerDown : undefined}
            onPointerMove={isActive ? handlePointerMove : undefined}
            onPointerUp={isActive ? finishStroke : undefined}
            onPointerCancel={isActive ? finishStroke : undefined}
          />
        )}
      </div>
      {canvasError && isActive && (
        <p className="handwriting-pad__error" role="alert">
          อุปกรณ์นี้ไม่สามารถเปิดพื้นที่เขียนได้
        </p>
      )}
    </>
  )
}

export function HandwritingToolbar({
  tool,
  color,
  strokeCount,
  onToolChange,
  onColorChange,
  onUndo,
  onClear,
}: HandwritingToolbarProps) {
  return (
    <div className="handwriting-pad__toolbar" role="toolbar" aria-label="เครื่องมือเขียนบันทึก">
      <button
        type="button"
        className={tool === 'pen' ? 'is-active' : ''}
        aria-pressed={tool === 'pen'}
        onClick={() => onToolChange('pen')}
      >
        ✎ ปากกา
      </button>
      <div className="handwriting-pad__colors" role="group" aria-label="สีปากกา">
        {HANDWRITING_PEN_COLORS.map((penColor) => (
          <button
            key={penColor.color}
            type="button"
            className={`handwriting-pad__color${color === penColor.color ? ' is-active' : ''}`}
            style={{ '--pen-color': penColor.color } as React.CSSProperties}
            aria-label={`สี${penColor.label}`}
            aria-pressed={color === penColor.color}
            onClick={() => onColorChange(penColor.color)}
          />
        ))}
      </div>
      <button
        type="button"
        className={tool === 'eraser' ? 'is-active' : ''}
        aria-pressed={tool === 'eraser'}
        onClick={() => onToolChange('eraser')}
      >
        ▱ ยางลบ
      </button>
      <button
        type="button"
        onClick={onUndo}
        disabled={strokeCount === 0}
        aria-label="เลิกทำ"
      >
        ↶ เลิกทำ
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={strokeCount === 0}
      >
        ล้างทั้งหมด
      </button>
      <span className="handwriting-pad__autosave">บันทึกอัตโนมัติ</span>
    </div>
  )
}

export function HandwritingPad({ strokes, onChange, isActive, children }: HandwritingPadProps) {
  const [tool, setTool] = useState<HandwritingTool>('pen')
  const [color, setColor] = useState(HANDWRITING_PEN_COLORS[0].color)

  const clearAll = () => {
    if (strokes.length === 0 || !window.confirm('ล้างบันทึกลายมือทั้งหมดในหัวข้อนี้หรือไม่?')) return
    onChange([])
  }

  return (
    <div className="handwriting-pad">
      {isActive && (
        <HandwritingToolbar
          tool={tool}
          color={color}
          strokeCount={strokes.length}
          onToolChange={setTool}
          onColorChange={(nextColor) => {
            setColor(nextColor)
            setTool('pen')
          }}
          onUndo={() => onChange(strokes.slice(0, -1))}
          onClear={clearAll}
        />
      )}
      <HandwritingCanvas
        strokes={strokes}
        onChange={onChange}
        isActive={isActive}
        tool={tool}
        color={color}
      >
        {children}
      </HandwritingCanvas>
      {isActive && (
        <p className="handwriting-pad__hint">
          เขียนทับบนเนื้อหาได้เลย · ปิดโหมดเขียนเพื่อกลับมาเลื่อนอ่าน
        </p>
      )}
    </div>
  )
}
