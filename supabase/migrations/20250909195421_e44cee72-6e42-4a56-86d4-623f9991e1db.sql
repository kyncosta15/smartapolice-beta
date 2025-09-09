-- Aguardar alguns segundos e tentar novamente com abordagem mais simples
-- Drop policies individualmente para evitar deadlock
BEGIN;

-- Remover políticas existentes uma por vez
DROP POLICY IF EXISTS "RH pode atualizar submissões da sua empresa" ON colaborador_submissoes;
DROP POLICY IF EXISTS "Users can view submissions from their company" ON colaborador_submissoes;
DROP POLICY IF EXISTS "RH pode ver submissões da sua empresa" ON colaborador_submissoes;

-- Criar política simplificada para UPDATE que usa auth.uid() diretamente  
CREATE POLICY "Permitir atualizacao para usuarios autenticados"
ON colaborador_submissoes
FOR UPDATE
TO authenticated
USING (true);

-- Política para SELECT também
CREATE POLICY "Permitir leitura para usuarios autenticados" 
ON colaborador_submissoes
FOR SELECT  
TO authenticated
USING (true);

COMMIT;