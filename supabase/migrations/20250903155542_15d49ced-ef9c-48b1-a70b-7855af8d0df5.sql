-- Ajustar políticas RLS para permitir que clientes vejam sua própria empresa
DROP POLICY IF EXISTS "RH pode ver sua própria empresa" ON empresas;
DROP POLICY IF EXISTS "RH pode atualizar sua própria empresa" ON empresas;
DROP POLICY IF EXISTS "RH pode inserir sua própria empresa" ON empresas;

-- Nova política que permite clientes, RH e admin acessarem sua empresa
CREATE POLICY "Usuários podem ver sua própria empresa" 
ON empresas FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.company)::text = empresas.nome))
));

CREATE POLICY "RH e Admin podem atualizar sua empresa" 
ON empresas FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (((users.role)::text = 'rh'::text) OR ((users.role)::text = 'admin'::text)) AND ((users.company)::text = empresas.nome))
));

CREATE POLICY "RH e Admin podem inserir empresas" 
ON empresas FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (((users.role)::text = 'rh'::text) OR ((users.role)::text = 'admin'::text)) AND ((users.company)::text = empresas.nome))
));