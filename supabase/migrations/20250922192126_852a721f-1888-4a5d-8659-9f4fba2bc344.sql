-- Multi-tenant system with user profiles and company isolation

-- 1. Ensure empresas table has proper structure
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Create profiles table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  photo_path text,
  default_empresa_id uuid REFERENCES empresas(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Profile policies - users can only manage their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Create user memberships table (N:N users x empresas)
CREATE TABLE IF NOT EXISTS user_memberships (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','member')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, empresa_id)
);

-- Enable RLS on memberships
ALTER TABLE user_memberships ENABLE ROW LEVEL SECURITY;

-- Membership policies
CREATE POLICY "Users can view their memberships" ON user_memberships
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage company memberships" ON user_memberships
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_memberships um
    WHERE um.user_id = auth.uid() 
    AND um.empresa_id = user_memberships.empresa_id 
    AND um.role IN ('owner', 'admin')
  )
);

-- 4. Improve import_jobs table
ALTER TABLE import_jobs 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'n8n_xlsx';

-- 5. Ensure frota_veiculos has empresa_id and created_by
ALTER TABLE frota_veiculos 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_frota_veiculos_empresa ON frota_veiculos(empresa_id);

-- Create unique constraint for placa per company
DROP INDEX IF EXISTS uix_veiculos_placa_empresa;
CREATE UNIQUE INDEX uix_frota_veiculos_placa_empresa
ON frota_veiculos(empresa_id, placa) WHERE placa IS NOT NULL AND placa != '';

-- 6. Create documentos table for files
CREATE TABLE IF NOT EXISTS documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  veiculo_id uuid REFERENCES frota_veiculos(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  file_path text NOT NULL,
  original_name text,
  file_size bigint,
  mime_type text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documentos_empresa ON documentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_documentos_veiculo ON documentos(veiculo_id);

-- Enable RLS on documentos
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

-- 7. Create helper function for membership check
CREATE OR REPLACE FUNCTION is_member_of(record_empresa_id uuid)
RETURNS boolean 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_memberships m
    WHERE m.user_id = auth.uid() AND m.empresa_id = record_empresa_id
  );
$$;

-- 8. Update RLS policies for existing tables

-- Drop existing policies on frota_veiculos
DROP POLICY IF EXISTS "Usuários autenticados podem ver veículos da sua empresa" ON frota_veiculos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir veículos da sua empresa" ON frota_veiculos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar veículos da sua empresa" ON frota_veiculos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar veículos da sua empresa" ON frota_veiculos;
DROP POLICY IF EXISTS "Service role pode atualizar todos os veículos" ON frota_veiculos;

-- New tenant-based policies for frota_veiculos
CREATE POLICY "veiculos_select" ON frota_veiculos
FOR SELECT USING (is_member_of(empresa_id));

CREATE POLICY "veiculos_insert" ON frota_veiculos
FOR INSERT WITH CHECK (is_member_of(empresa_id));

CREATE POLICY "veiculos_update" ON frota_veiculos
FOR UPDATE USING (is_member_of(empresa_id));

CREATE POLICY "veiculos_delete" ON frota_veiculos
FOR DELETE USING (is_member_of(empresa_id));

-- Service role bypass for automated processes
CREATE POLICY "service_role_all_access" ON frota_veiculos
FOR ALL TO service_role USING (true);

-- Documentos policies
CREATE POLICY "documentos_select" ON documentos
FOR SELECT USING (is_member_of(empresa_id));

CREATE POLICY "documentos_insert" ON documentos
FOR INSERT WITH CHECK (is_member_of(empresa_id));

CREATE POLICY "documentos_update" ON documentos
FOR UPDATE USING (is_member_of(empresa_id));

CREATE POLICY "documentos_delete" ON documentos
FOR DELETE USING (is_member_of(empresa_id));

-- Import jobs policies
CREATE POLICY "import_jobs_select" ON import_jobs
FOR SELECT USING (is_member_of(empresa_id));

CREATE POLICY "import_jobs_insert" ON import_jobs
FOR INSERT WITH CHECK (is_member_of(empresa_id));

-- 9. Create storage bucket and policies
INSERT INTO storage.buckets (id, name, public) 
VALUES ('smartapolice', 'smartapolice', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tenant isolation
CREATE POLICY "storage_select_tenant" ON storage.objects
FOR SELECT USING (
  bucket_id = 'smartapolice'
  AND (split_part(name, '/', 1))::uuid IN (
    SELECT empresa_id FROM user_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "storage_insert_tenant" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'smartapolice'
  AND (split_part(name, '/', 1))::uuid IN (
    SELECT empresa_id FROM user_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "storage_update_tenant" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'smartapolice'
  AND (split_part(name, '/', 1))::uuid IN (
    SELECT empresa_id FROM user_memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "storage_delete_tenant" ON storage.objects
FOR DELETE USING (
  bucket_id = 'smartapolice'
  AND (split_part(name, '/', 1))::uuid IN (
    SELECT empresa_id FROM user_memberships WHERE user_id = auth.uid()
  )
);

-- 10. Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_user_profiles_updated_at();

-- 11. Backfill user profiles from existing users
INSERT INTO user_profiles (id, display_name, default_empresa_id)
SELECT 
  u.id,
  u.name,
  e.id as empresa_id
FROM users u
LEFT JOIN empresas e ON e.nome = u.company
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 12. Backfill user memberships
INSERT INTO user_memberships (user_id, empresa_id, role)
SELECT 
  u.id,
  e.id,
  CASE 
    WHEN u.role IN ('admin', 'administrador') THEN 'admin'
    WHEN u.role = 'rh' THEN 'member'
    ELSE 'member'
  END
FROM users u
JOIN empresas e ON e.nome = u.company
WHERE NOT EXISTS (
  SELECT 1 FROM user_memberships um 
  WHERE um.user_id = u.id AND um.empresa_id = e.id
)
ON CONFLICT (user_id, empresa_id) DO NOTHING;