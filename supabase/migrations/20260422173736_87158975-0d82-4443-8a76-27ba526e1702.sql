CREATE POLICY "Users can delete assignment history for their company vehicles"
ON public.vehicle_assignment_history
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.frota_veiculos v
    JOIN public.user_memberships um ON um.empresa_id = v.empresa_id
    WHERE v.id = vehicle_assignment_history.vehicle_id
      AND um.user_id = auth.uid()
  )
);