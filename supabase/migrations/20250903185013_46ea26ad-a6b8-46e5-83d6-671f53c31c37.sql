-- Limpar e recriar políticas RLS de forma mais simples
-- Primeiro, remover todas as políticas existentes das tabelas relevantes

DROP POLICY IF EXISTS "RH pode ver requests da empresa e solicitações públicas" ON requests;
DROP POLICY IF EXISTS "RH pode ver requests da sua empresa" ON requests;
DROP POLICY IF EXISTS "RH pode atualizar requests da empresa e públicos" ON requests;
DROP POLICY IF EXISTS "RH pode atualizar requests da sua empresa" ON requests;

DROP POLICY IF EXISTS "RH pode ver request_items da empresa e públicos" ON request_items;
DROP POLICY IF EXISTS "RH pode ver request_items da sua empresa" ON request_items;

-- Criar função helper para verificar se usuário pode acessar solicitações
CREATE OR REPLACE FUNCTION public.can_access_requests()
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND (u.role = 'rh' OR u.role = 'admin' OR u.role = 'administrador')
  );
$$;

-- Política simples: RH e Admin podem ver todas as solicitações
CREATE POLICY "RH e Admin podem ver todas as solicitações"
ON requests FOR SELECT
USING (public.can_access_requests());

-- Política para atualizar solicitações
CREATE POLICY "RH e Admin podem atualizar solicitações"
ON requests FOR UPDATE
USING (public.can_access_requests());

-- Política para request_items
CREATE POLICY "RH e Admin podem ver todos os itens"
ON request_items FOR SELECT
USING (public.can_access_requests());

-- Política para files relacionados
DROP POLICY IF EXISTS "RH pode ver files da sua empresa" ON files;

CREATE POLICY "RH e Admin podem ver todos os arquivos"
ON files FOR SELECT
USING (public.can_access_requests());