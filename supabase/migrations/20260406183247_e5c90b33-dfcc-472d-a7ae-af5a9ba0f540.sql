
CREATE TABLE public.endosso_parcelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  endosso_id UUID NOT NULL REFERENCES public.policy_documents(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  vencimento DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'a vencer' CHECK (status IN ('a vencer', 'vencido', 'pago')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.endosso_parcelas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view endosso parcelas" ON public.endosso_parcelas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert endosso parcelas" ON public.endosso_parcelas
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update endosso parcelas" ON public.endosso_parcelas
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Users can delete endosso parcelas" ON public.endosso_parcelas
  FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_endosso_parcelas_updated_at
  BEFORE UPDATE ON public.endosso_parcelas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_endosso_parcelas_endosso_id ON public.endosso_parcelas(endosso_id);
