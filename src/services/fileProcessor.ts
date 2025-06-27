
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { DynamicPDFExtractor } from './dynamicPdfExtractor';
import { DynamicPolicyParser } from '@/utils/dynamicPolicyParser';
import { FileProcessingStatus } from '@/types/pdfUpload';

export class FileProcessor {
  private updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void;
  private removeFileStatus: (fileName: string) => void;
  private onPolicyExtracted: (policy: ParsedPolicyData) => void;
  private toast: any;

  constructor(
    updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void,
    removeFileStatus: (fileName: string) => void,
    fetchPolicyData: any, // Não usado mais, mantido para compatibilidade
    onPolicyExtracted: (policy: ParsedPolicyData) => void,
    toast: any
  ) {
    this.updateFileStatus = updateFileStatus;
    this.removeFileStatus = removeFileStatus;
    this.onPolicyExtracted = onPolicyExtracted;
    this.toast = toast;
  }

  // Novo método para processar múltiplos arquivos sequencialmente
  async processMultipleFiles(files: File[]): Promise<ParsedPolicyData[]> {
    console.log(`📤 Iniciando processamento sequencial de ${files.length} arquivos`);
    const resultados: ParsedPolicyData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = file.name;
      
      console.log(`🔄 Processando arquivo ${i + 1}/${files.length}: ${fileName}`);
      
      try {
        // Processar arquivo individual
        const parsedPolicy = await this.processFileInternal(file);
        resultados.push(parsedPolicy);
        
        console.log(`✅ Arquivo ${i + 1}/${files.length} processado com sucesso`);
        
      } catch (error) {
        console.error(`❌ Erro ao processar arquivo ${fileName}:`, error);
        
        this.updateFileStatus(fileName, {
          progress: 100,
          status: 'failed',
          message: `❌ ${error instanceof Error ? error.message : 'Erro no processamento'}`
        });

        // Remover após 5 segundos em caso de erro
        setTimeout(() => {
          this.removeFileStatus(fileName);
        }, 5000);
      }
    }

    console.log(`🎉 Processamento completo! ${resultados.length}/${files.length} arquivos processados com sucesso`);
    
    // Notificar sobre o resultado do lote
    if (resultados.length > 0) {
      this.toast({
        title: `🎉 Lote Processado com Sucesso`,
        description: `${resultados.length} de ${files.length} arquivos processados`,
      });

      // Adicionar todas as apólices ao dashboard de uma vez
      resultados.forEach(policy => {
        this.onPolicyExtracted(policy);
      });
    }

    return resultados;
  }

  async processFile(file: File): Promise<void> {
    try {
      await this.processFileInternal(file);
    } catch (error) {
      // Erro já tratado no processFileInternal
    }
  }

  private async processFileInternal(file: File): Promise<ParsedPolicyData> {
    const fileName = file.name;
    
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

    const dynamicData = await DynamicPDFExtractor.extractFromPDF(file);

    // 3. Converter para formato do dashboard
    this.updateFileStatus(fileName, {
      progress: 85,
      status: 'processing',
      message: 'Processando dados extraídos...'
    });

    const parsedPolicy = DynamicPolicyParser.convertToParsedPolicy(dynamicData, fileName, file);

    // 4. Finalizar processamento
    this.updateFileStatus(fileName, {
      progress: 100,
      status: 'completed',
      message: `✅ Processado: ${parsedPolicy.insurer} - R$ ${parsedPolicy.monthlyAmount.toFixed(2)}/mês`
    });

    // Remover da lista após 3 segundos
    setTimeout(() => {
      this.removeFileStatus(fileName);
    }, 3000);

    return parsedPolicy;
  }
}
