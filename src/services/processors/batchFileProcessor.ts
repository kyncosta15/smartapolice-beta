import { ParsedPolicyData } from '@/utils/policyDataParser';
import { DynamicPDFExtractor } from '../dynamicPdfExtractor';
import { N8NDataConverter } from '@/utils/parsers/n8nDataConverter';
import { StructuredDataConverter } from '@/utils/parsers/structuredDataConverter';
import { FileProcessingStatus } from '@/types/pdfUpload';
import { PolicyPersistenceService } from '../policyPersistenceService';
import { SafeDataExtractor } from '@/utils/safeDataExtractor';

export interface DuplicateInfo {
  policyNumber: string;
  policyId: string;
  policyName: string;
}

export class BatchFileProcessor {
  private updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void;
  private removeFileStatus: (fileName: string) => void;
  private onPolicyExtracted: (policy: ParsedPolicyData) => void;
  private onDuplicateDetected?: (info: DuplicateInfo) => void;
  private toast: any;

  constructor(
    updateFileStatus: (fileName: string, update: Partial<FileProcessingStatus[string]>) => void,
    removeFileStatus: (fileName: string) => void,
    onPolicyExtracted: (policy: ParsedPolicyData) => void,
    toast: any,
    onDuplicateDetected?: (info: DuplicateInfo) => void
  ) {
    this.updateFileStatus = updateFileStatus;
    this.removeFileStatus = removeFileStatus;
    this.onPolicyExtracted = onPolicyExtracted;
    this.toast = toast;
    this.onDuplicateDetected = onDuplicateDetected;
  }

