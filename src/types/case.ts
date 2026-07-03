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

export interface SurgicalCase {
  id: string
  title: string
  subtitle: string
  color: string
  dx: string
  operation: string
  anatomy: string
  anatomyImages: AnatomyImage[]
  roomSetup: string
  roomSetupImages: AnatomyImage[]
  equipment: Equipment
  positioning: string
  draping: string
  drapingImages: AnatomyImage[]
  steps: string[]
}

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
