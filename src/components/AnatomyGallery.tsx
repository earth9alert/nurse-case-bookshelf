import { useCallback, useEffect, useRef, useState } from 'react'
import type { AnatomyImage, HandwritingTool } from '../types/case'
import { HANDWRITING_PEN_COLORS } from '../utils/handwriting'
import {
  HandwritingCanvas,
  HandwritingToolbar,
} from './HandwritingPad'

interface AnatomyGalleryProps {
  images: AnatomyImage[]
  title?: string
  onUpdateImage: (image: AnatomyImage) => void
}

interface PointerPosition {
  x: number
  y: number
}

interface PinchStart {
  distance: number
  zoom: number
  pan: PointerPosition
  midpoint: PointerPosition
}

export function AnatomyGallery({ images, title, onUpdateImage }: AnatomyGalleryProps) {
  const [lightbox, setLightbox] = useState<AnatomyImage | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [imageWriting, setImageWriting] = useState(false)
  const [tool, setTool] = useState<HandwritingTool>('pen')
  const [penColor, setPenColor] = useState(HANDWRITING_PEN_COLORS[0].color)
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const pointerStart = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const activePointers = useRef(new Map<number, PointerPosition>())
  const pinchStart = useRef<PinchStart | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  const openLightbox = (image: AnatomyImage) => {
    setLightbox(image)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setNaturalSize(null)
    setImageWriting(false)
  }

  const closeLightbox = useCallback(() => {
    setLightbox(null)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setImageWriting(false)
    setNaturalSize(null)
    pointerStart.current = null
    activePointers.current.clear()
    pinchStart.current = null
    setDragging(false)
  }, [])

  const changeZoom = useCallback((amount: number) => {
    const nextZoom = Math.min(3, Math.max(1, Number((zoom + amount).toFixed(2))))
    setZoom(nextZoom)
    if (nextZoom === 1) setPan({ x: 0, y: 0 })
  }, [zoom])

  const resetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const beginPinch = () => {
    const [first, second] = [...activePointers.current.values()]
    if (!first || !second) return
    pinchStart.current = {
      distance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
      zoom,
      pan,
      midpoint: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
    }
    pointerStart.current = null
    setDragging(true)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (imageWriting) return
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    e.currentTarget.setPointerCapture(e.pointerId)
    if (activePointers.current.size >= 2) {
      if (!pinchStart.current) beginPinch()
      return
    }
    if (zoom > 1) {
      pointerStart.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY }
      setDragging(true)
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (imageWriting) return
    const pointers = activePointers.current
    if (!pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const pinch = pinchStart.current
    if (pinch && pointers.size >= 2) {
      const [first, second] = [...pointers.values()]
      if (!first || !second) return
      const distance = Math.hypot(second.x - first.x, second.y - first.y)
      const nextZoom = Math.min(3, Math.max(1, Number((pinch.zoom * distance / pinch.distance).toFixed(2))))
      setZoom(nextZoom)
      if (nextZoom === 1) {
        setPan({ x: 0, y: 0 })
        return
      }

      const viewport = viewportRef.current?.getBoundingClientRect()
      if (!viewport) return
      const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
      const centerX = viewport.left + viewport.width / 2
      const centerY = viewport.top + viewport.height / 2
      setPan({
        x: midpoint.x - centerX - ((pinch.midpoint.x - centerX - pinch.pan.x) / pinch.zoom) * nextZoom,
        y: midpoint.y - centerY - ((pinch.midpoint.y - centerY - pinch.pan.y) / pinch.zoom) * nextZoom,
      })
      return
    }

    const start = pointerStart.current
    if (!start || start.pointerId !== e.pointerId) return
    setPan((current) => ({
      x: current.x + e.clientX - start.x,
      y: current.y + e.clientY - start.y,
    }))
    pointerStart.current = { ...start, x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointers.current.delete(e.pointerId)
    pinchStart.current = null
    pointerStart.current = null

    if (activePointers.current.size >= 2) {
      beginPinch()
      return
    }
    if (activePointers.current.size === 1 && zoom > 1) {
      const [pointerId, position] = [...activePointers.current.entries()][0] ?? []
      if (pointerId !== undefined && position) {
        pointerStart.current = { pointerId, ...position }
        setDragging(true)
        return
      }
    }
    setDragging(false)
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    if (imageWriting) return
    changeZoom(e.deltaY < 0 ? 0.15 : -0.15)
  }, [changeZoom, imageWriting])

  useEffect(() => {
    if (!lightbox) return
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [lightbox, handleWheel])

  useEffect(() => {
    if (!lightbox) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [lightbox, closeLightbox])

  useEffect(() => {
    if (!lightbox) return
    const viewport = viewportRef.current
    if (!viewport) return
    const updateSize = () => setViewportSize({
      width: viewport.clientWidth,
      height: viewport.clientHeight,
    })
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [lightbox])

  const imageScale = naturalSize && viewportSize.width > 0 && viewportSize.height > 0
    ? Math.min(viewportSize.width / naturalSize.width, viewportSize.height / naturalSize.height)
    : 1
  const fittedSize = naturalSize && viewportSize.width > 0 && viewportSize.height > 0
    ? { width: naturalSize.width * imageScale, height: naturalSize.height * imageScale }
    : null

  const updateImageAnnotations = (annotations: AnatomyImage['annotations']) => {
    if (!lightbox) return
    const updatedImage = { ...lightbox, annotations }
    setLightbox(updatedImage)
    onUpdateImage(updatedImage)
  }

  if (images.length === 0) return null

  return (
    <>
      <div className="anatomy-gallery">
        {title && <h3>{title}</h3>}
        <div className="anatomy-gallery__grid">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              className="anatomy-gallery__item"
              onClick={() => openLightbox(img)}
              aria-label={img.caption ? `ดูรูป: ${img.caption}` : 'ดูรูป anatomy ขนาดใหญ่'}
            >
              <img src={img.imageUrl} alt={img.caption || 'รูป anatomy'} loading="lazy" />
              {img.caption && <span>{img.caption}</span>}
            </button>
          ))}
        </div>
      </div>

      {lightbox && (
        <div
          className="anatomy-lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-caption"
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="anatomy-lightbox__close"
            onClick={closeLightbox}
            aria-label="ปิด"
          >
            ✕
          </button>
          <figure onClick={(e) => e.stopPropagation()}>
            <div
              ref={viewportRef}
              className={`anatomy-lightbox__viewport${zoom > 1 && !imageWriting ? ' is-zoomed' : ''}${dragging ? ' is-dragging' : ''}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div
                className="anatomy-lightbox__image-layer"
                style={{
                  width: fittedSize?.width ?? '100%',
                  height: fittedSize?.height ?? '100%',
                  left: `calc(50% + ${pan.x}px)`,
                  top: `calc(50% + ${pan.y}px)`,
                  transform: `translate(-50%, -50%) scale(${zoom})`,
                }}
              >
                <HandwritingCanvas
                  strokes={lightbox.annotations ?? []}
                  onChange={updateImageAnnotations}
                  isActive={imageWriting}
                  tool={tool}
                  color={penColor}
                  surfaceClassName="handwriting-pad__surface--image"
                >
                  <img
                    className="anatomy-lightbox__image"
                    src={lightbox.imageUrl}
                    alt={lightbox.caption || 'รูป anatomy'}
                    draggable={false}
                    onLoad={(event) => {
                      setNaturalSize({
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight,
                      })
                    }}
                  />
                </HandwritingCanvas>
              </div>
            </div>
            <div className="anatomy-lightbox__zoom-controls" role="group" aria-label="ควบคุมการซูมรูปภาพ">
              <button
                type="button"
                onClick={() => changeZoom(-0.25)}
                disabled={zoom === 1 || imageWriting}
                aria-label="ย่อรูปภาพ"
              >
                −
              </button>
              <output aria-live="polite" aria-label="ระดับการซูม">
                {Math.round(zoom * 100)}%
              </output>
              <button
                type="button"
                onClick={() => changeZoom(0.25)}
                disabled={zoom === 3 || imageWriting}
                aria-label="ขยายรูปภาพ"
              >
                +
              </button>
              <button
                type="button"
                className="anatomy-lightbox__reset"
                onClick={resetZoom}
                disabled={imageWriting || (zoom === 1 && pan.x === 0 && pan.y === 0)}
              >
                พอดีจอ
              </button>
              <button
                type="button"
                className={imageWriting ? 'is-annotating' : ''}
                aria-pressed={imageWriting}
                onClick={() => setImageWriting((active) => !active)}
              >
                {imageWriting ? '✓ ปิดโหมดเขียน' : '✎ เขียนบนรูป'}
              </button>
            </div>
            {imageWriting && (
              <div className="anatomy-lightbox__annotation-tools">
                <HandwritingToolbar
                  tool={tool}
                  color={penColor}
                  strokeCount={lightbox.annotations?.length ?? 0}
                  onToolChange={setTool}
                  onColorChange={(nextColor) => {
                    setPenColor(nextColor)
                    setTool('pen')
                  }}
                  onUndo={() => updateImageAnnotations((lightbox.annotations ?? []).slice(0, -1))}
                  onClear={() => {
                    if (
                      lightbox.annotations?.length &&
                      window.confirm('ล้างบันทึกลายมือทั้งหมดบนรูปนี้หรือไม่?')
                    ) {
                      updateImageAnnotations([])
                    }
                  }}
                />
              </div>
            )}
            {lightbox.caption && (
              <figcaption id="lightbox-caption">{lightbox.caption}</figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  )
}
