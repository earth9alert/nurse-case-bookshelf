import { useCallback, useEffect, useRef, useState } from 'react'
import type { AnatomyImage } from '../types/case'

interface AnatomyGalleryProps {
  images: AnatomyImage[]
  title?: string
}

export function AnatomyGallery({ images, title }: AnatomyGalleryProps) {
  const [lightbox, setLightbox] = useState<AnatomyImage | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const pointerStart = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  const openLightbox = (image: AnatomyImage) => {
    setLightbox(image)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const closeLightbox = useCallback(() => {
    setLightbox(null)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    pointerStart.current = null
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

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom === 1) return
    pointerStart.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    if (!start || start.pointerId !== e.pointerId) return
    setPan((current) => ({
      x: current.x + e.clientX - start.x,
      y: current.y + e.clientY - start.y,
    }))
    pointerStart.current = { ...start, x: e.clientX, y: e.clientY }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStart.current?.pointerId !== e.pointerId) return
    pointerStart.current = null
    setDragging(false)
  }

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    changeZoom(e.deltaY < 0 ? 0.15 : -0.15)
  }, [changeZoom])

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
              className={`anatomy-lightbox__viewport${zoom > 1 ? ' is-zoomed' : ''}${dragging ? ' is-dragging' : ''}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <img
                src={lightbox.imageUrl}
                alt={lightbox.caption || 'รูป anatomy'}
                draggable={false}
                style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
              />
            </div>
            <div className="anatomy-lightbox__zoom-controls" role="group" aria-label="ควบคุมการซูมรูปภาพ">
              <button
                type="button"
                onClick={() => changeZoom(-0.25)}
                disabled={zoom === 1}
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
                disabled={zoom === 3}
                aria-label="ขยายรูปภาพ"
              >
                +
              </button>
              <button
                type="button"
                className="anatomy-lightbox__reset"
                onClick={resetZoom}
                disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
              >
                พอดีจอ
              </button>
            </div>
            {lightbox.caption && (
              <figcaption id="lightbox-caption">{lightbox.caption}</figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  )
}
