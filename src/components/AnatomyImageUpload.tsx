import { useRef, useState } from 'react'
import type { AnatomyImage } from '../types/case'
import { MAX_IMAGES_PER_CASE, processImageFile } from '../utils/imageUpload'

interface AnatomyImageUploadProps {
  images: AnatomyImage[]
  onChange: (images: AnatomyImage[]) => void
}

export function AnatomyImageUpload({ images, onChange }: AnatomyImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setError(null)
    setLoading(true)

    try {
      const next = [...images]
      const remaining = MAX_IMAGES_PER_CASE - next.length
      if (remaining <= 0) {
        setError(`อัปโหลดได้สูงสุด ${MAX_IMAGES_PER_CASE} รูปต่อเคส`)
        return
      }

      const filesToProcess = Array.from(files).slice(0, remaining)
      if (filesToProcess.length < files.length) {
        setError(
          `อัปโหลดได้อีก ${remaining} รูปเท่านั้น (สูงสุด ${MAX_IMAGES_PER_CASE} รูปต่อเคส) — เพิ่มแค่ ${filesToProcess.length} รูปแรก`,
        )
      }

      for (const file of filesToProcess) {
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
          {loading ? 'กำลังอัปโหลด...' : '📷 อัปโหลดรูป Anatomy'}
        </button>
        <span className="anatomy-upload__hint">JPG, PNG, WebP, GIF — บีบอัดอัตโนมัติ</span>
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
              <img src={img.dataUrl} alt={img.caption || 'รูป anatomy'} />
              <input
                type="text"
                value={img.caption}
                onChange={(e) => updateCaption(img.id, e.target.value)}
                placeholder="คำอธิบายรูป (เช่น Calot's triangle)"
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
