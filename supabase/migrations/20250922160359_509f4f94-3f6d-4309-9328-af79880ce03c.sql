-- Create tickets table for sinistros and assistências
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('sinistro', 'assistencia')),
  subtipo TEXT,
  vehicle_id UUID REFERENCES public.frota_veiculos(id) ON DELETE SET NULL,
  apolice_id TEXT,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_analise', 'finalizado', 'cancelado')),
  data_evento DATE,
  valor_estimado NUMERIC,
  descricao TEXT,
  localizacao TEXT,
  origem TEXT NOT NULL DEFAULT 'portal' CHECK (origem IN ('portal', 'importacao', 'api')),
  created_by UUID REFERENCES auth.users(id),
  empresa_id UUID REFERENCES public.empresas(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_movements table for tracking ticket changes
CREATE TABLE public.ticket_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('status_change', 'comentario', 'anexo', 'criacao')),
  descricao TEXT,
  payload JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_attachments table for file uploads
CREATE TABLE public.ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.frota_veiculos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('apolice', 'documento', 'foto', 'bo', 'crlv', 'outros')),
  nome_arquivo TEXT NOT NULL,
  file_url TEXT,
  file_path TEXT NOT NULL,
  tamanho_arquivo BIGINT,
  tipo_mime TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delete_requests table for vehicle/ticket deletion requests
CREATE TABLE public.delete_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contexto TEXT NOT NULL CHECK (contexto IN ('vehicle', 'ticket')),
  context_id UUID NOT NULL,
  motivo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado', 'aprovado', 'negado')),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all new tables
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delete_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets
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

-- Create triggers for updated_at
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tickets_empresa_id ON public.tickets(empresa_id);
CREATE INDEX idx_tickets_vehicle_id ON public.tickets(vehicle_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_tipo ON public.tickets(tipo);
CREATE INDEX idx_tickets_created_at ON public.tickets(created_at DESC);
CREATE INDEX idx_ticket_movements_ticket_id ON public.ticket_movements(ticket_id);
CREATE INDEX idx_ticket_attachments_ticket_id ON public.ticket_attachments(ticket_id);
CREATE INDEX idx_ticket_attachments_vehicle_id ON public.ticket_attachments(vehicle_id);
CREATE INDEX idx_delete_requests_context ON public.delete_requests(contexto, context_id);