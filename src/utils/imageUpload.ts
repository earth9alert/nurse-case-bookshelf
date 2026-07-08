const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_INPUT_MB = 10
const MAX_WIDTH = 1400
const JPEG_QUALITY = 0.82

export function isAcceptedImage(file: File) {
  return ACCEPTED_TYPES.includes(file.type)
}

export async function processImageFile(file: File): Promise<string> {
  try {
    if (!isAcceptedImage(file)) {
      throw new Error('รองรับเฉพาะไฟล์ JPG, PNG, WebP หรือ GIF')
    }
    if (file.size > MAX_INPUT_MB * 1024 * 1024) {
      throw new Error(`ไฟล์ใหญ่เกิน ${MAX_INPUT_MB} MB`)
    }

    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_WIDTH / bitmap.width)
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('ไม่สามารถประมวลผลรูปได้')

    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    // Always re-encode to JPEG (strips metadata, flattens animation)
    // PNG source stays as PNG to preserve transparency
    const dataUrl =
      file.type === 'image/png'
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', JPEG_QUALITY)

    return dataUrl
  } catch (err) {
    const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผลรูป'
    console.error('[imageUpload]', err)
    throw new Error(message)
  }
}
