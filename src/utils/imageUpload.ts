const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_INPUT_MB = 10
const MAX_WIDTH = 1400
const JPEG_QUALITY = 0.82
const MAX_IMAGES_PER_SECTION = 20

// Magic bytes for file type validation
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
  'image/gif': [[0x47, 0x49, 0x46, 0x38]], // GIF8
}

async function verifyFileSignature(file: File): Promise<boolean> {
  const signatures = FILE_SIGNATURES[file.type]
  if (!signatures) return false

  try {
    const buffer = await file.slice(0, 12).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    return signatures.some((signature) =>
      signature.every((byte, i) => bytes[i] === byte)
    )
  } catch {
    return false
  }
}

export function isAcceptedImage(file: File) {
  return ACCEPTED_TYPES.includes(file.type)
}

export function canAddMoreImages(currentCount: number): boolean {
  return currentCount < MAX_IMAGES_PER_SECTION
}

export async function processImageFile(file: File): Promise<string> {
  try {
    if (!isAcceptedImage(file)) {
      throw new Error('รองรับเฉพาะไฟล์ JPG, PNG, WebP หรือ GIF')
    }
    if (file.size > MAX_INPUT_MB * 1024 * 1024) {
      throw new Error(`ไฟล์ใหญ่เกิน ${MAX_INPUT_MB} MB`)
    }

    // Verify file signature (magic bytes)
    const isValidSignature = await verifyFileSignature(file)
    if (!isValidSignature) {
      throw new Error('ไฟล์ไม่ถูกต้อง — ไม่ใช่ไฟล์รูปภาพจริง')
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
