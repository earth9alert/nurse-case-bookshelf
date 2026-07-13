import type { SurgicalCase, AnatomyImage } from '../types/case'
import { uploadImageToStorage } from './imageStorage'

/**
 * Check if an image is base64 encoded (old format)
 */
function isBase64Image(imageUrl: string): boolean {
  return imageUrl.startsWith('data:image/')
}

/**
 * Convert base64 data URL to Blob
 */
function base64ToBlob(dataUrl: string): Blob | null {
  try {
    const [header, data] = dataUrl.split(',')
    if (!header || !data) return null

    const mimeMatch = header.match(/data:(image\/[^;]+)/)
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'

    const binaryString = atob(data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new Blob([bytes], { type: mime })
  } catch (err) {
    console.error('[imageMigration] Failed to convert base64:', err)
    return null
  }
}

/**
 * Migrate a single image from base64 to Supabase Storage
 */
async function migrateImage(image: AnatomyImage, userId: string): Promise<AnatomyImage | null> {
  // If already a URL, skip
  if (!isBase64Image(image.imageUrl)) {
    return image
  }

  try {
    console.log(`[imageMigration] Migrating image "${image.caption}"...`)
    const blob = base64ToBlob(image.imageUrl)
    if (!blob) {
      console.warn(`[imageMigration] Failed to convert base64 for "${image.caption}"`)
      return null
    }

    const file = new File([blob], `${image.id}.jpg`, { type: 'image/jpeg' })
    const newUrl = await uploadImageToStorage(file, userId)

    return {
      ...image,
      imageUrl: newUrl,
    }
  } catch (err) {
    console.error(`[imageMigration] Failed to migrate image "${image.caption}":`, err)
    return null
  }
}

/**
 * Migrate all images in a case from base64 to Supabase Storage
 * Returns updated case with new image URLs
 */
export async function migrateImagesInCase(
  surgicalCase: SurgicalCase,
  userId: string
): Promise<SurgicalCase> {
  const hasBase64Images = Object.values(surgicalCase.images).some((imgs) =>
    imgs?.some((img) => isBase64Image(img.imageUrl))
  )

  if (!hasBase64Images) {
    return surgicalCase // No migration needed
  }

  console.log(`[imageMigration] Starting migration for case "${surgicalCase.title}"`)

  const migratedImages: Record<string, AnatomyImage[]> = {}

  // Migrate images in each section
  for (const [sectionKey, images] of Object.entries(surgicalCase.images)) {
    if (!images || images.length === 0) {
      migratedImages[sectionKey] = []
      continue
    }

    const migratedSection: AnatomyImage[] = []
    for (const img of images) {
      const migrated = await migrateImage(img, userId)
      if (migrated) {
        migratedSection.push(migrated)
      }
    }
    migratedImages[sectionKey] = migratedSection
  }

  const updated = {
    ...surgicalCase,
    images: migratedImages,
    updatedAt: new Date().toISOString(), // Update timestamp
  }

  console.log(`[imageMigration] Migration complete for "${surgicalCase.title}"`)
  return updated
}

/**
 * Migrate all cases - convert base64 images to Supabase Storage URLs
 * This runs on app startup if Supabase is available
 */
export async function migrateCasesToStorageUrls(
  cases: SurgicalCase[],
  userId: string
): Promise<SurgicalCase[]> {
  const casesWithImages = cases.filter((c) =>
    Object.values(c.images).some((imgs) => imgs && imgs.length > 0)
  )

  if (casesWithImages.length === 0) {
    return cases // No images to migrate
  }

  console.log(`[imageMigration] Migrating ${casesWithImages.length} case(s)...`)

  const migrated: SurgicalCase[] = []
  for (const surgicalCase of cases) {
    const updated = await migrateImagesInCase(surgicalCase, userId)
    migrated.push(updated)
  }

  return migrated
}
