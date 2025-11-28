-- Adicionar foreign key de ticket_attachments para tickets
ALTER TABLE public.ticket_attachments
ADD CONSTRAINT ticket_attachments_ticket_id_fkey
FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;