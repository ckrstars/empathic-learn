
-- Create storage bucket for assignment documents
INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', true);

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload assignments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'assignments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own assignments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'assignments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own assignments" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'assignments' AND (storage.foldername(name))[1] = auth.uid()::text);
