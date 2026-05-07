-- Make sensitive storage buckets private and add authenticated-scoped RLS
UPDATE storage.buckets SET public = false WHERE id IN ('fleet-documents', 'frotas_docs', 'documents');

-- Drop overly broad public read policies on storage.objects for these buckets if present
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (
        policyname ILIKE '%fleet-documents%public%' OR
        policyname ILIKE '%frotas_docs%public%' OR
        policyname ILIKE '%documents%public%' OR
        policyname ILIKE '%public%fleet%' OR
        policyname ILIKE '%public%frotas%' OR
        policyname ILIKE '%public%documents%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END$$;

-- Authenticated read on these buckets
CREATE POLICY "auth_read_fleet_documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'fleet-documents');

CREATE POLICY "auth_read_frotas_docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'frotas_docs');

CREATE POLICY "auth_read_documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

-- Authenticated write/delete on these buckets
CREATE POLICY "auth_write_fleet_documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fleet-documents');

CREATE POLICY "auth_write_frotas_docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'frotas_docs');

CREATE POLICY "auth_write_documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "auth_delete_fleet_documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'fleet-documents');

CREATE POLICY "auth_delete_frotas_docs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'frotas_docs');

CREATE POLICY "auth_delete_documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents');