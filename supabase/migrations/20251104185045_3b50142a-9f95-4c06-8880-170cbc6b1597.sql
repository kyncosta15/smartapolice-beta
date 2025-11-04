-- Remover políticas RLS antigas que podem estar causando o problema
DROP POLICY IF EXISTS "Users can view their own policies" ON policies;
DROP POLICY IF EXISTS "Users can view policies where they are responsible" ON policies;

-- Criar nova política mais permissiva que garante acesso a TODAS as apólices do usuário
CREATE POLICY "users_select_own_policies"
  ON policies
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR auth.uid() = responsavel_user_id
  );

-- Garantir que apólices podem ser inseridas
CREATE POLICY "users_insert_own_policies"  
  ON policies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Garantir que apólices podem ser atualizadas
CREATE POLICY "users_update_own_policies"
  ON policies
  FOR UPDATE  
  TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() = responsavel_user_id
  );

-- Garantir que apólices podem ser deletadas
CREATE POLICY "users_delete_own_policies"
  ON policies
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
  );