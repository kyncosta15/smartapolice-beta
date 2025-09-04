-- Configurar replica identity para capturar mudanças completas
ALTER TABLE requests REPLICA IDENTITY FULL;
ALTER TABLE tickets REPLICA IDENTITY FULL;

-- Adicionar apenas tickets ao realtime (requests já existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
    END IF;
END $$;