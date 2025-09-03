-- Atualizar política RLS para colaborador_links para permitir que todos os usuários criem links
DROP POLICY IF EXISTS "RH pode gerenciar links da sua empresa" ON colaborador_links;

-- Nova política que permite qualquer usuário autenticado criar links para sua empresa
CREATE POLICY "Usuários podem gerenciar links da sua empresa" 
ON colaborador_links FOR ALL 
USING (EXISTS ( SELECT 1
   FROM (users u
     JOIN empresas e ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) AND (e.id = colaborador_links.empresa_id))
))
WITH CHECK (EXISTS ( SELECT 1
   FROM (users u
     JOIN empresas e ON (((u.company)::text = e.nome)))
  WHERE ((u.id = auth.uid()) AND (e.id = colaborador_links.empresa_id))
));