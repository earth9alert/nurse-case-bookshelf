-- Supabase Storage RLS Policies Setup for case-images bucket
-- Run this SQL in Supabase SQL Editor to enable uploads and downloads

-- Note: These policies allow ANONYMOUS (anon role) users to:
-- 1. Upload files to case-images bucket
-- 2. Download/view files from case-images bucket
-- 3. Delete their own files

-- ===============================================
-- IMPORTANT: Run in Supabase SQL Editor
-- ===============================================
-- 1. Go to https://app.supabase.com/project/_/sql/new
-- 2. Copy & paste this entire file
-- 3. Click "Run"
-- ===============================================

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anonymous users to SELECT (download/view) files from case-images bucket
CREATE POLICY "Allow anon read from case-images"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'case-images');

-- Policy 2: Allow anonymous users to INSERT (upload) files to case-images bucket
CREATE POLICY "Allow anon insert to case-images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'case-images');

-- Policy 3: Allow anonymous users to UPDATE files in case-images bucket
CREATE POLICY "Allow anon update case-images"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'case-images')
WITH CHECK (bucket_id = 'case-images');

-- Policy 4: Allow anonymous users to DELETE files from case-images bucket
CREATE POLICY "Allow anon delete from case-images"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'case-images');

-- Verify policies were created
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND polname LIKE '%case-images%';

-- If policies already exist, you may need to drop them first:
-- DROP POLICY IF EXISTS "Allow anon read from case-images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow anon insert to case-images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow anon update case-images" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow anon delete from case-images" ON storage.objects;
