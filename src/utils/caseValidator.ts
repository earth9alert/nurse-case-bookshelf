import type { AnatomyImage, SectionImages, SectionKey, SurgicalCase } from '../types/case'
import { UNCATEGORIZED_ID } from '../types/case'

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

function validateImageArray(raw: unknown): AnatomyImage[] {
  if (!Array.isArray(raw)) return []
  return (raw as unknown[])
    .map(validateAnatomyImage)
    .filter((img): img is AnatomyImage => img !== null)
}

const SECTION_KEYS: SectionKey[] = [
  'dx', 'operation', 'anatomy', 'roomSetup',
  'equipment', 'positioning', 'draping', 'steps',
]

export function validateCase(raw: unknown): SurgicalCase | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>

  if (typeof o.id !== 'string' || !o.id) return null
  if (typeof o.title !== 'string' || !o.title.trim()) return null
  if (!isValidColor(o.color)) return null

  const eq = o.equipment as Record<string, unknown> | undefined
  if (typeof eq !== 'object' || eq === null) return null
  if (!isStringArray(eq.store)) return null
  if (!isStringArray(eq.room)) return null
  if (!isStringArray(eq.basket)) return null

  // ── Migrate old per-field images → new images map ──────────────────────
  const rawImages = typeof o.images === 'object' && o.images !== null
    ? o.images as Record<string, unknown>
    : {}

  const images: SectionImages = {}
  for (const key of SECTION_KEYS) {
    const fromNew = rawImages[key]
    images[key] = validateImageArray(fromNew)
  }

  // Back-compat: lift old flat fields into images map if new map is empty
  if (!images.anatomy?.length) {
    const legacy = validateImageArray(o.anatomyImages)
    if (legacy.length) images.anatomy = legacy
  }
  if (!images.roomSetup?.length) {
    const legacy = validateImageArray(o.roomSetupImages)
    if (legacy.length) images.roomSetup = legacy
  }
  if (!images.draping?.length) {
    const legacy = validateImageArray(o.drapingImages)
    if (legacy.length) images.draping = legacy
  }

  // Migrate steps: string[] → rich text HTML
  let steps: string
  if (typeof o.steps === 'string') {
    steps = o.steps
  } else if (Array.isArray(o.steps) && o.steps.every((s) => typeof s === 'string')) {
    // Convert old array to numbered HTML list
    steps = (o.steps as string[])
      .map((s, i) => `<p>${i + 1}. ${s}</p>`)
      .join('')
  } else {
    steps = ''
  }

  return {
    id: o.id,
    categoryId: typeof o.categoryId === 'string' && o.categoryId ? o.categoryId : UNCATEGORIZED_ID,
    title: o.title,
    subtitle: typeof o.subtitle === 'string' ? o.subtitle : '',
    color: o.color as string,
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
    dx: typeof o.dx === 'string' ? o.dx : '',
    operation: typeof o.operation === 'string' ? o.operation : '',
    anatomy: typeof o.anatomy === 'string' ? o.anatomy : '',
    roomSetup: typeof o.roomSetup === 'string' ? o.roomSetup : '',
    equipment: {
      store: eq.store as string[],
      room: eq.room as string[],
      basket: eq.basket as string[],
    },
    positioning: typeof o.positioning === 'string' ? o.positioning : '',
    draping: typeof o.draping === 'string' ? o.draping : '',
    steps,
    images,
  }
}
