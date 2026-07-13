# Image Storage Setup Guide

## Objective
Configure Supabase Storage bucket `case-images` to store medical case images.

## Current Architecture
- Images are uploaded to Supabase Storage (not stored in database as base64)
- Reduces database bloat and improves performance
- Old base64 images are automatically migrated to Storage on app startup

## Required Setup

### 1. Create Storage Bucket

1. Go to **[Supabase Dashboard](https://app.supabase.com)** → Select your project
2. Click **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Enter name: `case-images`
5. **Enable Public access** ✅
6. Click **Create bucket**

### 2. Configure Access Policies (RLS)

**Method A: Via Dashboard (Easy)**

1. Select `case-images` bucket
2. Click **Policies**
3. Click **New Policy**
4. Select template: **Enable public access with select and insert**
5. Configure:
   - **Target roles:** `anon` (anonymous users)
   - **Operations:** ✅ SELECT ✅ INSERT ✅ UPDATE ✅ DELETE
6. Click **Create policy**

**Method B: SQL (Advanced)**

```sql
-- Allow anonymous users to upload
CREATE POLICY "Enable insert for anon users"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'case-images');

-- Allow anonymous users to read public files
CREATE POLICY "Enable public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'case-images');

-- Allow anonymous users to delete their own files
CREATE POLICY "Enable delete for anon users"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'case-images');
```

### 3. Verify Setup

- Bucket exists and is **Public** ✅
- Policies allow **SELECT** and **INSERT** for `anon` role
- Project URL in `.env.local`:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-key
  ```

### 4. Test Upload

1. Open app browser console (F12)
2. Upload an image in any case section
3. Should see logs:
   ```
   [imageStorage] Uploading image.jpg to bucket "case-images"...
   [imageStorage] ✓ Uploaded image.jpg → https://...supabase.co/storage/.../image.jpg
   ```

### Troubleshooting

| Error | Solution |
|-------|----------|
| `404 not found` | Bucket doesn't exist — create it in Storage panel |
| `403 Forbidden` | Missing RLS policies — add select+insert policies |
| `CORS error` | Usually handled by Supabase SDK, check browser console |
| `Image won't display` | URL might be broken — check Storage > Files to verify |

### Image Migration

- App automatically migrates old base64 images to Storage on startup
- Check browser console for `[imageMigration]` logs
- Once migrated, images are stored as URLs in Supabase database
- Database rows become much smaller (KB instead of MB)

---

**Status:** Images are stored in Supabase Storage, not in database
**Auto-migration:** Enabled for backward compatibility with old data
