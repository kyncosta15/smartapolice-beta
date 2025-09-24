-- Insert user membership for the current user to their company
INSERT INTO public.user_memberships (user_id, empresa_id, role)
SELECT u.id, e.id, 'admin'
FROM users u
JOIN empresas e ON u.company::text = e.nome
WHERE u.id = 'cf371e40-f630-4d8e-ab6e-5e2b86a6feb3'
ON CONFLICT (user_id, empresa_id) DO NOTHING;