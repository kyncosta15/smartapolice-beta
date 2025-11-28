-- Remover constraint restritiva do campo tipo em ticket_attachments
ALTER TABLE public.ticket_attachments DROP CONSTRAINT IF EXISTS ticket_attachments_tipo_check;