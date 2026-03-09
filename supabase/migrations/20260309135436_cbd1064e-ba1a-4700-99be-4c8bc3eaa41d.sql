
CREATE TABLE public.vehicle_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.frota_veiculos(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'basica',
  data_revisao DATE NOT NULL,
  km_atual NUMERIC,
  valor NUMERIC,
  realizada BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vehicle_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reviews of their company vehicles"
  ON public.vehicle_reviews FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert reviews for their company vehicles"
  ON public.vehicle_reviews FOR INSERT TO authenticated
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.user_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can update reviews of their company vehicles"
  ON public.vehicle_reviews FOR UPDATE TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete reviews of their company vehicles"
  ON public.vehicle_reviews FOR DELETE TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.user_memberships WHERE user_id = auth.uid()));

CREATE TRIGGER update_vehicle_reviews_updated_at
  BEFORE UPDATE ON public.vehicle_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
