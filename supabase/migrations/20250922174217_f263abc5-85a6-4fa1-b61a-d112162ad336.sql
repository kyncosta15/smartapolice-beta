-- Criar política para permitir atualizações via service role (edge functions)
CREATE POLICY "Service role pode atualizar todos os veículos" 
ON public.frota_veiculos 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);