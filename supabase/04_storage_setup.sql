-- ============================================
-- STORAGE BUCKETS SETUP
-- ============================================
-- This file sets up Supabase Storage buckets for file uploads

-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'study-materials',
  'study-materials',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for handwritten notes (images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'handwritten-notes',
  'handwritten-notes',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for study-materials bucket
CREATE POLICY "Users can upload their own study materials"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'study-materials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own study materials"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'study-materials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own study materials"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'study-materials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own study materials"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'study-materials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policies for handwritten-notes bucket
CREATE POLICY "Users can upload their own handwritten notes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'handwritten-notes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own handwritten notes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'handwritten-notes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own handwritten notes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'handwritten-notes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