  async processMultipleFiles(files: File[], userId: string | null, userEmail?: string | null): Promise<ParsedPolicyData[]> {
    console.log('🚀🚀🚀 ============================================');
    console.log('🚀🚀🚀 BATCH FILE PROCESSOR - INÍCIO');
    console.log('🚀🚀🚀 ============================================');
    console.log(`🚀 Arquivos: ${files.length}`);
    console.log(`👤 userId:`, userId);
    console.log(`📧 userEmail:`, userEmail);
    console.log(`🔔 Callback duplicata existe?`, !!this.onDuplicateDetected);
    
    // NOTA: userId pode ser null se os dados vierem do N8N com user_id nos dados
    // Verificaremos e resolveremos o user_id durante o processamento
    
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
      
      console.log(`📦 DADOS BRUTOS EXTRAÍDOS:`, extractedDataArray);
      console.log(`📊 Tipo dos dados extraídos:`, typeof extractedDataArray);
      console.log(`📏 Quantidade de dados extraídos: ${extractedDataArray.length}`);

      console.log(`📦 Dados extraídos: ${extractedDataArray.length} itens`);

      if (!extractedDataArray || extractedDataArray.length === 0) {
        console.warn('⚠️ Nenhum dado extraído - Array vazio ou null');
        console.warn('⚠️ Valor exato do array:', extractedDataArray);
        throw new Error('Nenhum dado foi extraído dos arquivos');
      } 
      
      console.log('✅ Dados extraídos com sucesso, iniciando processamento individual');
      
      // Processar dados extraídos
      for (let index = 0; index < extractedDataArray.length; index++) {
        const singleData = extractedDataArray[index];
        console.log(`🔄 Processando item ${index + 1}/${extractedDataArray.length}`);
        console.log(`📊 DADOS DO ITEM ${index + 1}:`, JSON.stringify(singleData, null, 2));
        
        // CORREÇÃO CRÍTICA: Resolver user_id usando estratégias robustas
        const { UserIdResolver } = await import('@/utils/userIdResolver');
        let resolvedUserId: string;
        
        try {
          console.log(`🔍 Resolvendo user_id para item ${index + 1}`);
          console.log(`👤 userId do contexto: ${userId}`);
          console.log(`👤 user_id nos dados: ${singleData.user_id}`);
          
          resolvedUserId = await UserIdResolver.resolveUserId(singleData, userId, userEmail);
          console.log(`✅ User ID resolvido para item ${index + 1}: ${resolvedUserId}`);
        } catch (error) {
          console.error(`❌ Falha ao resolver user_id para item ${index + 1}:`, error);
          
          // Debug detalhado para troubleshooting
          await UserIdResolver.debugUserResolution(singleData, userId);
          
          this.updateFileStatus(files[Math.min(index, files.length - 1)]?.name || `Item ${index + 1}`, {
            progress: 100,
            status: 'failed',
            message: `❌ Erro: ${error instanceof Error ? error.message : 'Não foi possível identificar o usuário'}`
          });
          continue; // Pular este item e continuar com os próximos
        }
        
        const dataWithUserId = {
          ...singleData,
          user_id: resolvedUserId // Garantir userId nos dados
        };
        
        const relatedFileName = this.findRelatedFileNameSafely(singleData, files) || files[Math.min(index, files.length - 1)]?.name || `Arquivo ${index + 1}`;
        
        this.updateFileStatus(relatedFileName, {
          progress: 60 + (index * 15),
          status: 'processing',
          message: 'Convertendo dados...'
        });
        
        try {
          console.log(`✅ Convertendo dados para apólice com userId: ${resolvedUserId}`);
          console.log(`📋 Dados com userId adicionado:`, JSON.stringify(dataWithUserId, null, 2));
          
          const parsedPolicy = await this.convertToParsedPolicy(dataWithUserId, relatedFileName, files[Math.min(index, files.length - 1)], resolvedUserId);
          console.log(`✅ Apólice convertida com sucesso:`, parsedPolicy.name);
          
          allResults.push(parsedPolicy);
          
            // Salvar no banco usando sistema robusto
            const relatedFile = files[Math.min(index, files.length - 1)];
            if (relatedFile) {
              console.log(`💾 💾 💾 ============================================`);
              console.log(`💾 💾 💾 SALVANDO APÓLICE: ${parsedPolicy.name}`);
              console.log(`💾 💾 💾 Número: ${parsedPolicy.policyNumber}`);
              console.log(`💾 💾 💾 ============================================`);
              
              const { RobustPolicyPersistence } = await import('@/services/robustPolicyPersistence');
              const saveResult = await RobustPolicyPersistence.savePolicyRobust(relatedFile, parsedPolicy, resolvedUserId);
              
              console.log(`📊 📊 📊 ================================================`);
              console.log(`📊 📊 📊 RESULTADO DO SAVE POLICY ROBUST:`);
              console.log(`📊 📊 📊 ================================================`);
              console.log(`📊 saveResult COMPLETO:`, JSON.stringify(saveResult, null, 2));
              console.log(`📊 saveResult.success:`, saveResult.success);
              console.log(`📊 saveResult.isUpdate:`, saveResult.isUpdate);
              console.log(`📊 saveResult.policyId:`, saveResult.policyId);
              console.log(`📊 Tipo de isUpdate:`, typeof saveResult.isUpdate);
              console.log(`📊 isUpdate é true?`, saveResult.isUpdate === true);
              console.log(`📊 📊 📊 ================================================`);
              
              if (saveResult.success) {
                const action = saveResult.isUpdate ? '🔄 atualizada' : '✅ criada';
                console.log(`${action} no banco: ${parsedPolicy.name}`);
                
                // SEMPRE chamar callback com informações da apólice salva
                console.log('🔔 🔔 🔔 ============================================');
                console.log('🔔 🔔 🔔 VERIFICANDO SE É DUPLICATA...');
                console.log('🔔 isUpdate:', saveResult.isUpdate);
                console.log('🔔 onDuplicateDetected existe?', !!this.onDuplicateDetected);
                console.log('🔔 🔔 🔔 ============================================');
                
                // Se for atualização, notificar com informações da duplicata
                if (saveResult.isUpdate === true) {
                  console.log('🔔🔔🔔 🔔🔔🔔 🔔🔔🔔 ================================================');
                  console.log('🔔🔔🔔 🔔🔔🔔 🔔🔔🔔 DUPLICATA CONFIRMADA! CHAMANDO CALLBACK...');
                  console.log('🔔🔔🔔 🔔🔔🔔 🔔🔔🔔 ================================================');
                  
                  const duplicateInfo = {
                    policyNumber: parsedPolicy.policyNumber,
                    policyId: saveResult.policyId || '',
                    policyName: parsedPolicy.name
                  };
                  
                  console.log('📋 Info da duplicata que será enviada:', duplicateInfo);
                  
                  // Toast imediato para feedback visual
                  console.log('🍞 Chamando toast...');
                  this.toast({
                    title: "📋 Apólice Duplicada Detectada",
                    description: `A apólice ${parsedPolicy.policyNumber} foi atualizada com os novos dados`,
                    duration: 5000,
                  });
                  console.log('🍞 Toast chamado');
                  
                  // Chamar callback se disponível
                  if (this.onDuplicateDetected) {
                    console.log('✅✅✅ CHAMANDO onDuplicateDetected AGORA!');
                    console.log('✅✅✅ Função callback:', this.onDuplicateDetected);
                    
                    this.onDuplicateDetected(duplicateInfo);
                    
                    console.log('✅✅✅ onDuplicateDetected CHAMADO COM SUCESSO!');
                  } else {
                    console.error('❌❌❌ Callback onDuplicateDetected NÃO EXISTE!');
                    console.error('❌❌❌ this.onDuplicateDetected:', this.onDuplicateDetected);
                  }
                } else {
                  console.log('ℹ️ Nova apólice criada (não é duplicata)');
                  console.log('ℹ️ isUpdate era:', saveResult.isUpdate);
                }
              } else {
                console.warn(`⚠️ Falha ao salvar apólice no banco: ${parsedPolicy.name}`, saveResult.errors);
              }
            }
          
          // Notificar componente pai
          console.log(`📢 Notificando componente pai sobre nova apólice: ${parsedPolicy.name}`);
          this.onPolicyExtracted(parsedPolicy);
          
          this.updateFileStatus(relatedFileName, {
            progress: 90 + (index * 2),
            status: 'processing',
            message: `✅ Processado: ${parsedPolicy.insurer}`
          });
          
        } catch (conversionError) {
          console.error(`❌ Erro na conversão do item ${index + 1}:`, conversionError);
          console.error(`❌ Stack trace:`, conversionError instanceof Error ? conversionError.stack : 'N/A');
          // Marcar como erro mas continuar processamento
          this.updateFileStatus(relatedFileName, {
            progress: 100,
            status: 'failed',
            message: `❌ Erro na conversão: ${conversionError instanceof Error ? conversionError.message : 'Erro desconhecido'}`
          });
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

  private async convertToParsedPolicy(data: any, fileName: string, file: File, userId: string): Promise<ParsedPolicyData> {
    console.log('🔄 Convertendo dados para ParsedPolicy com validação robusta:', data);
    console.log('👤 userId para conversão:', userId);
    
    // CORREÇÃO CRÍTICA: Garantir que userId esteja sempre presente
    if (!userId) {
      console.error('❌ userId não fornecido para conversão');
      throw new Error('user_id é obrigatório para converter dados de apólice');
    }
    
    // Usar validador robusto sem alucinação
    const { RobustDataValidator } = await import('@/utils/robustDataValidator');
    const validationResult = RobustDataValidator.validateWithoutHallucination(data);
    
    if (!validationResult.isValid) {
      console.error('❌ Dados inválidos:', validationResult.errors);
      throw new Error(`Dados inválidos: ${validationResult.errors.join(', ')}`);
    }
    
    if (validationResult.warnings.length > 0) {
      console.warn('⚠️ Avisos na validação:', validationResult.warnings);
    }
    
    // Verificar formato dos dados e converter adequadamente
    // CORREÇÃO: Aceitar apólices mesmo sem número_apolice (string vazia é válida)
    // CORREÇÃO: Aceitar campos com nomes variados do N8N
    const segurado = data.segurado || data.num_segurado || data.nome_segurado;
    const seguradora = data.seguradora || data.num_seguradora || data.nome_seguradora;
    
    if (segurado && seguradora) {
      console.log('📋 Convertendo dados diretos do N8N com validação');
      const numeroApolice = data.numero_apolice || data.num_apolice || data.apolice;
      if (!numeroApolice || numeroApolice.trim() === '') {
        console.warn(`⚠️ Apólice sem número: ${segurado} - gerando ID temporário`);
        data.numero_apolice = `TEMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      }
      return N8NDataConverter.convertN8NDirectData(data, fileName, file, userId);
    } else if (data.informacoes_gerais && data.seguradora && data.vigencia) {
      console.log('📋 Convertendo dados estruturados com validação');
      return StructuredDataConverter.convertStructuredData(data, fileName, file);
    } else {
      console.warn('📋 Dados em formato não reconhecido, criando fallback validado');
      console.warn('📋 Dados recebidos:', JSON.stringify(data, null, 2));
      return this.createFallbackPolicy(file, userId, validationResult.normalizedData);
    }
  }

  private createFallbackPolicy(file: File, userId: string, originalData?: any): ParsedPolicyData {
    // Usar SafeDataExtractor para extrair dados de forma segura
    const seguradoName = SafeDataExtractor.extractInsuredName(originalData?.segurado) || `Cliente ${file.name.replace('.pdf', '')}`;
    const seguradoraName = SafeDataExtractor.extractInsurerName(originalData?.seguradora) || 'Seguradora Não Identificada';
    const premio = SafeDataExtractor.extractFinancialValue(originalData?.premio) || (1200 + Math.random() * 1800);
    
    const mockPolicyData: ParsedPolicyData = {
      id: window.crypto.randomUUID(),
      name: seguradoName,
      type: 'auto',
      insurer: seguradoraName,
      premium: premio,
      monthlyAmount: premio / 12,
      startDate: originalData?.inicio || new Date().toISOString().split('T')[0],
      endDate: originalData?.fim || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      policyNumber: SafeDataExtractor.extractPolicyNumber(originalData) || `FB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      paymentFrequency: 'monthly',
      status: 'vigente',
      file,
      extractedAt: new Date().toISOString(),
      installments: [],
      
      // Campos obrigatórios
      expirationDate: originalData?.fim || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      policyStatus: 'vigente',
      
      // Campos específicos se disponíveis
      insuredName: seguradoName,
      documento: originalData?.documento,
      documento_tipo: originalData?.documento_tipo as 'CPF' | 'CNPJ' || 'CPF',
      vehicleModel: originalData?.modelo_veiculo,
      uf: originalData?.uf,
      deductible: SafeDataExtractor.extractFinancialValue(originalData?.franquia) || undefined,
      
      // Campos opcionais
      coberturas: originalData?.coberturas || [{ descricao: 'Cobertura Básica' }],
      entity: originalData?.corretora || 'Corretora Não Identificada',
      category: 'Veicular',
      coverage: ['Cobertura Básica'],
      totalCoverage: premio
    };

    console.log(`✅ Política fallback criada: ${mockPolicyData.name}`);
    return mockPolicyData;
  }

  /**
   * Função segura para encontrar arquivo relacionado
   * Usa SafeDataExtractor para extrair nome do segurado de forma segura
   */
  private findRelatedFileNameSafely(data: any, files: File[]): string | null {
    try {
      // Usar SafeDataExtractor para extrair nome do segurado de forma segura
      const seguradoName = SafeDataExtractor.extractInsuredName(data.segurado);
      
      if (seguradoName) {
        const seguradoLower = seguradoName.toLowerCase();
        const matchingFile = files.find(file => {
          const fileName = file.name.toLowerCase();
          const firstNames = seguradoLower.split(' ').slice(0, 2);
          return firstNames.some(name => fileName.includes(name));
        });
        return matchingFile?.name || null;
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ Erro ao encontrar arquivo relacionado:', error);
      return null;
    }
  }
}