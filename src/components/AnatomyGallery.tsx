import { useCallback, useEffect, useState } from 'react'
import type { AnatomyImage } from '../types/case'

interface AnatomyGalleryProps {
  images: AnatomyImage[]
}

export function AnatomyGallery({ images }: AnatomyGalleryProps) {
  const [lightbox, setLightbox] = useState<AnatomyImage | null>(null)

  const closeLightbox = useCallback(() => setLightbox(null), [])

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
        <h3>รูประบบ Anatomy</h3>
        <div className="anatomy-gallery__grid">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              className="anatomy-gallery__item"
              onClick={() => setLightbox(img)}
              aria-label={img.caption ? `ดูรูป: ${img.caption}` : 'ดูรูป anatomy ขนาดใหญ่'}
            >
              <img src={img.dataUrl} alt={img.caption || 'รูป anatomy'} loading="lazy" />
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
            <img src={lightbox.dataUrl} alt={lightbox.caption || 'รูป anatomy'} />
            {lightbox.caption && (
              <figcaption id="lightbox-caption">{lightbox.caption}</figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  )
}
