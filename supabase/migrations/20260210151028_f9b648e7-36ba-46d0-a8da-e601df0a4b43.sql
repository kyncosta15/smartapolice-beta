
-- Tabela relacional para armazenar cronograma de parcelas/vencimentos de cada apólice
CREATE TABLE public.apolice_parcelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  apolice_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  numero_parcela INT NOT NULL,
  vencimento DATE NOT NULL,
  valor NUMERIC NOT NULL,
  status_pagamento TEXT NOT NULL DEFAULT 'Pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT uq_apolice_parcela UNIQUE (apolice_id, numero_parcela)
);

-- Índices para consultas frequentes
CREATE INDEX idx_apolice_parcelas_apolice_id ON public.apolice_parcelas(apolice_id);
CREATE INDEX idx_apolice_parcelas_vencimento ON public.apolice_parcelas(vencimento);

-- Enable RLS
ALTER TABLE public.apolice_parcelas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: acesso baseado no dono da apólice (via policies.user_id)
CREATE POLICY "Users can view parcelas of their own policies"
  ON public.apolice_parcelas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.policies p WHERE p.id = apolice_parcelas.apolice_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert parcelas for their own policies"
  ON public.apolice_parcelas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.policies p WHERE p.id = apolice_parcelas.apolice_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update parcelas of their own policies"
  ON public.apolice_parcelas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.policies p WHERE p.id = apolice_parcelas.apolice_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete parcelas of their own policies"
  ON public.apolice_parcelas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.policies p WHERE p.id = apolice_parcelas.apolice_id AND p.user_id = auth.uid()
    )
  );
