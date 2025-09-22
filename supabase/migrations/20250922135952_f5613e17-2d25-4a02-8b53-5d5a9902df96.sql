-- Fix users_role_check constraint to include all valid roles
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

-- Add updated constraint with all valid roles used in the system
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role::text = ANY (ARRAY[
    'cliente'::text,
    'rh'::text,
    'admin'::text,
    'administrador'::text,
    'corretora_admin'::text,
    'gestor_rh'::text
]));

-- Also update the column default to use 'rh' instead of 'cliente' for SmartBeneficios system
ALTER TABLE public.users 
ALTER COLUMN role SET DEFAULT 'rh'::character varying;