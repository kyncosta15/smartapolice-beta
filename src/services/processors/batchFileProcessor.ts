
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

  constructor(
    updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void,
    removeFileStatus: (fileName: string) => void,
    onPolicyExtracted: (policy: ParsedPolicyData) => void
  ) {
    this.updateFileStatus = updateFileStatus;
    this.removeFileStatus = removeFileStatus;
    this.onPolicyExtracted = onPolicyExtracted;
  }

  async processBatch(files: File[], userId: string | null): Promise<ParsedPolicyData[]> {
    console.log(`📦 BatchFileProcessor: Processando ${files.length} arquivos com userId: ${userId}`);
    
    const results: ParsedPolicyData[] = [];
    
    for (const file of files) {
      try {
        const result = await this.processFile(file, userId);
        results.push(result);
        
        // Chamar onPolicyExtracted para cada apólice processada
        console.log(`📤 BatchFileProcessor: Chamando onPolicyExtracted para ${result.name}`);
        this.onPolicyExtracted(result);
        
      } catch (error) {
        console.error(`❌ Erro ao processar arquivo ${file.name}:`, error);
        this.updateFileStatus(file.name, {
          progress: 100,
          status: 'failed',
          message: `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
        
        // Remover após 5 segundos em caso de erro
        setTimeout(() => {
          this.removeFileStatus(file.name);
        }, 5000);
      }
    }
    
    return results;
  }

  private async processFile(file: File, userId: string | null): Promise<ParsedPolicyData> {
    const fileName = file.name;
    console.log(`📤 BatchFileProcessor: Processando arquivo ${fileName} com userId: ${userId}`);
    
    this.updateFileStatus(fileName, {
      progress: 0,
      status: 'uploading',
      message: 'Iniciando processamento...'
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    this.updateFileStatus(fileName, {
      progress: 30,
      status: 'processing',
      message: 'Extraindo dados...'
    });

    const dynamicData = await DynamicPDFExtractor.extractFromPDF(file, userId);
    
    this.updateFileStatus(fileName, {
      progress: 70,
      status: 'processing',
      message: 'Convertendo dados...'
    });

    const parsedPolicy = this.convertToParsedPolicy(dynamicData, fileName, file);

    this.updateFileStatus(fileName, {
      progress: 85,
      status: 'processing',
      message: 'Salvando no banco...'
    });

    // Usar savePolicyComplete para salvar arquivo + dados
    if (userId) {
      try {
        console.log(`💾 BatchFileProcessor: Iniciando savePolicyComplete para ${parsedPolicy.name}`);
        await PolicyPersistenceService.savePolicyComplete(file, parsedPolicy, userId);
        console.log(`✅ BatchFileProcessor: Persistência concluída para ${parsedPolicy.name}`);
      } catch (persistenceError) {
        console.error(`❌ BatchFileProcessor: Erro na persistência:`, persistenceError);
        
        // Fornecer mais detalhes do erro para debug
        this.updateFileStatus(fileName, {
          progress: 100,
          status: 'failed',
          message: `❌ Erro na persistência: ${persistenceError instanceof Error ? persistenceError.message : 'Erro desconhecido'}`
        });
        
        throw persistenceError;
      }
    } else {
      console.warn(`⚠️ BatchFileProcessor: userId não fornecido - saltando persistência`);
      throw new Error('UserId não fornecido para persistência');
    }

    this.updateFileStatus(fileName, {
      progress: 100,
      status: 'completed',
      message: `✅ Processado: ${parsedPolicy.insurer} - R$ ${parsedPolicy.monthlyAmount.toFixed(2)}/mês`
    });

    setTimeout(() => {
      this.removeFileStatus(fileName);
    }, 3000);

    return parsedPolicy;
  }

  private convertToParsedPolicy(data: any, fileName: string, file: File): ParsedPolicyData {
    console.log('🔍 Analisando estrutura dos dados recebidos:', data);
    
    // Verificar se é um array e pegar o primeiro item
    const policyData = Array.isArray(data) ? data[0] : data;
    console.log('📋 Dados da apólice para conversão:', policyData);
    
    // Verificar se tem os campos principais do N8N (estrutura direta)
    if (policyData && (policyData.segurado || policyData.seguradora || policyData.numero_apolice)) {
      console.log('✅ Reconhecendo como dados diretos do N8N');
      return N8NDataConverter.convertN8NDirectData(policyData, fileName, file);
    } 
    // Verificar se é estruturado (formato antigo)
    else if (policyData && policyData.informacoes_gerais && policyData.seguradora && policyData.vigencia) {
      console.log('✅ Reconhecendo como dados estruturados');
      return StructuredDataConverter.convertStructuredData(policyData, fileName, file);
    } 
    else {
      console.warn('⚠️ Estrutura não reconhecida, usando fallback. Dados:', policyData);
      return this.createFallbackPolicy(policyData, fileName, file);
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
