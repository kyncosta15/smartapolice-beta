-- 1. Extend app_role enum to cover legacy values used in users.role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid='public.app_role'::regtype AND enumlabel='administrador') THEN
    ALTER TYPE public.app_role ADD VALUE 'administrador';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid='public.app_role'::regtype AND enumlabel='corretora_admin') THEN
    ALTER TYPE public.app_role ADD VALUE 'corretora_admin';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid='public.app_role'::regtype AND enumlabel='gestor_rh') THEN
    ALTER TYPE public.app_role ADD VALUE 'gestor_rh';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid='public.app_role'::regtype AND enumlabel='cliente') THEN
    ALTER TYPE public.app_role ADD VALUE 'cliente';
  END IF;
END $$;