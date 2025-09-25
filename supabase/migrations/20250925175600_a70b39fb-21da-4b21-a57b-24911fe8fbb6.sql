-- Criar política para permitir usuários "cliente" verem veículos da sua empresa
CREATE POLICY "Clientes podem ver veículos da sua empresa" 
ON public.frota_veiculos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_memberships um 
    WHERE um.user_id = auth.uid() 
    AND um.empresa_id = frota_veiculos.empresa_id
  )
);

-- Criar política para permitir usuários "cliente" verem responsáveis da sua empresa
CREATE POLICY "Clientes podem ver responsáveis da sua empresa" 
ON public.frota_responsaveis 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.frota_veiculos fv
    JOIN public.user_memberships um ON um.empresa_id = fv.empresa_id
    WHERE um.user_id = auth.uid() 
    AND fv.id = frota_responsaveis.veiculo_id
  )
);

-- Criar política para permitir usuários "cliente" verem pagamentos da sua empresa
CREATE POLICY "Clientes podem ver pagamentos da sua empresa" 
ON public.frota_pagamentos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.frota_veiculos fv
    JOIN public.user_memberships um ON um.empresa_id = fv.empresa_id
    WHERE um.user_id = auth.uid() 
    AND fv.id = frota_pagamentos.veiculo_id
  )
);

-- Criar política para permitir usuários "cliente" verem documentos da sua empresa
CREATE POLICY "Clientes podem ver documentos da sua empresa" 
ON public.frota_documentos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.frota_veiculos fv
    JOIN public.user_memberships um ON um.empresa_id = fv.empresa_id
    WHERE um.user_id = auth.uid() 
    AND fv.id = frota_documentos.veiculo_id
  )
);