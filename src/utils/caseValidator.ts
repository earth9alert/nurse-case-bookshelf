import type { AnatomyImage, SurgicalCase } from '../types/case'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/
const DATA_IMAGE_RE = /^data:image\/(jpeg|png|webp|gif);base64,/

export function isValidDataUrl(value: unknown): value is string {
  return typeof value === 'string' && DATA_IMAGE_RE.test(value)
}

export function isValidColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_RE.test(value)
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function validateAnatomyImage(img: unknown): AnatomyImage | null {
  if (typeof img !== 'object' || img === null) return null
  const o = img as Record<string, unknown>
  if (typeof o.id !== 'string' || !o.id) return null
  if (typeof o.caption !== 'string') return null
  if (!isValidDataUrl(o.dataUrl)) return null
  return { id: o.id, caption: o.caption, dataUrl: o.dataUrl }
}

export function validateCase(raw: unknown): SurgicalCase | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>

  if (typeof o.id !== 'string' || !o.id) return null
  if (typeof o.title !== 'string' || !o.title.trim()) return null
  if (typeof o.subtitle !== 'string') return null
  if (!isValidColor(o.color)) return null

  const eq = o.equipment as Record<string, unknown> | undefined
  if (typeof eq !== 'object' || eq === null) return null
  if (!isStringArray(eq.store)) return null
  if (!isStringArray(eq.room)) return null
  if (!isStringArray(eq.basket)) return null

  const rawImages = Array.isArray(o.anatomyImages) ? o.anatomyImages : []
  const anatomyImages = (rawImages as unknown[])
    .map(validateAnatomyImage)
    .filter((img): img is AnatomyImage => img !== null)

  return {
    id: o.id,
    title: o.title,
    subtitle: typeof o.subtitle === 'string' ? o.subtitle : '',
    color: o.color as string,
    dx: typeof o.dx === 'string' ? o.dx : '',
    operation: typeof o.operation === 'string' ? o.operation : '',
    anatomy: typeof o.anatomy === 'string' ? o.anatomy : '',
    anatomyImages,
    roomSetup: typeof o.roomSetup === 'string' ? o.roomSetup : '',
    equipment: {
      store: eq.store as string[],
      room: eq.room as string[],
      basket: eq.basket as string[],
    },
    positioning: typeof o.positioning === 'string' ? o.positioning : '',
    draping: typeof o.draping === 'string' ? o.draping : '',
    steps: isStringArray(o.steps) ? o.steps : [],
  }
}
