import { ParsedPolicyData } from '@/utils/policyDataParser';
import { DynamicPDFExtractor } from '../dynamicPdfExtractor';
import { N8NDataConverter } from '@/utils/parsers/n8nDataConverter';
import { StructuredDataConverter } from '@/utils/parsers/structuredDataConverter';
import { FileProcessingStatus } from '@/types/pdfUpload';
import { PolicyPersistenceService } from '../policyPersistenceService';

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

  async processMultipleFiles(files: File[], userId: string | null): Promise<ParsedPolicyData[]> {
    console.log(`📤 BatchFileProcessor: Iniciando processamento de ${files.length} arquivos com userId: ${userId}`);
    
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
      console.log(`👤 Garantindo que userId ${userId} será enviado no FormData`);
      
      // Atualizar status para processamento
      files.forEach(file => {
        this.updateFileStatus(file.name, {
          progress: 20,
          status: 'processing',
          message: 'Enviando para extração com IA...'
        });
      });

      // Chamar o método otimizado que já trata múltiplos PDFs com userId
      const extractedDataArray = await DynamicPDFExtractor.extractFromMultiplePDFs(files, userId);

      console.log(`📦 Dados extraídos de todos os arquivos (${extractedDataArray.length} itens):`, extractedDataArray);

      if (extractedDataArray.length === 0) {
        throw new Error('Nenhum dado foi extraído dos arquivos');
      }

      // Processar cada item de dados extraído individualmente
      for (let index = 0; index < extractedDataArray.length; index++) {
        const singleData = extractedDataArray[index];
        console.log(`🔄 Processando apólice ${index + 1}/${extractedDataArray.length}:`, singleData);
        
        // Determinar qual arquivo esta apólice pertence
        const relatedFileName = this.findRelatedFileName(singleData, files) || files[index]?.name || `Arquivo ${index + 1}`;
        
        if (relatedFileName && files.find(f => f.name === relatedFileName)) {
          this.updateFileStatus(relatedFileName, {
            progress: 60 + (index * 10),
            status: 'processing',
            message: `Processando apólice: ${singleData.segurado || 'Não identificado'}...`
          });
        }
        
        const parsedPolicy = this.convertToParsedPolicy(singleData, relatedFileName, files[index] || files[0]);
        allResults.push(parsedPolicy);
        
        // Salvar arquivo e dados no banco de dados
        const relatedFile = files.find(f => f.name === relatedFileName) || files[index] || files[0];
        if (relatedFile && userId) {
          console.log(`💾 Salvando persistência para: ${parsedPolicy.name}`);
          try {
            const persistenceResult = await PolicyPersistenceService.savePolicyComplete(relatedFile, parsedPolicy, userId);
            console.log(`💾 Resultado da persistência: ${persistenceResult}`);
          } catch (persistenceError) {
            console.error(`❌ Erro na persistência:`, persistenceError);
          }
        } else {
          console.warn(`⚠️ Não salvando persistência - userId: ${userId}, arquivo: ${relatedFile?.name}`);
        }
        
        // Add to dashboard immediately
        this.onPolicyExtracted(parsedPolicy);
        console.log(`✅ Apólice ${index + 1} adicionada: ${parsedPolicy.name} - ${parsedPolicy.insurer}`);

        if (relatedFileName && files.find(f => f.name === relatedFileName)) {
          this.updateFileStatus(relatedFileName, {
            progress: 90 + (index * 2),
            status: 'processing',
            message: `✅ Salvando: ${parsedPolicy.insurer} - R$ ${parsedPolicy.monthlyAmount.toFixed(2)}/mês`
          });
        }
      }

      // Marcar todos os arquivos como concluídos
      files.forEach((file, index) => {
        this.updateFileStatus(file.name, {
          progress: 100,
          status: 'completed',
          message: `✅ Processado com sucesso (${index + 1}/${files.length})`
        });
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
    // Tentar encontrar qual arquivo corresponde a este dado baseado no segurado
    if (data.segurado) {
      const seguradoName = data.segurado.toLowerCase();
      const matchingFile = files.find(file => {
        const fileName = file.name.toLowerCase();
        const firstNames = seguradoName.split(' ').slice(0, 2); // Pegar primeiros 2 nomes
        return firstNames.some(name => fileName.includes(name));
      });
      return matchingFile?.name || null;
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
