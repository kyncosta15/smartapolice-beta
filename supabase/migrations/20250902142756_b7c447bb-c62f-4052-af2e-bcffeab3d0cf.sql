-- Inserir alguns colaboradores de exemplo para RCaldas
INSERT INTO public.colaboradores (
  empresa_id, 
  nome, 
  cpf, 
  email, 
  telefone, 
  data_nascimento, 
  cargo, 
  centro_custo, 
  data_admissao, 
  status, 
  custo_mensal
) VALUES 
(
  (SELECT id FROM public.empresas WHERE nome = 'RCaldas' LIMIT 1),
  'Maria Silva Santos',
  '123.456.789-00',
  'maria.santos@rcaldas.com.br',
  '71987654321',
  '1985-03-15',
  'Analista de RH',
  'Recursos Humanos',
  '2023-01-10',
  'ativo',
  450.00
),
(
  (SELECT id FROM public.empresas WHERE nome = 'RCaldas' LIMIT 1),
  'João Pedro Oliveira',
  '987.654.321-00', 
  'joao.oliveira@rcaldas.com.br',
  '71998765432',
  '1990-07-22',
  'Desenvolvedor Senior',
  'Tecnologia',
  '2022-06-15',
  'ativo',
  380.00
),
(
  (SELECT id FROM public.empresas WHERE nome = 'RCaldas' LIMIT 1),
  'Ana Carolina Lima',
  '456.789.123-00',
  'ana.lima@rcaldas.com.br', 
  '71987123456',
  '1988-11-08',
  'Analista Financeiro',
  'Financeiro',
  '2023-03-20',
  'ativo',
  420.00
);

-- Inserir alguns dependentes
INSERT INTO public.dependentes (
  colaborador_id,
  nome,
  cpf,
  data_nascimento,
  grau_parentesco,
  status,
  custo_mensal
) VALUES
(
  (SELECT id FROM public.colaboradores WHERE cpf = '123.456.789-00' LIMIT 1),
  'Pedro Silva Santos',
  '111.222.333-44',
  '2010-05-10',
  'filho',
  'ativo',
  180.00
),
(
  (SELECT id FROM public.colaboradores WHERE cpf = '123.456.789-00' LIMIT 1), 
  'Carlos Silva Santos',
  '222.333.444-55',
  '1982-12-03',
  'conjuge',
  'ativo',
  290.00
);

-- Inserir alguns tickets de exemplo
INSERT INTO public.tickets (
  colaborador_id,
  empresa_id,
  tipo,
  status,
  titulo,
  descricao,
  canal_origem
) VALUES
(
  (SELECT id FROM public.colaboradores WHERE cpf = '987.654.321-00' LIMIT 1),
  (SELECT id FROM public.empresas WHERE nome = 'RCaldas' LIMIT 1),
  'inclusao_dependente',
  'em_validacao',
  'Inclusão de filha recém-nascida',
  'Solicitação de inclusão da filha Sofia, nascida em 15/12/2024',
  'whatsapp'
),
(
  (SELECT id FROM public.colaboradores WHERE cpf = '456.789.123-00' LIMIT 1),
  (SELECT id FROM public.empresas WHERE nome = 'RCaldas' LIMIT 1),
  'segunda_via_carteirinha',
  'concluido',
  'Segunda via de carteirinha perdida',
  'Carteirinha extraviada durante viagem',
  'whatsapp'
),
(
  (SELECT id FROM public.colaboradores WHERE cpf = '123.456.789-00' LIMIT 1),
  (SELECT id FROM public.empresas WHERE nome = 'RCaldas' LIMIT 1),
  'duvida_cobertura',
  'recebido', 
  'Dúvida sobre cobertura ortodontia',
  'Gostaria de saber se o plano cobre aparelho ortodôntico para filho de 12 anos',
  'whatsapp'
);