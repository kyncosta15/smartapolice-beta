
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
    
    if (!userId) {
      console.error('❌ BatchFileProcessor: userId é obrigatório');
      throw new Error('Usuário não autenticado');
    }

    const results: ParsedPolicyData[] = [];
    
    for (const file of files) {
      try {
        console.log(`🔄 Processando arquivo: ${file.name}`);
        const result = await this.processFile(file, userId);
        
        if (result) {
          results.push(result);
          console.log(`✅ Arquivo processado com sucesso: ${file.name}`);
          
          // Chamar callback imediatamente após sucesso
          this.onPolicyExtracted(result);
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar arquivo ${file.name}:`, error);
        this.updateFileStatus(file.name, {
          progress: 100,
          status: 'failed',
          message: `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
        
        setTimeout(() => {
          this.removeFileStatus(file.name);
        }, 5000);
      }
    }
    
    console.log(`🎉 Batch processado: ${results.length} de ${files.length} arquivos com sucesso`);
    return results;
  }

  private async processFile(file: File, userId: string): Promise<ParsedPolicyData> {
    const fileName = file.name;
    console.log(`📤 Processando arquivo: ${fileName}`);
    
    this.updateFileStatus(fileName, {
      progress: 0,
      status: 'uploading',
      message: 'Iniciando processamento...'
    });

    // 1. Extrair dados do PDF
    this.updateFileStatus(fileName, {
      progress: 30,
      status: 'processing',
      message: 'Extraindo dados do PDF...'
    });

    const extractedData = await DynamicPDFExtractor.extractFromPDF(file, userId);
    console.log(`📋 Dados extraídos de ${fileName}:`, extractedData);

    if (!extractedData || (Array.isArray(extractedData) && extractedData.length === 0)) {
      throw new Error('Nenhum dado foi extraído do PDF');
    }

    // 2. Converter dados para formato da aplicação
    this.updateFileStatus(fileName, {
      progress: 60,
      status: 'processing',
      message: 'Convertendo dados...'
    });

    const parsedPolicy = this.convertToParsedPolicy(extractedData, fileName, file);
    console.log(`📄 Apólice convertida:`, parsedPolicy);

    // 3. Salvar no banco de dados
    this.updateFileStatus(fileName, {
      progress: 85,
      status: 'processing',
      message: 'Salvando no banco...'
    });

    try {
      await PolicyPersistenceService.savePolicyComplete(file, parsedPolicy, userId);
      console.log(`💾 Apólice salva com sucesso: ${parsedPolicy.name}`);
    } catch (persistenceError) {
      console.error(`❌ Erro na persistência:`, persistenceError);
      throw new Error(`Falha ao salvar no banco: ${persistenceError instanceof Error ? persistenceError.message : 'Erro desconhecido'}`);
    }

    // 4. Finalizar com sucesso
    this.updateFileStatus(fileName, {
      progress: 100,
      status: 'completed',
      message: `✅ ${parsedPolicy.insurer} - R$ ${parsedPolicy.monthlyAmount.toFixed(2)}/mês`
    });

    setTimeout(() => {
      this.removeFileStatus(fileName);
    }, 3000);

    return parsedPolicy;
  }

  private convertToParsedPolicy(data: any, fileName: string, file: File): ParsedPolicyData {
    console.log('🔍 Convertendo dados extraídos:', data);
    
    // Garantir que temos dados válidos
    if (!data) {
      throw new Error('Dados extraídos estão vazios');
    }

    // Normalizar dados (se for array, pegar primeiro item)
    const policyData = Array.isArray(data) ? data[0] : data;
    
    if (!policyData) {
      throw new Error('Dados da apólice estão vazios');
    }

    console.log('📋 Dados da apólice para conversão:', policyData);
    
    // Verificar se é formato N8N direto
    if (this.isN8NDirectData(policyData)) {
      console.log('✅ Convertendo como dados diretos do N8N');
      return N8NDataConverter.convertN8NDirectData(policyData, fileName, file);
    }
    
    // Verificar se é formato estruturado
    if (this.isStructuredData(policyData)) {
      console.log('✅ Convertendo como dados estruturados');
      return StructuredDataConverter.convertStructuredData(policyData, fileName, file);
    }
    
    // Fallback para dados básicos
    console.warn('⚠️ Usando fallback para conversão');
    return this.createFallbackPolicy(policyData, fileName, file);
  }

  private isN8NDirectData(data: any): boolean {
    return data && (
      data.segurado || 
      data.seguradora || 
      data.numero_apolice ||
      data.documento ||
      data.custo_mensal
    );
  }

  private isStructuredData(data: any): boolean {
    return data && 
      data.informacoes_gerais && 
      data.seguradora && 
      data.vigencia;
  }

  private createFallbackPolicy(data: any, fileName: string, file: File): ParsedPolicyData {
    console.log('🔄 Criando apólice fallback para:', fileName);
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: fileName.replace('.pdf', ''),
      type: 'auto',
      insurer: data.seguradora || 'Seguradora Não Identificada',
      premium: Number(data.premio) || Number(data.valor_premio) || 0,
      monthlyAmount: Number(data.custo_mensal) || Number(data.valor_parcela) || 0,
      startDate: data.inicio || data.inicio_vigencia || new Date().toISOString().split('T')[0],
      endDate: data.fim || data.fim_vigencia || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      policyNumber: data.numero_apolice || 'N/A',
      paymentFrequency: 'mensal',
      status: 'active',
      file,
      extractedAt: new Date().toISOString().split('T')[0],
      installments: [],
      insuredName: data.segurado || 'Segurado não informado'
    };
  }
}
