-- Habilitar realtime para as tabelas requests e tickets
ALTER PUBLICATION supabase_realtime ADD TABLE requests;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- Configurar replica identity para capturar mudanças completas
ALTER TABLE requests REPLICA IDENTITY FULL;
ALTER TABLE tickets REPLICA IDENTITY FULL;