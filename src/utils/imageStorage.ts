import { getSupabase } from '../hooks/useSupabase'

const BUCKET_NAME = 'case-images'

/**
 * Upload image to Supabase Storage and return public URL
 */
export async function uploadImageToStorage(file: File, userId: string): Promise<string> {
  const client = getSupabase()
  if (!client) throw new Error('Supabase not initialized')

  try {
    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const filename = `${userId}/${timestamp}-${random}-${file.name}`

    // Upload to storage
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(filename, file, { upsert: false })

    if (error) {
      console.error('[imageStorage] Upload failed:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: publicUrl } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path)

    console.log(`[imageStorage] Uploaded ${file.name} → ${publicUrl.publicUrl}`)
    return publicUrl.publicUrl
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image upload failed'
    console.error('[imageStorage]', message)
    throw new Error(message)
  }
}

/**
 * Delete image from Supabase Storage
 */
export async function deleteImageFromStorage(imageUrl: string): Promise<void> {
  const client = getSupabase()
  if (!client) return

  try {
    // Extract path from URL
    const urlParts = imageUrl.split(`/${BUCKET_NAME}/`)
    if (urlParts.length < 2) return

    const filepath = urlParts[1]
    const { error } = await client.storage
      .from(BUCKET_NAME)
      .remove([filepath])

    if (error) {
      console.warn('[imageStorage] Delete failed:', error)
    } else {
      console.log(`[imageStorage] Deleted ${filepath}`)
    }
  } catch (err) {
    console.error('[imageStorage] Delete error:', err)
  }
}
