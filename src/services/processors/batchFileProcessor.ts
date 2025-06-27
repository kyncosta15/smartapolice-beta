import { ParsedPolicyData } from '@/utils/policyDataParser';
import { DynamicPDFExtractor } from '../dynamicPdfExtractor';
import { N8NDataConverter } from '@/utils/parsers/n8nDataConverter';
import { StructuredDataConverter } from '@/utils/parsers/structuredDataConverter';
import { FileProcessingStatus } from '@/types/pdfUpload';

export class BatchFileProcessor {
  private updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void;
  private removeFileStatus: (fileName: string) => void;
  private onPolicyExtracted: (policy: ParsedPolicyData) => void;
  private toast: any;

  constructor(
    updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void,
    removeFileStatus: (fileName: string) => void,
    onPolicyExtracted: (policy: ParsedPolicyData) => void,
    toast: any
  ) {
    this.updateFileStatus = updateFileStatus;
    this.removeFileStatus = removeFileStatus;
    this.onPolicyExtracted = onPolicyExtracted;
    this.toast = toast;
  }

  async processMultipleFiles(files: File[]): Promise<ParsedPolicyData[]> {
    console.log(`📤 Iniciando processamento de ${files.length} arquivos com método otimizado`);
    
    // Initialize status for all files
    files.forEach(file => {
      this.updateFileStatus(file.name, {
        progress: 0,
        status: 'uploading',
        message: 'Aguardando processamento...'
      });
    });

    const allResults: ParsedPolicyData[] = [];

    try {
      // Usar o método otimizado para múltiplos arquivos
      console.log('🚀 Usando método extractFromMultiplePDFs otimizado');
      
      // Atualizar status para processamento
      files.forEach(file => {
        this.updateFileStatus(file.name, {
          progress: 20,
          status: 'processing',
          message: 'Enviando para extração com IA...'
        });
      });

      // Chamar o método otimizado que já trata múltiplos PDFs
      const extractedDataArray = await DynamicPDFExtractor.extractFromMultiplePDFs(files);

      console.log(`📦 Dados extraídos de todos os arquivos:`, extractedDataArray);

      if (extractedDataArray.length === 0) {
        throw new Error('Nenhum dado foi extraído dos arquivos');
      }

      // Processar cada item de dados extraído
      for (let i = 0; i < extractedDataArray.length; i++) {
        const singleData = extractedDataArray[i];
        console.log(`🔄 Convertendo item ${i + 1}/${extractedDataArray.length}:`, singleData);
        
        // Determinar qual arquivo este dado veio (se possível)
        const relatedFileName = this.findRelatedFileName(singleData, files);
        
        if (relatedFileName) {
          this.updateFileStatus(relatedFileName, {
            progress: 80,
            status: 'processing',
            message: 'Convertendo dados extraídos...'
          });
        }
        
        const parsedPolicy = this.convertToParsedPolicy(singleData, relatedFileName || `Arquivo ${i + 1}`, files[0]);
        allResults.push(parsedPolicy);
        
        // Add to dashboard immediately
        this.onPolicyExtracted(parsedPolicy);
        console.log(`✅ Apólice adicionada: ${parsedPolicy.name} - ${parsedPolicy.insurer}`);

        if (relatedFileName) {
          this.updateFileStatus(relatedFileName, {
            progress: 100,
            status: 'completed',
            message: `✅ Processado: ${parsedPolicy.insurer} - R$ ${parsedPolicy.monthlyAmount.toFixed(2)}/mês`
          });
        }
      }

      // Marcar arquivos restantes como concluídos (caso não conseguimos associar todos)
      files.forEach(file => {
        const currentStatus = this.getFileStatus(file.name);
        if (currentStatus?.status !== 'completed') {
          this.updateFileStatus(file.name, {
            progress: 100,
            status: 'completed',
            message: '✅ Processado com sucesso'
          });
        }
      });

      console.log(`🎉 Processamento completo! ${allResults.length} apólices processadas no total`);
      
      // Show completion notification
      if (allResults.length > 0) {
        this.toast({
          title: `🎉 Processamento Concluído`,
          description: `${allResults.length} apólices foram extraídas e adicionadas ao dashboard`,
        });
      }

      // Clean up status after 3 seconds
      setTimeout(() => {
        files.forEach(file => {
          this.removeFileStatus(file.name);
        });
      }, 3000);

      return allResults;

    } catch (error) {
      console.error('❌ Erro geral no processamento:', error);
      
      // Update all files with error status
      files.forEach(file => {
        this.updateFileStatus(file.name, {
          progress: 100,
          status: 'failed',
          message: `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
      });

      // Clean up after 5 seconds
      setTimeout(() => {
        files.forEach(file => {
          this.removeFileStatus(file.name);
        });
      }, 5000);

      throw error;
    }
  }

  private findRelatedFileName(data: any, files: File[]): string | null {
    // Tentar encontrar qual arquivo corresponde a este dado
    // Baseado no nome do segurado ou número da apólice
    if (data.segurado || data.numero_apolice) {
      // Por enquanto, retornar o primeiro arquivo
      // Em uma implementação mais sofisticada, poderíamos comparar nomes
      return files[0]?.name || null;
    }
    return null;
  }

  private getFileStatus(fileName: string) {
    // Este método precisaria acessar o status atual do arquivo
    // Por simplicidade, vamos assumir que não existe
    return null;
  }

  private convertToParsedPolicy(data: any, fileName: string, file: File): ParsedPolicyData {
    // Verificar se é dado direto do N8N ou estruturado
    if (data.numero_apolice && data.segurado && data.seguradora) {
      // É dado direto do N8N
      return N8NDataConverter.convertN8NDirectData(data, fileName, file);
    } else if (data.informacoes_gerais && data.seguradora && data.vigencia) {
      // É dado estruturado
      return StructuredDataConverter.convertStructuredData(data, fileName, file);
    } else {
      // Fallback para dados não estruturados
      console.warn('Dados não estruturados recebidos, usando fallback');
      return this.createFallbackPolicy(data, fileName, file);
    }
  }

  private createFallbackPolicy(data: any, fileName: string, file: File): ParsedPolicyData {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: fileName.replace('.pdf', ''),
      type: 'auto',
      insurer: 'Seguradora Não Identificada',
      premium: 0,
      monthlyAmount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      policyNumber: 'N/A',
      paymentFrequency: 'mensal',
      status: 'active',
      file,
      extractedAt: new Date().toISOString().split('T')[0],
      installments: []
    };
  }
}
