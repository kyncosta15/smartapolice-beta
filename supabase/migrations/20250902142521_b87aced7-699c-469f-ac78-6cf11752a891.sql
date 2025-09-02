-- Atualizar o usuário existente para SmartBenefícios
UPDATE public.users 
SET 
  name = 'Equipe RCaldas',
  role = 'rh',
  company = 'RCaldas',
  phone = '71992310958',
  updated_at = now()
WHERE email = 'beneficios@rcaldas.com.br';

-- Criar empresa RCaldas se não existir
INSERT INTO public.empresas (nome, cnpj, contato_rh_nome, contato_rh_email, contato_rh_telefone)
VALUES ('RCaldas', '12.345.678/0001-90', 'Equipe RCaldas', 'beneficios@rcaldas.com.br', '71992310958')
ON CONFLICT (nome) DO UPDATE SET
  contato_rh_nome = EXCLUDED.contato_rh_nome,
  contato_rh_email = EXCLUDED.contato_rh_email,
  contato_rh_telefone = EXCLUDED.contato_rh_telefone;