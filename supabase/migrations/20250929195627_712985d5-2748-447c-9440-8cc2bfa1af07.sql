-- Corrigir política RLS da tabela public_fleet_tokens para usar user_profiles

-- Remover TODAS as políticas (incluindo a que foi criada parcialmente)
DROP POLICY IF EXISTS "Users can manage tokens of their default company" ON public.public_fleet_tokens;
DROP POLICY IF EXISTS "Users can manage their company tokens" ON public.public_fleet_tokens;
DROP POLICY IF EXISTS "pft_own_company" ON public.public_fleet_tokens;
DROP POLICY IF EXISTS "Allow public token validation" ON public.public_fleet_tokens;

-- Criar nova política usando user_profiles e default_empresa_id
CREATE POLICY "Users can manage tokens of their default company" 
ON public.public_fleet_tokens 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() 
    AND up.default_empresa_id = public_fleet_tokens.empresa_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() 
    AND up.default_empresa_id = public_fleet_tokens.empresa_id
  )
);

-- Recriar política de leitura pública para validação de tokens
CREATE POLICY "Allow public token validation" 
ON public.public_fleet_tokens 
FOR SELECT 
USING (true);