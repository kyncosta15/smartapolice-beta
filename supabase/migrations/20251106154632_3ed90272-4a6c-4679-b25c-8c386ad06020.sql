-- Limpar registros antigos com ativo = false da tabela user_cpf_vinculos
DELETE FROM public.user_cpf_vinculos WHERE ativo = false;