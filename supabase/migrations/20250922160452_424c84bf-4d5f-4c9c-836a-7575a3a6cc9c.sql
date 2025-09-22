-- Check if ticket_movements table exists, if not create it
CREATE TABLE IF NOT EXISTS public.ticket_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('status_change', 'comentario', 'anexo', 'criacao')),
  descricao TEXT,
  payload JSONB,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Check if ticket_attachments table exists, if not create it
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID,
  vehicle_id UUID,
  tipo TEXT NOT NULL CHECK (tipo IN ('apolice', 'documento', 'foto', 'bo', 'crlv', 'outros')),
  nome_arquivo TEXT NOT NULL,
  file_url TEXT,
  file_path TEXT NOT NULL,
  tamanho_arquivo BIGINT,
  tipo_mime TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Check if delete_requests table exists, if not create it
CREATE TABLE IF NOT EXISTS public.delete_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contexto TEXT NOT NULL CHECK (contexto IN ('vehicle', 'ticket')),
  context_id UUID NOT NULL,
  motivo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado', 'aprovado', 'negado')),
  requested_by UUID NOT NULL,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Add columns to existing tickets table if they don't exist
DO $$ 
BEGIN
  -- Add empresa_id column if it doesn't exist
  IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='tickets' AND column_name='empresa_id') THEN
    ALTER TABLE public.tickets ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
  END IF;
  
  -- Add vehicle_id column if it doesn't exist
  IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='tickets' AND column_name='vehicle_id') THEN
    ALTER TABLE public.tickets ADD COLUMN vehicle_id UUID REFERENCES public.frota_veiculos(id) ON DELETE SET NULL;
  END IF;
  
  -- Add tipo column if it doesn't exist
  IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='tickets' AND column_name='tipo') THEN
    ALTER TABLE public.tickets ADD COLUMN tipo TEXT CHECK (tipo IN ('sinistro', 'assistencia'));
  END IF;
  
  -- Add subtipo column if it doesn't exist
  IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='tickets' AND column_name='subtipo') THEN
    ALTER TABLE public.tickets ADD COLUMN subtipo TEXT;
  END IF;
  
  -- Add apolice_id column if it doesn't exist
  IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='tickets' AND column_name='apolice_id') THEN
    ALTER TABLE public.tickets ADD COLUMN apolice_id TEXT;
  END IF;
  
  -- Add data_evento column if it doesn't exist
  IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='tickets' AND column_name='data_evento') THEN
    ALTER TABLE public.tickets ADD COLUMN data_evento DATE;
  END IF;
  
  -- Add valor_estimado column if it doesn't exist
  IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='tickets' AND column_name='valor_estimado') THEN
    ALTER TABLE public.tickets ADD COLUMN valor_estimado NUMERIC;
  END IF;
  
  -- Add localizacao column if it doesn't exist
  IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='tickets' AND column_name='localizacao') THEN
    ALTER TABLE public.tickets ADD COLUMN localizacao TEXT;
  END IF;
  
  -- Add origem column if it doesn't exist
  IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='tickets' AND column_name='origem') THEN
    ALTER TABLE public.tickets ADD COLUMN origem TEXT DEFAULT 'portal' CHECK (origem IN ('portal', 'importacao', 'api'));
  END IF;
  
  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='tickets' AND column_name='created_by') THEN
    ALTER TABLE public.tickets ADD COLUMN created_by UUID;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.ticket_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delete_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets (update existing ones if needed)
DROP POLICY IF EXISTS "Users can view tickets from their company" ON public.tickets;
CREATE POLICY "Users can view tickets from their company" ON public.tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
      AND e.id = tickets.empresa_id
    )
  );

DROP POLICY IF EXISTS "Users can insert tickets for their company" ON public.tickets;
CREATE POLICY "Users can insert tickets for their company" ON public.tickets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
      AND e.id = tickets.empresa_id
    )
  );

DROP POLICY IF EXISTS "Users can update tickets from their company" ON public.tickets;
CREATE POLICY "Users can update tickets from their company" ON public.tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
      AND e.id = tickets.empresa_id
    )
  );

-- RLS Policies for ticket_movements
CREATE POLICY "Users can view movements from their company tickets" ON public.ticket_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
      AND e.id = t.empresa_id
      AND t.id = ticket_movements.ticket_id
    )
  );

CREATE POLICY "Users can insert movements for their company tickets" ON public.ticket_movements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
      AND e.id = t.empresa_id
      AND t.id = ticket_movements.ticket_id
    )
  );

-- RLS Policies for ticket_attachments
CREATE POLICY "Users can view attachments from their company" ON public.ticket_attachments
  FOR SELECT USING (
    (ticket_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tickets t
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
      AND e.id = t.empresa_id
      AND t.id = ticket_attachments.ticket_id
    )) OR
    (vehicle_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM frota_veiculos fv
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
      AND e.id = fv.empresa_id
      AND fv.id = ticket_attachments.vehicle_id
    ))
  );

CREATE POLICY "Users can insert attachments for their company" ON public.ticket_attachments
  FOR INSERT WITH CHECK (
    (ticket_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM tickets t
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
      AND e.id = t.empresa_id
      AND t.id = ticket_attachments.ticket_id
    )) OR
    (vehicle_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM frota_veiculos fv
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
      AND e.id = fv.empresa_id
      AND fv.id = ticket_attachments.vehicle_id
    ))
  );

-- RLS Policies for delete_requests
CREATE POLICY "Users can view delete requests from their company" ON public.delete_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
    )
  );

CREATE POLICY "Users can insert delete requests" ON public.delete_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin', 'gestor_rh'])
    )
  );

CREATE POLICY "Admins can update delete requests" ON public.delete_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role::text = ANY(ARRAY['admin', 'administrador', 'corretora_admin'])
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_empresa_id ON public.tickets(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tickets_vehicle_id ON public.tickets(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_tipo ON public.tickets(tipo);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_movements_ticket_id ON public.ticket_movements(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON public.ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_vehicle_id ON public.ticket_attachments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_delete_requests_context ON public.delete_requests(contexto, context_id);