-- Tornar o bucket fleet-documents público para permitir downloads
UPDATE storage.buckets 
SET public = true 
WHERE name = 'fleet-documents';