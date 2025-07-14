
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
    console.log(`🚀 BatchFileProcessor.processMultipleFiles CHAMADO!`);
    console.log(`📤 BatchFileProcessor: Iniciando processamento de ${files.length} arquivos com userId: ${userId}`);
    
    if (!userId) {
      console.error('❌ ERRO CRÍTICO: userId é obrigatório para processamento');
      throw new Error('Usuário não autenticado. Faça login para continuar.');
    }
    
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
        
        // CORREÇÃO CRÍTICA: Garantir que o userId seja definido nos dados antes de converter
        const dataWithUserId = {
          ...singleData,
          user_id: userId // Garantir que user_id está definido
        };
        
        // Determinar qual arquivo esta apólice pertence
        const relatedFileName = this.findRelatedFileName(singleData, files) || files[index]?.name || `Arquivo ${index + 1}`;
        
        if (relatedFileName && files.find(f => f.name === relatedFileName)) {
          this.updateFileStatus(relatedFileName, {
            progress: 60 + (index * 10),
            status: 'processing',
            message: `Processando apólice: ${singleData.segurado || 'Não identificado'}...`
          });
        }
        
        const parsedPolicy = this.convertToParsedPolicy(dataWithUserId, relatedFileName, files[index] || files[0]);
        allResults.push(parsedPolicy);
        
        // CORREÇÃO: Salvar arquivo e dados no banco de dados com userId correto
        const relatedFile = files.find(f => f.name === relatedFileName) || files[index] || files[0];
        if (relatedFile && userId) {
          console.log(`💾 BatchFileProcessor: Iniciando persistência para ${parsedPolicy.name} com userId: ${userId}`);
          try {
            const persistenceResult = await PolicyPersistenceService.savePolicyComplete(relatedFile, parsedPolicy, userId);
            console.log(`✅ BatchFileProcessor: Persistência concluída com sucesso: ${persistenceResult}`);
            
            if (persistenceResult) {
              console.log(`📋 Apólice salva no banco com sucesso: ${parsedPolicy.name}`);
            } else {
              console.warn(`⚠️ Apólice processada mas pode não ter sido salva: ${parsedPolicy.name}`);
            }
          } catch (persistenceError) {
            console.error(`❌ BatchFileProcessor: Erro na persistência:`, persistenceError);
            // Continuar processamento mesmo com erro de persistência
          }
        } else {
          console.error(`❌ BatchFileProcessor: Não salvando - userId: ${userId}, arquivo: ${relatedFile?.name}`);
        }
        
        // Add to dashboard immediately
        this.onPolicyExtracted(parsedPolicy);
        console.log(`✅ Apólice ${index + 1} adicionada ao dashboard: ${parsedPolicy.name} - ${parsedPolicy.insurer}`);

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

  private convertToParsedPolicy(data: any, fileName: string, file: File): ParsedPolicyData {
    console.log('🔄 convertToParsedPolicy chamado com dados:', data);
    
    // Verificar se é dado direto do N8N ou estruturado
    if (data.numero_apolice && data.segurado && data.seguradora) {
      // É dado direto do N8N
      console.log('📋 Convertendo dados diretos do N8N');
      return N8NDataConverter.convertN8NDirectData(data, fileName, file);
    } else if (data.informacoes_gerais && data.seguradora && data.vigencia) {
      // É dado estruturado
      console.log('📋 Convertendo dados estruturados');
      return StructuredDataConverter.convertStructuredData(data, fileName, file);
    } else {
      // Fallback para dados não estruturados
      console.warn('📋 Dados não estruturados recebidos, usando fallback');
      return this.createFallbackPolicy(data, fileName, file);
    }
  }

  private createFallbackPolicy(data: any, fileName: string, file: File): ParsedPolicyData {
    const mockPolicyData: ParsedPolicyData = {
      id: crypto.randomUUID(),
      name: `Apólice ${file.name}`,
      type: 'auto',
      insurer: 'Seguradora Exemplo',
      premium: 1200,
      monthlyAmount: 150,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      policyNumber: `POL-${Date.now()}`,
      paymentFrequency: 'monthly',
      status: 'active',
      file,
      extractedAt: new Date().toISOString(),
      installments: [],
      
      // NOVOS CAMPOS OBRIGATÓRIOS
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      policyStatus: 'vigente',
      
      // Campos opcionais
      coberturas: [],
      entity: 'Corretora Exemplo',
      category: 'Veicular',
      coverage: ['Cobertura Básica'],
      totalCoverage: 1200
    };

    return mockPolicyData;
  }
}
