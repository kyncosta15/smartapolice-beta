import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MigrateDocumentsButtonProps {
  vehicleId: string;
  vehiclePlaca?: string;
  vehicleChassi?: string;
  onMigrated?: () => void;
}

export function MigrateDocumentsButton({ 
  vehicleId, 
  vehiclePlaca, 
  vehicleChassi,
  onMigrated 
}: MigrateDocumentsButtonProps) {
  const [migrating, setMigrating] = useState(false);

  const migrateDocuments = async () => {
    if (!vehiclePlaca && !vehicleChassi) {
      toast.error('Veículo deve ter placa ou chassi para migrar documentos');
      return;
    }

    setMigrating(true);
    try {
      // Buscar solicitações executadas para este veículo
      const { data: requestsData, error: requestsError } = await supabase
        .from('fleet_change_requests')
        .select('id')
        .or(`placa.eq.${vehiclePlaca},chassi.eq.${vehicleChassi}`)
        .eq('status', 'executado');

      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        toast.info('Nenhuma solicitação executada encontrada para este veículo');
        return;
      }

      // Buscar documentos para essas solicitações
      const requestIds = requestsData.map(r => r.id);
      const { data: docsData, error: docsError } = await supabase
        .from('fleet_request_documents')
        .select('*')
        .in('request_id', requestIds);

      if (docsError) throw docsError;

      if (!docsData || docsData.length === 0) {
        toast.info('Nenhum documento encontrado nas solicitações');
        return;
      }

      // Verificar quais documentos já existem na tabela frota_documentos
      const { data: existingDocs, error: existingError } = await supabase
        .from('frota_documentos')
        .select('nome_arquivo, tamanho_arquivo')
        .eq('veiculo_id', vehicleId);

      if (existingError) throw existingError;

      // Filtrar documentos que não existem ainda
      const newDocs = docsData.filter(doc => 
        !existingDocs?.some(existing => 
          existing.nome_arquivo === doc.file_name && 
          existing.tamanho_arquivo === doc.file_size
        )
      );

      if (newDocs.length === 0) {
        toast.info('Todos os documentos já foram migrados');
        return;
      }

      // Preparar dados para inserção na tabela frota_documentos
      const documentsToInsert = newDocs.map(doc => ({
        veiculo_id: vehicleId,
        tipo: getDocumentType(doc.file_name),
        nome_arquivo: doc.file_name,
        url: doc.file_url,
        tamanho_arquivo: doc.file_size,
        tipo_mime: doc.mime_type,
        origem: 'external',
      }));

      // Inserir documentos migrados
      const { error: insertError } = await supabase
        .from('frota_documentos')
        .insert(documentsToInsert);

      if (insertError) throw insertError;

      toast.success(`${newDocs.length} documento(s) migrado(s) com sucesso!`);
      onMigrated?.();
      
    } catch (error) {
      console.error('Erro ao migrar documentos:', error);
      toast.error('Erro ao migrar documentos do link externo');
    } finally {
      setMigrating(false);
    }
  };

  const getDocumentType = (fileName: string): string => {
    const ext = fileName.toLowerCase().split('.').pop();
    const typeMap: Record<string, string> = {
      pdf: 'PDF',
      doc: 'DOC',
      docx: 'DOCX',
      jpg: 'Imagem',
      jpeg: 'Imagem',
      png: 'Imagem',
      xls: 'Planilha',
      xlsx: 'Planilha',
    };
    return typeMap[ext || ''] || 'Documento';
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={migrateDocuments}
      disabled={migrating}
      className="gap-2"
    >
      {migrating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Migrando...
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Migrar Documentos do Link Externo
        </>
      )}
    </Button>
  );
}