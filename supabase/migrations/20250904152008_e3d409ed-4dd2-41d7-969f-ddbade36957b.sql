-- Criar perfil para o usuário beneficios@rcaldas.com.br
INSERT INTO public.profiles (id, email, full_name, role, is_active, company)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Usuário Benefícios'),
    'rh' as role,
    true as is_active,
    u.raw_user_meta_data->>'company'
FROM auth.users u
WHERE u.email = 'beneficios@rcaldas.com.br'
AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);