export interface Equipment {
  store: string[]
  room: string[]
  basket: string[]
}

export interface AnatomyImage {
  id: string
  caption: string
  dataUrl: string
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
}

// Images keyed by section — every section can have photos
export type SectionImages = Partial<Record<SectionKey, AnatomyImage[]>>

export interface SurgicalCase {
  id: string
  categoryId: string
  title: string
  subtitle: string
  color: string
  updatedAt: string          // ISO-8601 timestamp
  dx: string
  operation: string
  anatomy: string
  roomSetup: string
  equipment: Equipment
  positioning: string
  draping: string
  steps: string              // rich text HTML (was string[] in older versions)
  images: SectionImages      // all section photos in one place
}

export const UNCATEGORIZED_ID = '__uncategorized__'

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'general', name: 'General Surgery', color: '#2d6a4f', icon: '🔪' },
  { id: 'ortho', name: 'Orthopedics', color: '#1d3557', icon: '🦴' },
  { id: 'ob', name: 'OB/GYN', color: '#9b2226', icon: '👶' },
  { id: 'neuro', name: 'Neurosurgery', color: '#4a4e69', icon: '🧠' },
  { id: 'cardio', name: 'Cardiothoracic', color: '#c1666b', icon: '❤️' },
  { id: 'uro', name: 'Urology', color: '#457b9d', icon: '🫘' },
  { id: UNCATEGORIZED_ID, name: 'ไม่ระบุหมวด', color: '#8b6914', icon: '📄' },
]

export type SectionKey =
  | 'dx'
  | 'operation'
  | 'anatomy'
  | 'roomSetup'
  | 'equipment'
  | 'positioning'
  | 'draping'
  | 'steps'

export interface SectionInfo {
  key: SectionKey
  label: string
  shortLabel: string
}

export const SECTIONS: SectionInfo[] = [
  { key: 'dx', label: 'Dx — การวินิจฉัย', shortLabel: 'Dx' },
  { key: 'operation', label: 'Operation — หัตถการ', shortLabel: 'Op' },
  { key: 'anatomy', label: 'Anatomy — กายวิภาค', shortLabel: 'Anat' },
  { key: 'roomSetup', label: 'การจัดห้อง', shortLabel: 'ห้อง' },
  { key: 'equipment', label: 'อุปกรณ์', shortLabel: 'อุปกรณ์' },
  { key: 'positioning', label: 'การจัดท่า', shortLabel: 'ท่า' },
  { key: 'draping', label: 'การปูผ้า', shortLabel: 'ปูผ้า' },
  { key: 'steps', label: 'Step — ขั้นตอน', shortLabel: 'Step' },
]
