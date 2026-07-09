import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { SurgicalCase } from '../types/case'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabaseClient: SupabaseClient | null = null

export function initSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Missing credentials - cloud sync disabled')
    return null
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    console.log('[Supabase] Client initialized successfully')
  }
  return supabaseClient
}

export function getSupabase(): SupabaseClient | null {
  return supabaseClient || initSupabase()
}

// Upload cases to Supabase
export async function uploadCasesToSupabase(userId: string, cases: SurgicalCase[]): Promise<boolean> {
  const client = getSupabase()
  if (!client) return false

  try {
    const { error } = await client
      .from('cases')
      .upsert(
        cases.map((c) => ({
          id: c.id,
          user_id: userId,
          data: c,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'id' }  // ← เปลี่ยนจาก 'id,user_id' เป็น 'id' อย่างเดียว
      )

    if (error) {
      console.error('[Supabase] Upload failed:', error)
      return false
    }

    console.log(`✓ Supabase: ${cases.length} cases uploaded`)
    return true
  } catch (err) {
    console.error('[Supabase] Upload error:', err)
    return false
  }
}

// Download cases from Supabase
export async function downloadCasesFromSupabase(userId: string): Promise<SurgicalCase[]> {
  const client = getSupabase()
  if (!client) return []

  try {
    const { data, error } = await client
      .from('cases')
      .select('data')
      .eq('user_id', userId)

    if (error) {
      console.error('[Supabase] Download failed:', error)
      return []
    }

    const cases = (data || [])
      .map((row: any) => row.data)
      .filter((c): c is SurgicalCase => c !== null)

    console.log(`✓ Supabase: ${cases.length} cases downloaded`)
    return cases
  } catch (err) {
    console.error('[Supabase] Download error:', err)
    return []
  }
}

// Check if online and Supabase is available
export function isSupabaseEnabled(): boolean {
  return !!getSupabase()
}

// Get anonymous user ID (random UUID stored in localStorage)
export function getAnonymousUserId(): string {
  const ANON_USER_KEY = 'nurse-case-bookshelf-anon-user-id'
  let userId = localStorage.getItem(ANON_USER_KEY)

  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem(ANON_USER_KEY, userId)
  }

  return userId
}
