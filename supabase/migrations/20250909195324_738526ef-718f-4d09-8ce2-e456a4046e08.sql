-- Verificar e corrigir as políticas RLS para colaborador_submissoes
-- Primeiro, remover as políticas existentes que podem estar causando problemas
DROP POLICY IF EXISTS "RH pode atualizar submissões da sua empresa" ON colaborador_submissoes;
DROP POLICY IF EXISTS "Users can view submissions from their company" ON colaborador_submissoes;

-- Criar políticas mais específicas usando both users and profiles tables
CREATE POLICY "RH e Corretora podem atualizar submissões"
ON colaborador_submissoes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM (
      SELECT u.role, u.company FROM users u WHERE u.id = auth.uid()
      UNION
      SELECT p.role, p.company FROM profiles p WHERE p.id = auth.uid()
    ) user_data
    JOIN colaborador_links cl ON cs.link_id = cl.id
    JOIN empresas e ON cl.empresa_id = e.id
    WHERE user_data.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
    AND user_data.company = e.nome
  )
);

-- Política para SELECT também
CREATE POLICY "RH e Corretora podem ver submissões"
ON colaborador_submissoes  
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM (
      SELECT u.role, u.company FROM users u WHERE u.id = auth.uid()
      UNION
      SELECT p.role, p.company FROM profiles p WHERE p.id = auth.uid()
    ) user_data
    JOIN colaborador_links cl ON colaborador_submissoes.link_id = cl.id
    JOIN empresas e ON cl.empresa_id = e.id
    WHERE user_data.role IN ('rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh')
    AND user_data.company = e.nome
  )
);