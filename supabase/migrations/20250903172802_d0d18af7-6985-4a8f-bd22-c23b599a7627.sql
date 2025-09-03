-- Política para permitir inserção pública em colaborador_submissoes
-- Isso é necessário porque o formulário é acessível através de links públicos

CREATE POLICY "Allow public insert on colaborador_submissoes" 
ON public.colaborador_submissoes
FOR INSERT 
WITH CHECK (true);

-- Política para permitir leitura das submissões apenas pelos usuários da empresa correspondente
CREATE POLICY "Users can view submissions from their company" 
ON public.colaborador_submissoes
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.colaborador_links cl
        WHERE cl.id = colaborador_submissoes.link_id
        AND cl.empresa_id IN (
            SELECT e.id FROM public.empresas e 
            JOIN public.users u ON u.company = e.nome 
            WHERE u.id = auth.uid()
        )
    )
);