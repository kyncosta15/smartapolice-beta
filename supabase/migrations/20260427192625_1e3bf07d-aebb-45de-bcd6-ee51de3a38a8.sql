
-- Drop restrictive policies
DROP POLICY IF EXISTS "Users can insert attachments for their company" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Users can view attachments from their company" ON public.ticket_attachments;

-- Allow any authenticated user from the same empresa as the ticket to view
CREATE POLICY "Members can view ticket attachments"
ON public.ticket_attachments FOR SELECT
TO authenticated
USING (
  (ticket_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_attachments.ticket_id
      AND public.is_member_of(t.empresa_id)
  ))
  OR
  (vehicle_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.frota_veiculos fv
    WHERE fv.id = ticket_attachments.vehicle_id
      AND public.is_member_of(fv.empresa_id)
  ))
);

-- Allow insert for members of the empresa
CREATE POLICY "Members can insert ticket attachments"
ON public.ticket_attachments FOR INSERT
TO authenticated
WITH CHECK (
  (ticket_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_attachments.ticket_id
      AND public.is_member_of(t.empresa_id)
  ))
  OR
  (vehicle_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.frota_veiculos fv
    WHERE fv.id = ticket_attachments.vehicle_id
      AND public.is_member_of(fv.empresa_id)
  ))
);

-- Allow delete for members of the empresa
CREATE POLICY "Members can delete ticket attachments"
ON public.ticket_attachments FOR DELETE
TO authenticated
USING (
  (ticket_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_attachments.ticket_id
      AND public.is_member_of(t.empresa_id)
  ))
  OR
  (vehicle_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.frota_veiculos fv
    WHERE fv.id = ticket_attachments.vehicle_id
      AND public.is_member_of(fv.empresa_id)
  ))
);
