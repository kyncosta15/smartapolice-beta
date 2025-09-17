-- Fix critical security vulnerability in request_items table
-- Drop the overly permissive public policies
DROP POLICY IF EXISTS "Permitir atualização pública de request_items" ON public.request_items;
DROP POLICY IF EXISTS "Permitir criação pública de request_items" ON public.request_items;

-- Create secure RLS policies for request_items table
-- Allow insertion only for valid authenticated sessions with active tokens
CREATE POLICY "Authenticated users can create request items for valid sessions"
ON public.request_items
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.requests r
    JOIN public.session_tokens st ON r.session_id = st.session_id
    WHERE r.id = request_id 
    AND st.expires_at > now()
    AND st.used_at IS NULL
  )
);

-- Allow updates only by HR/Admin users for requests in their company
CREATE POLICY "HR and Admin can update request items for their company"
ON public.request_items
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM public.requests r
    JOIN public.employees emp ON r.employee_id = emp.id
    JOIN public.users u ON true
    JOIN public.empresas e ON u.company::text = e.nome
    WHERE r.id = request_id
    AND u.id = auth.uid()
    AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin'])
    AND e.id = emp.company_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.requests r
    JOIN public.employees emp ON r.employee_id = emp.id
    JOIN public.users u ON true
    JOIN public.empresas e ON u.company::text = e.nome
    WHERE r.id = request_id
    AND u.id = auth.uid()
    AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin'])
    AND e.id = emp.company_id
  )
);

-- Allow deletion only by HR/Admin users for requests in their company
CREATE POLICY "HR and Admin can delete request items for their company"
ON public.request_items
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM public.requests r
    JOIN public.employees emp ON r.employee_id = emp.id
    JOIN public.users u ON true
    JOIN public.empresas e ON u.company::text = e.nome
    WHERE r.id = request_id
    AND u.id = auth.uid()
    AND u.role::text = ANY(ARRAY['rh', 'admin', 'administrador', 'corretora_admin'])
    AND e.id = emp.company_id
  )
);