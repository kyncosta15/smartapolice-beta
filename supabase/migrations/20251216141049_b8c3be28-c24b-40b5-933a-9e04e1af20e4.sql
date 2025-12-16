
-- Add membership for gruporcaldas@rcaldas.com.br to access RCaldas fleet
INSERT INTO public.user_memberships (user_id, empresa_id, role, created_at)
VALUES (
  '021cfc78-0098-4270-bf72-4c3674b55090',  -- gruporcaldas@rcaldas.com.br
  '276bb418-bedd-4c23-9729-2716b55c9a7b',  -- empresa RCaldas (272 veículos)
  'member',
  now()
)
ON CONFLICT (user_id, empresa_id) DO NOTHING;
