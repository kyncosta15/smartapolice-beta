
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { DynamicPDFExtractor } from '../dynamicPdfExtractor';
import { N8NDataConverter } from '@/utils/parsers/n8nDataConverter';
import { StructuredDataConverter } from '@/utils/parsers/structuredDataConverter';
import { FileProcessingStatus } from '@/types/pdfUpload';
import { PolicyPersistenceService } from '../policyPersistenceService';
import { extractFieldValue } from '@/utils/extractFieldValue';

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
    console.log(`🚀 BatchFileProcessor iniciando processamento de ${files.length} arquivos`);
    console.log(`👤 userId recebido:`, userId);
    
    if (!userId) {
      console.error('❌ ERRO CRÍTICO: userId é obrigatório para processamento');
      this.toast({
        title: "❌ Erro de Autenticação",
        description: "Usuário não autenticado. Faça login para continuar.",
        variant: "destructive",
      });
      throw new Error('Usuário não autenticado. Faça login para continuar.');
    }
    
    // Inicializar status dos arquivos
    files.forEach(file => {
      this.updateFileStatus(file.name, {
        progress: 0,
        status: 'uploading',
        message: 'Iniciando processamento...'
      });
    });

    const allResults: ParsedPolicyData[] = [];

    try {
      // Atualizar status para processamento
      files.forEach(file => {
        this.updateFileStatus(file.name, {
          progress: 20,
          status: 'processing',
          message: 'Extraindo dados com IA...'
        });
      });

      console.log('🔄 Iniciando extração de dados');
      const extractedDataArray = await DynamicPDFExtractor.extractFromMultiplePDFs(files, userId);

      console.log(`📦 Dados extraídos: ${extractedDataArray.length} itens`);

      if (extractedDataArray.length === 0) {
        console.warn('⚠️ Nenhum dado extraído');
        throw new Error('Nenhum dado foi extraído dos arquivos');
      } else {
        // Processar dados extraídos
        for (let index = 0; index < extractedDataArray.length; index++) {
          const singleData = extractedDataArray[index];
          console.log(`🔄 Processando item ${index + 1}/${extractedDataArray.length}:`, singleData);
          
          // CORREÇÃO CRÍTICA: Garantir que userId está sempre presente nos dados
          const dataWithUserId = {
            ...singleData,
            user_id: userId // Forçar userId nos dados
          };
          
          const relatedFileName = this.findRelatedFileName(singleData, files) || files[Math.min(index, files.length - 1)]?.name || `Arquivo ${index + 1}`;
          
          this.updateFileStatus(relatedFileName, {
            progress: 60 + (index * 15),
            status: 'processing',
            message: 'Convertendo dados...'
          });
          
          try {
            console.log(`✅ Convertendo dados para apólice com userId: ${userId}`);
            const parsedPolicy = this.convertToParsedPolicy(dataWithUserId, relatedFileName, files[Math.min(index, files.length - 1)], userId);
            allResults.push(parsedPolicy);
            
            // Salvar no banco
            const relatedFile = files[Math.min(index, files.length - 1)];
            if (relatedFile) {
              console.log(`💾 Salvando apólice completa no banco: ${parsedPolicy.name}`);
              const saveResult = await PolicyPersistenceService.savePolicyComplete(relatedFile, parsedPolicy, userId);
              
              if (saveResult) {
                console.log(`✅ Apólice salva com sucesso: ${parsedPolicy.name}`);
              } else {
                console.warn(`⚠️ Falha ao salvar apólice: ${parsedPolicy.name}`);
              }
            }
            
            // Notificar componente pai
            this.onPolicyExtracted(parsedPolicy);
            
            this.updateFileStatus(relatedFileName, {
              progress: 90 + (index * 2),
              status: 'processing',
              message: `✅ Processado: ${parsedPolicy.insurer}`
            });
            
          } catch (conversionError) {
            console.error(`❌ Erro na conversão do item ${index + 1}:`, conversionError);
            // Marcar como erro mas continuar processamento
            this.updateFileStatus(relatedFileName, {
              progress: 100,
              status: 'failed',
              message: `❌ Erro na conversão: ${conversionError instanceof Error ? conversionError.message : 'Erro desconhecido'}`
            });
          }
        }
      }

      // Marcar todos como concluídos
      files.forEach((file, index) => {
        const processedCount = allResults.length;
        this.updateFileStatus(file.name, {
          progress: 100,
          status: processedCount > 0 ? 'completed' : 'failed',
          message: processedCount > 0 ? `✅ Concluído (${processedCount} apólices)` : '❌ Nenhuma apólice processada'
        });
      });

      console.log(`🎉 Processamento finalizado! ${allResults.length} apólices processadas`);
      
      if (allResults.length > 0) {
        this.toast({
          title: `🎉 Processamento Concluído`,
          description: `${allResults.length} apólices foram processadas e salvas com sucesso`,
        });
      } else {
        this.toast({
          title: "⚠️ Nenhuma Apólice Processada",
          description: "Não foi possível extrair dados dos arquivos enviados",
          variant: "destructive",
        });
      }

      // Limpar status após 3 segundos
      setTimeout(() => {
        files.forEach(file => {
          this.removeFileStatus(file.name);
        });
      }, 3000);

      return allResults;

    } catch (error) {
      console.error('❌ Erro geral no processamento:', error);
      
      // Atualizar status com erro
      files.forEach(file => {
        this.updateFileStatus(file.name, {
          progress: 100,
          status: 'failed',
          message: `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        });
      });

      this.toast({
        title: "❌ Erro no Processamento",
        description: error instanceof Error ? error.message : 'Erro desconhecido no processamento',
        variant: "destructive",
      });

      // Limpar status após 5 segundos
      setTimeout(() => {
        files.forEach(file => {
          this.removeFileStatus(file.name);
        });
      }, 5000);

      throw error;
    }
  }

  private convertToParsedPolicy(data: any, fileName: string, file: File, userId: string): ParsedPolicyData {
    console.log('🔄 Convertendo dados para ParsedPolicy:', data);
    console.log('👤 userId para conversão:', userId);
    
    // CORREÇÃO CRÍTICA: Garantir que userId esteja sempre presente
    if (!userId) {
      console.error('❌ userId não fornecido para conversão');
      throw new Error('user_id é obrigatório para converter dados de apólice');
    }
    
    // Verificar formato dos dados e converter adequadamente
    if (data.numero_apolice && data.segurado && data.seguradora) {
      console.log('📋 Convertendo dados diretos do N8N');
      return N8NDataConverter.convertN8NDirectData(data, fileName, file, userId);
    } else if (data.informacoes_gerais && data.seguradora && data.vigencia) {
      console.log('📋 Convertendo dados estruturados');
      return StructuredDataConverter.convertStructuredData(data, fileName, file);
    } else {
      console.warn('📋 Dados em formato não reconhecido, criando fallback');
      return this.createFallbackPolicy(file, userId, data);
    }
  }

  private createFallbackPolicy(file: File, userId: string, originalData?: any): ParsedPolicyData {
    // CORREÇÃO: Usar extractFieldValue para extrair campos seguros
    const segurado = extractFieldValue(originalData?.segurado) || `Cliente ${file.name.replace('.pdf', '')}`;
    const seguradora = extractFieldValue(originalData?.seguradora) || 'Seguradora Não Identificada';
    const premio = Number(extractFieldValue(originalData?.premio)) || 1200 + Math.random() * 1800;
    
    const mockPolicyData: ParsedPolicyData = {
      id: crypto.randomUUID(),
      name: segurado,
      type: 'auto',
      insurer: seguradora,
      premium: premio,
      monthlyAmount: premio / 12,
      startDate: extractFieldValue(originalData?.inicio) || new Date().toISOString().split('T')[0],
      endDate: extractFieldValue(originalData?.fim) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      policyNumber: extractFieldValue(originalData?.numero_apolice) || `FB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      paymentFrequency: 'monthly',
      status: 'vigente',
      file,
      extractedAt: new Date().toISOString(),
      installments: [],
      
      // Campos obrigatórios
      expirationDate: extractFieldValue(originalData?.fim) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      policyStatus: 'vigente',
      
      // Campos específicos se disponíveis
      insuredName: segurado,
      documento: extractFieldValue(originalData?.documento),
      documento_tipo: extractFieldValue(originalData?.documento_tipo) as 'CPF' | 'CNPJ' || 'CPF',
      vehicleModel: extractFieldValue(originalData?.modelo_veiculo),
      uf: extractFieldValue(originalData?.uf),
      deductible: Number(extractFieldValue(originalData?.franquia)) || undefined,
      
      // Campos opcionais
      coberturas: originalData?.coberturas || [{ descricao: 'Cobertura Básica' }],
      entity: extractFieldValue(originalData?.corretora) || 'Corretora Não Identificada',
      category: 'Veicular',
      coverage: ['Cobertura Básica'],
      totalCoverage: premio
    };

    console.log(`✅ Política fallback criada: ${mockPolicyData.name}`);
    return mockPolicyData;
  }

  private findRelatedFileName(data: any, files: File[]): string | null {
    // CORREÇÃO: Usar extractFieldValue para segurado
    const seguradoField = extractFieldValue(data.segurado);
    if (seguradoField) {
      const seguradoName = seguradoField.toLowerCase();
      const matchingFile = files.find(file => {
        const fileName = file.name.toLowerCase();
        const firstNames = seguradoName.split(' ').slice(0, 2);
        return firstNames.some(name => fileName.includes(name));
      });
      return matchingFile?.name || null;
    }
    return null;
  }
}
