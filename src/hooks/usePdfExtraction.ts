import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDocumentoAnexos } from '@/services/corpnuvem/anexos';
import { useToast } from '@/hooks/use-toast';

export function usePdfExtraction() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const extractFromPolicy = async (policyId: string, nosnum: number, codfil: number) => {
    setIsProcessing(true);

    try {
      console.log('🔍 Buscando PDF da apólice via CorpNuvem API...');
      
      // Buscar anexos do documento
      const anexosData = await getDocumentoAnexos({ nosnum, codfil });
      
      if (!anexosData?.anexos || anexosData.anexos.length === 0) {
        throw new Error('Nenhum anexo encontrado para esta apólice');
      }

      // Procurar primeiro PDF
      const pdfAnexo = anexosData.anexos.find((anexo: any) => 
        anexo.tipo?.toLowerCase().includes('pdf') || 
        anexo.nome?.toLowerCase().includes('pdf') ||
        anexo.nome?.toLowerCase().includes('apolice')
      );

      if (!pdfAnexo || !pdfAnexo.url) {
        throw new Error('PDF não encontrado nos anexos desta apólice');
      }

      console.log('📄 PDF encontrado:', pdfAnexo.url);
      
      toast({
        title: "PDF encontrado!",
        description: "Iniciando processamento e extração de dados...",
      });

      // Chamar edge function para processar o PDF
      console.log('🚀 Chamando edge function extract-pdf-data...');
      
      const { data, error } = await supabase.functions.invoke('extract-pdf-data', {
        body: { 
          pdf_url: pdfAnexo.url,
          policy_id: policyId 
        }
      });

      if (error) throw error;

      console.log('✅ Processamento concluído:', data);
      console.log('📊 JSON DOS DADOS EXTRAÍDOS:', JSON.stringify(data.extracted_data, null, 2));
      console.log('🔍 DEBUG INFO:', JSON.stringify(data.debug_info, null, 2));

      toast({
        title: "✅ Extração concluída!",
        description: data.message || "Dados extraídos e salvos com sucesso",
      });

      return { success: true, data };

    } catch (error) {
      console.error('❌ Erro na extração:', error);
      
      toast({
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });

      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  const extractFromClient = async (clientId: string) => {
    setIsProcessing(true);

    try {
      console.log('🚀 Processando PDF do cliente:', clientId);
      
      const { data, error } = await supabase.functions.invoke('extract-pdf-data', {
        body: { client_id: clientId }
      });

      if (error) throw error;

      toast({
        title: "✅ PDF Processado!",
        description: data.message || "Apólice extraída e salva com sucesso",
      });

      return { success: true, data };

    } catch (error) {
      console.error('❌ Erro:', error);
      
      toast({
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });

      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    extractFromPolicy,
    extractFromClient
  };
}
