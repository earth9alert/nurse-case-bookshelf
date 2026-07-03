import { useRef, useState } from 'react'
import type { AnatomyImage } from '../types/case'
import { processImageFile } from '../utils/imageUpload'

interface AnatomyImageUploadProps {
  images: AnatomyImage[]
  label?: string
  onChange: (images: AnatomyImage[]) => void
}

export function AnatomyImageUpload({ images, label = '📷 อัปโหลดรูป', onChange }: AnatomyImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setError(null)
    setLoading(true)

    try {
      const next = [...images]
      for (const file of Array.from(files)) {
        const dataUrl = await processImageFile(file)
        next.push({
          id: crypto.randomUUID(),
          caption: file.name.replace(/\.[^.]+$/, ''),
          dataUrl,
        })
      }
      onChange(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปโหลดไม่สำเร็จ')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const updateCaption = (id: string, caption: string) => {
    onChange(images.map((img) => (img.id === id ? { ...img, caption } : img)))
  }

  const removeImage = (id: string) => {
    onChange(images.filter((img) => img.id !== id))
  }

  return (
    <div className="anatomy-upload">
      <div className="anatomy-upload__toolbar">
        <button
          type="button"
          className="btn-upload"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? 'กำลังอัปโหลด...' : label}
        </button>
        <span className="anatomy-upload__hint">
          JPG, PNG, WebP, GIF · บีบอัดอัตโนมัติ
          {images.length > 0 && ` · ${images.length} รูป`}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="anatomy-upload__error">{error}</p>}

      {images.length > 0 && (
        <ul className="anatomy-upload__list">
          {images.map((img) => (
            <li key={img.id} className="anatomy-upload__item">
              <img src={img.dataUrl} alt={img.caption || 'รูป'} />
              <input
                type="text"
                value={img.caption}
                onChange={(e) => updateCaption(img.id, e.target.value)}
                placeholder="คำอธิบายรูป"
              />
              <button type="button" className="btn-remove-image" onClick={() => removeImage(img.id)}>
                ลบรูป
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
