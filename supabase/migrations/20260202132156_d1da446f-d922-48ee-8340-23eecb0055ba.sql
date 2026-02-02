-- Adicionar coluna valor aos documentos de apólice (endossos)
ALTER TABLE public.policy_documents 
ADD COLUMN valor NUMERIC DEFAULT NULL;

-- Comentário descritivo
COMMENT ON COLUMN public.policy_documents.valor IS 'Valor do endosso que será somado ao prêmio mensal da apólice';