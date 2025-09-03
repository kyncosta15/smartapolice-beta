-- Criar bucket para anexos do chat
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments', 
  'chat-attachments', 
  false, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Tabela para sessões de chat
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submissao_id UUID NOT NULL,
  usuario_atendente_id UUID,
  status TEXT NOT NULL DEFAULT 'aguardando',
  iniciado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  finalizado_em TIMESTAMP WITH TIME ZONE,
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  comentario_avaliacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_chat_sessions_submissao 
    FOREIGN KEY (submissao_id) 
    REFERENCES public.colaborador_submissoes(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT fk_chat_sessions_usuario 
    FOREIGN KEY (usuario_atendente_id) 
    REFERENCES public.users(id) 
    ON DELETE SET NULL,
    
  CONSTRAINT check_chat_status 
    CHECK (status IN ('aguardando', 'em_atendimento', 'finalizado', 'abandonado'))
);

-- Tabela para mensagens do chat
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  remetente_tipo TEXT NOT NULL,
  remetente_id UUID,
  remetente_nome TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  tipo_mensagem TEXT NOT NULL DEFAULT 'texto',
  metadata JSONB DEFAULT '{}',
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_chat_messages_session 
    FOREIGN KEY (session_id) 
    REFERENCES public.chat_sessions(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT check_remetente_tipo 
    CHECK (remetente_tipo IN ('colaborador', 'usuario', 'sistema')),
    
  CONSTRAINT check_tipo_mensagem 
    CHECK (tipo_mensagem IN ('texto', 'imagem', 'arquivo', 'sistema'))
);

-- Tabela para anexos do chat
CREATE TABLE public.chat_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  arquivo_nome TEXT NOT NULL,
  arquivo_url TEXT NOT NULL,
  arquivo_tipo TEXT NOT NULL,
  arquivo_tamanho INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_chat_attachments_message 
    FOREIGN KEY (message_id) 
    REFERENCES public.chat_messages(id) 
    ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_chat_sessions_submissao ON public.chat_sessions(submissao_id);
CREATE INDEX idx_chat_sessions_usuario ON public.chat_sessions(usuario_atendente_id);
CREATE INDEX idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at);
CREATE INDEX idx_chat_attachments_message ON public.chat_attachments(message_id);

-- Trigger para updated_at
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_apolices_beneficios_updated_at();

-- Políticas RLS para chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários RH podem ver sessões da sua empresa" 
ON public.chat_sessions
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.colaborador_submissoes cs
    JOIN public.colaborador_links cl ON cl.id = cs.link_id
    JOIN public.empresas e ON e.id = cl.empresa_id
    JOIN public.users u ON u.company = e.nome
    WHERE cs.id = chat_sessions.submissao_id
    AND u.id = auth.uid()
    AND (u.role = 'rh' OR u.role = 'admin')
  )
);

CREATE POLICY "Usuários RH podem atualizar sessões da sua empresa" 
ON public.chat_sessions
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.colaborador_submissoes cs
    JOIN public.colaborador_links cl ON cl.id = cs.link_id
    JOIN public.empresas e ON e.id = cl.empresa_id
    JOIN public.users u ON u.company = e.nome
    WHERE cs.id = chat_sessions.submissao_id
    AND u.id = auth.uid()
    AND (u.role = 'rh' OR u.role = 'admin')
  )
);

CREATE POLICY "Permitir criação pública de sessões de chat" 
ON public.chat_sessions
FOR INSERT 
WITH CHECK (true);

-- Políticas RLS para chat_messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver mensagens das sessões da sua empresa" 
ON public.chat_messages
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    JOIN public.colaborador_submissoes csub ON csub.id = cs.submissao_id
    JOIN public.colaborador_links cl ON cl.id = csub.link_id
    JOIN public.empresas e ON e.id = cl.empresa_id
    JOIN public.users u ON u.company = e.nome
    WHERE cs.id = chat_messages.session_id
    AND u.id = auth.uid()
    AND (u.role = 'rh' OR u.role = 'admin')
  )
);

CREATE POLICY "Permitir inserção pública de mensagens" 
ON public.chat_messages
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar mensagens da sua empresa" 
ON public.chat_messages
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_sessions cs
    JOIN public.colaborador_submissoes csub ON csub.id = cs.submissao_id
    JOIN public.colaborador_links cl ON cl.id = csub.link_id
    JOIN public.empresas e ON e.id = cl.empresa_id
    JOIN public.users u ON u.company = e.nome
    WHERE cs.id = chat_messages.session_id
    AND u.id = auth.uid()
    AND (u.role = 'rh' OR u.role = 'admin')
  )
);

-- Políticas RLS para chat_attachments
ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver anexos das mensagens da sua empresa" 
ON public.chat_attachments
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_messages cm
    JOIN public.chat_sessions cs ON cs.id = cm.session_id
    JOIN public.colaborador_submissoes csub ON csub.id = cs.submissao_id
    JOIN public.colaborador_links cl ON cl.id = csub.link_id
    JOIN public.empresas e ON e.id = cl.empresa_id
    JOIN public.users u ON u.company = e.nome
    WHERE cm.id = chat_attachments.message_id
    AND u.id = auth.uid()
    AND (u.role = 'rh' OR u.role = 'admin')
  )
);

CREATE POLICY "Permitir inserção pública de anexos" 
ON public.chat_attachments
FOR INSERT 
WITH CHECK (true);

-- Políticas para storage bucket chat-attachments
CREATE POLICY "Usuários podem ver arquivos de chat da sua empresa"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments' AND
  EXISTS (
    SELECT 1 FROM public.chat_attachments ca
    JOIN public.chat_messages cm ON cm.id = ca.message_id
    JOIN public.chat_sessions cs ON cs.id = cm.session_id
    JOIN public.colaborador_submissoes csub ON csub.id = cs.submissao_id
    JOIN public.colaborador_links cl ON cl.id = csub.link_id
    JOIN public.empresas e ON e.id = cl.empresa_id
    JOIN public.users u ON u.company = e.nome
    WHERE ca.arquivo_url = storage.objects.name
    AND u.id = auth.uid()
    AND (u.role = 'rh' OR u.role = 'admin')
  )
);

CREATE POLICY "Permitir upload público de arquivos de chat"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-attachments');

-- Habilitar realtime nas tabelas de chat
ALTER publication supabase_realtime ADD TABLE public.chat_sessions;
ALTER publication supabase_realtime ADD TABLE public.chat_messages;
ALTER publication supabase_realtime ADD TABLE public.chat_attachments;