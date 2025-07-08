
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { DynamicPDFExtractor } from '../dynamicPdfExtractor';
import { N8NDataConverter } from '@/utils/parsers/n8nDataConverter';
import { StructuredDataConverter } from '@/utils/parsers/structuredDataConverter';
import { FileProcessingStatus } from '@/types/pdfUpload';
import { PolicyPersistenceService } from '../policyPersistenceService';

export class SingleFileProcessor {
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

  async processFile(file: File, userId: string | null): Promise<ParsedPolicyData> {
    const fileName = file.name;
    console.log(`📤 SingleFileProcessor: Processando arquivo ${fileName} com userId: ${userId}`);
    
    // Inicializar status do arquivo
    this.updateFileStatus(fileName, {
      progress: 0,
      status: 'uploading',
      message: 'Iniciando processamento...'
    });

    // 1. Simular carregamento do arquivo
    this.updateFileStatus(fileName, {
      progress: 20,
      status: 'processing',
      message: 'Carregando arquivo PDF...'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Extrair dados do PDF usando extração dinâmica
    this.updateFileStatus(fileName, {
      progress: 40,
      status: 'processing',
      message: 'Identificando seguradora e layout...'
    });

    await new Promise(resolve => setTimeout(resolve, 800));

    this.updateFileStatus(fileName, {
      progress: 65,
      status: 'processing',
      message: 'Extraindo dados com IA dinâmica...'
    });

    console.log(`👤 Garantindo que userId ${userId} será enviado no FormData para arquivo individual`);
    const dynamicData = await DynamicPDFExtractor.extractFromPDF(file, userId);

    // 3. Converter para formato do dashboard
    this.updateFileStatus(fileName, {
      progress: 85,
      status: 'processing',
      message: 'Processando dados extraídos...'
    });

    const parsedPolicy = this.convertToParsedPolicy(dynamicData, fileName, file);

    // 4. Salvar arquivo e dados no banco de dados
    this.updateFileStatus(fileName, {
      progress: 90,
      status: 'processing',
      message: 'Salvando dados no banco...'
    });

    // Usar savePolicyComplete para salvar arquivo + dados
    if (userId) {
      console.log(`💾 SingleFileProcessor: Iniciando savePolicyComplete para ${parsedPolicy.name} com userId: ${userId}`);
      try {
        await PolicyPersistenceService.savePolicyComplete(file, parsedPolicy, userId);
        console.log(`✅ SingleFileProcessor: Persistência concluída com sucesso`);
      } catch (persistenceError) {
        console.error(`❌ SingleFileProcessor: Erro na persistência:`, persistenceError);
        
        // Fornecer mais detalhes do erro para debug
        this.updateFileStatus(fileName, {
          progress: 100,
          status: 'failed',
          message: `❌ Erro na persistência: ${persistenceError instanceof Error ? persistenceError.message : 'Erro desconhecido'}`
        });
        
        throw persistenceError;
      }
    } else {
      console.error(`❌ SingleFileProcessor: UserId não fornecido - saltando persistência`);
      throw new Error('UserId não fornecido para persistência');
    }

    // 5. Finalizar processamento
    this.updateFileStatus(fileName, {
      progress: 100,
      status: 'completed',
      message: `✅ Processado: ${parsedPolicy.insurer} - R$ ${parsedPolicy.monthlyAmount.toFixed(2)}/mês`
    });

    // ✅ CORREÇÃO PRINCIPAL: Chamar onPolicyExtracted APÓS persistência bem-sucedida
    console.log(`📤 SingleFileProcessor: Chamando onPolicyExtracted para ${parsedPolicy.name} após persistência`);
    this.onPolicyExtracted(parsedPolicy);

    // Remover da lista após 3 segundos
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
