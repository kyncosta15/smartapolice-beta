-- Tabela para histórico de exportações de dashboard
CREATE TABLE public.dashboard_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  export_date DATE NOT NULL DEFAULT CURRENT_DATE,
  export_time TIME NOT NULL DEFAULT CURRENT_TIME,
  file_size_kb INTEGER,
  dashboard_type TEXT DEFAULT 'full',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dashboard_exports ENABLE ROW LEVEL SECURITY;

-- Policies para dashboard_exports
CREATE POLICY "Users can view their own dashboard exports" 
ON public.dashboard_exports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dashboard exports" 
ON public.dashboard_exports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard exports" 
ON public.dashboard_exports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboard exports" 
ON public.dashboard_exports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all dashboard exports
CREATE POLICY "Admins can view all dashboard exports" 
ON public.dashboard_exports 
FOR SELECT 
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'administrador');

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_dashboard_exports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_dashboard_exports_updated_at
BEFORE UPDATE ON public.dashboard_exports
FOR EACH ROW
EXECUTE FUNCTION public.update_dashboard_exports_updated_at();