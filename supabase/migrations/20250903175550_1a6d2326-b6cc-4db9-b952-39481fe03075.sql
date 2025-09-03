-- Remover tabelas do sistema de chat antigo
DROP TABLE IF EXISTS chat_attachments CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE; 
DROP TABLE IF EXISTS chat_sessions CASCADE;

-- Criar novo esquema conforme especificação

-- Colaboradores (renomeando de colaboradores para employees)
CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  cpf text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'ativo', -- ativo|inativo|pendente
  created_at timestamptz DEFAULT now()
);

-- Dependentes (renomeando de dependentes para dependents)  
CREATE TABLE dependents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  cpf text,
  birth_date date,
  relationship text, -- conjuge|filho|outro
  created_at timestamptz DEFAULT now()
);

-- Tokens públicos para link do WhatsApp
CREATE TABLE public_request_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,        -- JWT assinado
  expires_at timestamptz NOT NULL,   -- padrão: +7 dias
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Solicitações (protocolo)
CREATE TABLE requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_code text NOT NULL UNIQUE,          -- ex: SB-2025-000123
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  kind text NOT NULL,                           -- inclusao|exclusao
  status text NOT NULL DEFAULT 'recebido',      -- recebido|em_validacao|concluido|recusado
  submitted_at timestamptz,                     -- quando finaliza
  draft boolean DEFAULT true,                   -- rascunho?
  channel text DEFAULT 'whatsapp',              -- whatsapp|form
  metadata jsonb DEFAULT '{}',                  -- infos auxiliares
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Itens da solicitação (podem ser múltiplos dependentes)
CREATE TABLE request_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  target text NOT NULL,       -- titular|dependente
  dependent_id uuid REFERENCES dependents(id) ON DELETE SET NULL,
  action text NOT NULL,       -- incluir|excluir
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Arquivos anexados
CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id) ON DELETE CASCADE,
  path text NOT NULL,
  original_name text,
  mime_type text,
  size bigint,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX ON requests (employee_id);
CREATE INDEX ON public_request_tokens (token);
CREATE INDEX ON files (request_id);
CREATE INDEX ON employees (company_id);
CREATE INDEX ON dependents (employee_id);

-- Função para gerar protocol_code sequencial
CREATE SEQUENCE IF NOT EXISTS protocol_sequence START 1;

CREATE OR REPLACE FUNCTION generate_protocol_code()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM now())::TEXT;
    sequence_num := LPAD(nextval('protocol_sequence')::TEXT, 6, '0');
    RETURN 'SB-' || year_part || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies para o novo sistema
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependents ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public_request_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Employees: RH pode ver da sua empresa
CREATE POLICY "RH pode ver colaboradores da sua empresa" ON employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
        AND (u.role::text = 'rh' OR u.role::text = 'admin')
        AND e.id = employees.company_id
    )
  );

CREATE POLICY "RH pode inserir colaboradores da sua empresa" ON employees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
        AND (u.role::text = 'rh' OR u.role::text = 'admin')
        AND e.id = employees.company_id
    )
  );

CREATE POLICY "RH pode atualizar colaboradores da sua empresa" ON employees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
        AND (u.role::text = 'rh' OR u.role::text = 'admin')
        AND e.id = employees.company_id
    )
  );

-- Dependents: RH pode ver dependentes dos colaboradores da sua empresa
CREATE POLICY "RH pode ver dependentes da sua empresa" ON dependents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees emp
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
        AND (u.role::text = 'rh' OR u.role::text = 'admin')
        AND e.id = emp.company_id
        AND emp.id = dependents.employee_id
    )
  );

CREATE POLICY "RH pode inserir dependentes da sua empresa" ON dependents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees emp
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
        AND (u.role::text = 'rh' OR u.role::text = 'admin')
        AND e.id = emp.company_id
        AND emp.id = dependents.employee_id
    )
  );

CREATE POLICY "RH pode atualizar dependentes da sua empresa" ON dependents
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employees emp
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
        AND (u.role::text = 'rh' OR u.role::text = 'admin')
        AND e.id = emp.company_id
        AND emp.id = dependents.employee_id
    )
  );

-- Public tokens: acesso público para validação
CREATE POLICY "Permitir leitura pública de tokens válidos" ON public_request_tokens
  FOR SELECT USING (expires_at > now() AND used_at IS NULL);

CREATE POLICY "RH pode inserir tokens da sua empresa" ON public_request_tokens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees emp
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
        AND (u.role::text = 'rh' OR u.role::text = 'admin')
        AND e.id = emp.company_id
        AND emp.id = public_request_tokens.employee_id
    )
  );

-- Requests: RH vê da sua empresa, tokens públicos para próprios requests
CREATE POLICY "RH pode ver requests da sua empresa" ON requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees emp
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
        AND (u.role::text = 'rh' OR u.role::text = 'admin')
        AND e.id = emp.company_id
        AND emp.id = requests.employee_id
    )
  );

CREATE POLICY "Permitir criação pública de requests" ON requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de requests" ON requests
  FOR UPDATE USING (true);

CREATE POLICY "RH pode atualizar requests da sua empresa" ON requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM employees emp
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
        AND (u.role::text = 'rh' OR u.role::text = 'admin')
        AND e.id = emp.company_id
        AND emp.id = requests.employee_id
    )
  );

-- Request Items: seguem as mesmas regras dos requests
CREATE POLICY "RH pode ver request_items da sua empresa" ON request_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM requests r
      JOIN employees emp ON r.employee_id = emp.id
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
        AND (u.role::text = 'rh' OR u.role::text = 'admin')
        AND e.id = emp.company_id
        AND r.id = request_items.request_id
    )
  );

CREATE POLICY "Permitir criação pública de request_items" ON request_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de request_items" ON request_items
  FOR UPDATE USING (true);

-- Files: seguem as mesmas regras dos requests
CREATE POLICY "RH pode ver files da sua empresa" ON files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM requests r
      JOIN employees emp ON r.employee_id = emp.id
      JOIN users u ON TRUE
      JOIN empresas e ON u.company::text = e.nome
      WHERE u.id = auth.uid() 
        AND (u.role::text = 'rh' OR u.role::text = 'admin')
        AND e.id = emp.company_id
        AND r.id = files.request_id
    )
  );

CREATE POLICY "Permitir criação pública de files" ON files
  FOR INSERT WITH CHECK (true);