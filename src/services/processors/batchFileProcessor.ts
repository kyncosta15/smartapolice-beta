
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
    console.log(`🚀 [BatchFileProcessor] Iniciando processamento de ${files.length} arquivos`);
    console.log(`👤 [BatchFileProcessor] UserId: ${userId}`);
    
    if (!userId) {
      console.error('❌ [BatchFileProcessor] UserId não fornecido - não será possível persistir');
      this.toast({
        title: "❌ Erro de Autenticação",
        description: "Usuário não autenticado. Faça login para continuar.",
        variant: "destructive",
      });
      return [];
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
      console.log('🚀 [BatchFileProcessor] Chamando DynamicPDFExtractor...');
      
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

      console.log(`📦 [BatchFileProcessor] Dados extraídos: ${extractedDataArray.length} itens`);

      if (extractedDataArray.length === 0) {
        throw new Error('Nenhum dado foi extraído dos arquivos');
      }

      // Processar cada item de dados extraído individualmente
      for (let index = 0; index < extractedDataArray.length; index++) {
        const singleData = extractedDataArray[index];
        console.log(`🔄 [BatchFileProcessor] Processando apólice ${index + 1}/${extractedDataArray.length}`);
        
        const relatedFileName = this.findRelatedFileName(singleData, files) || files[index]?.name || `Arquivo ${index + 1}`;
        
        if (relatedFileName && files.find(f => f.name === relatedFileName)) {
          this.updateFileStatus(relatedFileName, {
            progress: 60 + (index * 10),
            status: 'processing',
            message: `Processando: ${singleData.segurado || 'Segurado não identificado'}...`
          });
        }
        
        const parsedPolicy = this.convertToParsedPolicy(singleData, relatedFileName, files[index] || files[0]);
        
        console.log(`✅ [BatchFileProcessor] Apólice convertida:`, {
          id: parsedPolicy.id,
          name: parsedPolicy.name,
          insurer: parsedPolicy.insurer
        });
        
        allResults.push(parsedPolicy);
        
        // Salvar no banco de dados
        const relatedFile = files.find(f => f.name === relatedFileName) || files[index] || files[0];
        if (relatedFile && userId) {
          console.log(`💾 [BatchFileProcessor] Salvando no banco: ${parsedPolicy.name}`);
          try {
            const persistenceResult = await PolicyPersistenceService.savePolicyComplete(relatedFile, parsedPolicy, userId);
            console.log(`✅ [BatchFileProcessor] Persistência resultado: ${persistenceResult}`);
            
            if (!persistenceResult) {
              console.error(`❌ [BatchFileProcessor] Falha na persistência da apólice ${parsedPolicy.name}`);
            }
          } catch (persistenceError) {
            console.error(`❌ [BatchFileProcessor] Erro na persistência:`, persistenceError);
            // Continuar processamento mesmo com erro de persistência
          }
        }
        
        // CRÍTICO: Chamar onPolicyExtracted para adicionar ao dashboard
        console.log(`📢 [BatchFileProcessor] Chamando onPolicyExtracted para: ${parsedPolicy.name}`);
        this.onPolicyExtracted(parsedPolicy);

        if (relatedFileName && files.find(f => f.name === relatedFileName)) {
          this.updateFileStatus(relatedFileName, {
            progress: 90 + (index * 2),
            status: 'processing',
            message: `✅ Processado: ${parsedPolicy.insurer} - R$ ${parsedPolicy.monthlyAmount.toFixed(2)}/mês`
          });
        }
      }

      // Marcar todos os arquivos como concluídos
      files.forEach((file, index) => {
        this.updateFileStatus(file.name, {
          progress: 100,
          status: 'completed',
          message: `✅ Concluído (${index + 1}/${files.length})`
        });
      });

      console.log(`🎉 [BatchFileProcessor] Processamento completo! ${allResults.length} apólices processadas`);
      
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
      console.error('❌ [BatchFileProcessor] Erro geral no processamento:', error);
      
      // Update all files with error status
      files.forEach(file => {
        this.updateFileStatus(file.name, {
          progress: 100,
          status: 'failed',
          message: `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
      });

      this.toast({
        title: "❌ Erro no Processamento",
        description: `Falha no processamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
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
    // Verificar se é dado direto do N8N ou estruturado
    if (data.numero_apolice && data.segurado && data.seguradora) {
      // É dado direto do N8N
      return N8NDataConverter.convertN8NDirectData(data, fileName, file);
    } else if (data.informacoes_gerais && data.seguradora && data.vigencia) {
      // É dado estruturado
      return StructuredDataConverter.convertStructuredData(data, fileName, file);
    } else {
      // Fallback para dados não estruturados
      console.warn('[BatchFileProcessor] Dados não estruturados recebidos, usando fallback');
      return this.createFallbackPolicy(data, fileName, file);
    }
  }

  private createFallbackPolicy(data: any, fileName: string, file: File): ParsedPolicyData {
    const mockPolicyData: ParsedPolicyData = {
      id: crypto.randomUUID(),
      name: data.segurado || `Apólice ${file.name}`,
      type: 'auto',
      insurer: data.seguradora || 'Seguradora Exemplo',
      premium: data.valor_premio || 1200,
      monthlyAmount: data.custo_mensal || 150,
      startDate: data.inicio_vigencia || new Date().toISOString().split('T')[0],
      endDate: data.fim_vigencia || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      policyNumber: data.numero_apolice || `POL-${Date.now()}`,
      paymentFrequency: 'monthly',
      status: 'vigente',
      file,
      extractedAt: new Date().toISOString(),
      installments: [],
      
      // NOVOS CAMPOS OBRIGATÓRIOS
      expirationDate: data.fim_vigencia || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      policyStatus: 'vigente',
      
      // Campos opcionais
      coberturas: [],
      entity: 'Corretora Exemplo',
      category: 'Veicular',
      coverage: ['Cobertura Básica'],
      totalCoverage: data.valor_premio || 1200
    };

    return mockPolicyData;
  }
}
