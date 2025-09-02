-- Atualizar o usuário existente com role válido
UPDATE public.users 
SET 
  name = 'Equipe RCaldas',
  role = 'administrador',
  company = 'RCaldas', 
  phone = '71992310958',
  updated_at = now()
WHERE email = 'beneficios@rcaldas.com.br';

-- Inserir empresa RCaldas
INSERT INTO public.empresas (nome, cnpj, contato_rh_nome, contato_rh_email, contato_rh_telefone)
VALUES ('RCaldas', '12.345.678/0001-90', 'Equipe RCaldas', 'beneficios@rcaldas.com.br', '71992310958')
ON CONFLICT DO NOTHING;