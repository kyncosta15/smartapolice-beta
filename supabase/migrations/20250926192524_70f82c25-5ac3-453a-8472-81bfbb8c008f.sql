-- Criar empresa para o usuário atual (se não existir)
DO $$
DECLARE
    empresa_id_resultado uuid;
BEGIN
    -- Verificar se empresa já existe
    SELECT id INTO empresa_id_resultado 
    FROM public.empresas 
    WHERE nome = 'Cliente - thiagoncosta45@gmail.com';
    
    -- Se não existe, criar
    IF empresa_id_resultado IS NULL THEN
        INSERT INTO public.empresas (nome, cnpj, created_at, updated_at)
        VALUES ('Cliente - thiagoncosta45@gmail.com', 'thiagoncosta45gmail.com', now(), now())
        RETURNING id INTO empresa_id_resultado;
    END IF;
    
    -- Verificar se membership já existe
    IF NOT EXISTS (
        SELECT 1 FROM public.user_memberships 
        WHERE user_id = 'bb230901-e06e-4f46-b263-7cdbd90ec9a4'::uuid 
        AND empresa_id = empresa_id_resultado
    ) THEN
        -- Criar membership
        INSERT INTO public.user_memberships (
            user_id, 
            empresa_id, 
            role, 
            status, 
            created_at
        ) VALUES (
            'bb230901-e06e-4f46-b263-7cdbd90ec9a4'::uuid,
            empresa_id_resultado,
            'owner',
            'active',
            now()
        );
    END IF;
END $$;