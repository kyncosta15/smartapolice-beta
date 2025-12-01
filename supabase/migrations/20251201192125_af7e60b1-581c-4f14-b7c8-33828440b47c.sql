-- Adicionar colunas para controle de aceite dos termos na tabela user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS termos_aceitos boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS termos_aceitos_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS termos_versao text DEFAULT '1.0';

-- Criar política para usuários atualizarem seus próprios termos
CREATE POLICY "Usuários podem atualizar aceite de termos"
ON public.user_profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());