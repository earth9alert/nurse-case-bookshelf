import type {
  AnatomyImage,
  HandwritingPoint,
  HandwritingStroke,
  SectionAnnotations,
  SectionImages,
  SectionKey,
  SectionNotes,
  SurgicalCase,
} from '../types/case'
import { UNCATEGORIZED_ID } from '../types/case'

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/
const DATA_IMAGE_RE = /^data:image\/(jpeg|png|webp|gif);base64,/
const STORAGE_URL_RE = /^https:\/\/.*\.supabase\.co\/storage\//

export function isValidDataUrl(value: unknown): value is string {
  return typeof value === 'string' && DATA_IMAGE_RE.test(value)
}

export function isValidImageUrl(value: unknown): value is string {
  return typeof value === 'string' && STORAGE_URL_RE.test(value)
}

export function isValidImageSource(value: unknown): value is string {
  return isValidDataUrl(value) || isValidImageUrl(value)
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
  
  // Accept either new imageUrl or old dataUrl for backward compatibility
  let imageUrl: string | undefined
  
  // Try new field first
  if (typeof o.imageUrl === 'string' && o.imageUrl) {
    imageUrl = o.imageUrl
  }
  
  // Fall back to old field name
  if (!imageUrl && typeof o.dataUrl === 'string' && o.dataUrl) {
    imageUrl = o.dataUrl
  }
  
  if (!imageUrl) return null
  const annotations = validateHandwritingStrokes(o.annotations)
  return {
    id: o.id,
    caption: o.caption,
    imageUrl,
    ...(annotations.length > 0 ? { annotations } : {}),
  }
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

function validateHandwritingStroke(raw: unknown): HandwritingStroke | null {
  if (typeof raw !== 'object' || raw === null) return null
  const stroke = raw as Record<string, unknown>
  if (stroke.tool !== 'pen' && stroke.tool !== 'highlighter' && stroke.tool !== 'eraser') return null
  if (!isValidColor(stroke.color)) return null
  if (typeof stroke.width !== 'number' || !Number.isFinite(stroke.width) || stroke.width <= 0 || stroke.width > 0.1) {
    return null
  }
  if (!Array.isArray(stroke.points) || stroke.points.length === 0 || stroke.points.length > 5000) return null

  const points: HandwritingPoint[] = []
  for (const rawPoint of stroke.points) {
    if (typeof rawPoint !== 'object' || rawPoint === null) return null
    const point = rawPoint as Record<string, unknown>
    if (
      typeof point.x !== 'number' ||
      !Number.isFinite(point.x) ||
      point.x < 0 ||
      point.x > 1 ||
      typeof point.y !== 'number' ||
      !Number.isFinite(point.y) ||
      point.y < 0 ||
      point.y > 1
    ) {
      return null
    }
    const pressure = point.pressure
    if (
      pressure !== undefined &&
      (typeof pressure !== 'number' || !Number.isFinite(pressure) || pressure < 0 || pressure > 1)
    ) {
      return null
    }
    points.push({
      x: point.x,
      y: point.y,
      ...(pressure === undefined ? {} : { pressure }),
    })
  }

  return {
    tool: stroke.tool,
    color: stroke.color,
    width: stroke.width,
    points,
  }
}

function validateHandwritingStrokes(raw: unknown): HandwritingStroke[] {
  if (!Array.isArray(raw)) return []

  const strokes: HandwritingStroke[] = []
  let pointCount = 0
  for (const rawStroke of raw) {
    const stroke = validateHandwritingStroke(rawStroke)
    if (!stroke || pointCount + stroke.points.length > 20_000) continue
    strokes.push(stroke)
    pointCount += stroke.points.length
  }
  return strokes
}

function validateSectionAnnotations(raw: unknown): SectionAnnotations {
  if (typeof raw !== 'object' || raw === null) return {}
  const source = raw as Record<string, unknown>
  const annotations: SectionAnnotations = {}

  for (const key of SECTION_KEYS) {
    const rawStrokes = source[key]
    if (!Array.isArray(rawStrokes)) continue

    const strokes = validateHandwritingStrokes(rawStrokes)
    if (strokes.length > 0) annotations[key] = strokes
  }

  return annotations
}

function validateSectionNotes(raw: unknown): SectionNotes {
  if (typeof raw !== 'object' || raw === null) return {}
  const source = raw as Record<string, unknown>
  const notes: SectionNotes = {}

  for (const key of SECTION_KEYS) {
    const rawNote = source[key]
    if (typeof rawNote !== 'object' || rawNote === null) continue
    const note = rawNote as Record<string, unknown>
    const text = typeof note.text === 'string' ? note.text.slice(0, 5000) : ''
    const strokes = validateHandwritingStrokes(note.strokes)
    if (text || strokes.length > 0) {
      notes[key] = {
        text,
        ...(strokes.length > 0 ? { strokes } : {}),
      }
    }
  }

  return notes
}

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
  const annotations = validateSectionAnnotations(o.annotations)
  const sectionNotes = validateSectionNotes(o.sectionNotes)
  const personalNoteStrokes = validateHandwritingStrokes(o.personalNoteStrokes)

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
    ...(Object.keys(annotations).length > 0 ? { annotations } : {}),
    ...(Object.keys(sectionNotes).length > 0 ? { sectionNotes } : {}),
    ...(typeof o.personaNotes === 'string' ? { personaNotes: o.personaNotes } : {}),
    ...(personalNoteStrokes.length > 0 ? { personalNoteStrokes } : {}),
  }
}
