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

**Method A: Via SQL (Most Reliable)**

1. Go to **[Supabase SQL Editor](https://app.supabase.com/project/_/sql/new)**
2. Copy policies from `.kiro/steering/setup-storage-policies.sql`
3. Paste into SQL editor and click **Run**
4. Verify success in console output

**Method B: Via Dashboard (GUI)**

1. Select `case-images` bucket
2. Click **Policies**
3. Click **New Policy** and create each:

```
Policy 1: SELECT (Read)
- Operation: SELECT
- Target: anon
- USING: bucket_id = 'case-images'

Policy 2: INSERT (Upload)
- Operation: INSERT  
- Target: anon
- WITH CHECK: bucket_id = 'case-images'

Policy 3: UPDATE
- Operation: UPDATE
- Target: anon
- USING & WITH CHECK: bucket_id = 'case-images'

Policy 4: DELETE
- Operation: DELETE
- Target: anon
- USING: bucket_id = 'case-images'
```

### 3. Verify Setup

- Bucket exists and is **Public** ✅
- Policies are created and enabled:
  - ✅ SELECT (for anon to download)
  - ✅ INSERT (for anon to upload)
  - ✅ UPDATE (for anon to modify)
  - ✅ DELETE (for anon to remove)
- Project URL in `.env.local`:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-key
  ```
- **Check policies**: Storage > case-images > Policies (should show 4 policies)

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
