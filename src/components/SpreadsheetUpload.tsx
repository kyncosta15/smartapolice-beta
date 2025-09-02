import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Download,
  Users,
  UserPlus,
  X,
  Calendar,
  HardDrive,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProcessedData {
  colaboradores: any[];
  dependentes: any[];
  errors: string[];
  warnings: string[];
}

export const SpreadsheetUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const validateFile = (selectedFile: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidType = validTypes.includes(selectedFile.type);
    const hasValidExtension = validExtensions.some(ext => 
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidType && !hasValidExtension) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV",
        variant: "destructive"
      });
      return false;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setProcessedData(null);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔍 handleInputChange chamado');
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      console.log('📁 Arquivo selecionado:', selectedFile.name);
      handleFileSelect(selectedFile);
    } else {
      console.log('❌ Nenhum arquivo selecionado');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    console.log('🎯 handleDrop chamado');
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      console.log('📁 Arquivo solto:', droppedFile.name);
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const formatFileDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sendToWebhook = async () => {
    console.log('📤 sendToWebhook chamado');
    console.log('📁 File:', file?.name);
    console.log('🔗 WebhookUrl:', webhookUrl);
    
    if (!file || !webhookUrl) {
      console.log('❌ Dados incompletos - file:', !!file, 'webhookUrl:', !!webhookUrl);
      toast({
        title: "Dados incompletos",
        description: "Selecione um arquivo e informe a URL do webhook",
        variant: "destructive"
      });
      return;
    }

    console.log('🚀 Iniciando envio para webhook...');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('fileSize', file.size.toString());
      formData.append('lastModified', file.lastModified.toString());
      formData.append('timestamp', new Date().toISOString());
      formData.append('source', 'SmartBeneficios');

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Arquivo enviado com sucesso",
          description: "O arquivo foi enviado para o n8n para processamento",
        });
        
        // Limpar arquivo após envio bem-sucedido
        setFile(null);
        setWebhookUrl('');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('Erro ao enviar para webhook:', error);
      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar o arquivo. Verifique a URL do webhook.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const processSpreadsheet = async () => {
    console.log('⚙️ processSpreadsheet chamado');
    if (!file) {
      console.log('❌ Nenhum arquivo para processar');
      return;
    }

    console.log('🔄 Iniciando processamento do arquivo:', file.name);
    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simular processamento da planilha
      const mockProcessedData: ProcessedData = {
        colaboradores: [
          {
            nome: 'Carlos Roberto Silva',
            cpf: '555.666.777-88',
            email: 'carlos.silva@rcaldas.com.br',
            telefone: '71988776655',
            data_nascimento: '1987-05-20',
            cargo: 'Coordenador de Projetos',
            centro_custo: 'Engenharia',
            data_admissao: '2024-01-15',
            custo_mensal: 380.00
          },
          {
            nome: 'Fernanda Costa Lima',
            cpf: '666.777.888-99',
            email: 'fernanda.lima@rcaldas.com.br',
            telefone: '71977665544',
            data_nascimento: '1992-09-10',
            cargo: 'Analista de Qualidade',
            centro_custo: 'Qualidade',
            data_admissao: '2024-02-01',
            custo_mensal: 340.00
          }
        ],
        dependentes: [
          {
            colaborador_cpf: '555.666.777-88',
            nome: 'Marina Silva Costa',
            cpf: '777.888.999-00',
            data_nascimento: '2015-03-12',
            grau_parentesco: 'filha',
            custo_mensal: 160.00
          }
        ],
        errors: [],
        warnings: ['CPF 555.666.777-88 já existe no sistema, dados serão atualizados']
      };

      // Simular progresso
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setProcessedData(mockProcessedData);
      
      toast({
        title: "Planilha processada com sucesso",
        description: `${mockProcessedData.colaboradores.length} colaboradores e ${mockProcessedData.dependentes.length} dependentes identificados`,
      });

    } catch (error) {
      console.error('Erro ao processar planilha:', error);
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro ao processar a planilha",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmImport = async () => {
    if (!processedData) return;

    try {
      setIsProcessing(true);

      // Buscar empresa RCaldas
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', 'RCaldas')
        .single();

      if (!empresa) {
        throw new Error('Empresa não encontrada');
      }

      // Inserir colaboradores
      for (const colaborador of processedData.colaboradores) {
        const { error } = await supabase
          .from('colaboradores')
          .upsert({
            empresa_id: empresa.id,
            nome: colaborador.nome,
            cpf: colaborador.cpf,
            email: colaborador.email,
            telefone: colaborador.telefone,
            data_nascimento: colaborador.data_nascimento,
            cargo: colaborador.cargo,
            centro_custo: colaborador.centro_custo,
            data_admissao: colaborador.data_admissao,
            custo_mensal: colaborador.custo_mensal,
            status: 'ativo'
          }, {
            onConflict: 'cpf'
          });

        if (error) {
          console.error('Erro ao inserir colaborador:', error);
        }
      }

      // Inserir dependentes
      for (const dependente of processedData.dependentes) {
        // Buscar colaborador pelo CPF
        const { data: colaborador } = await supabase
          .from('colaboradores')
          .select('id')
          .eq('cpf', dependente.colaborador_cpf)
          .single();

        if (colaborador) {
          const { error } = await supabase
            .from('dependentes')
            .upsert({
              colaborador_id: colaborador.id,
              nome: dependente.nome,
              cpf: dependente.cpf,
              data_nascimento: dependente.data_nascimento,
              grau_parentesco: dependente.grau_parentesco,
              custo_mensal: dependente.custo_mensal,
              status: 'ativo'
            }, {
              onConflict: 'cpf'
            });

          if (error) {
            console.error('Erro ao inserir dependente:', error);
          }
        }
      }

      toast({
        title: "Importação concluída",
        description: "Dados importados com sucesso para o sistema",
      });

      setProcessedData(null);
      setFile(null);

    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao importar os dados",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    console.log('📥 downloadTemplate chamado');
    // Criar template em formato CSV
    const csvContent = `Nome,CPF,Email,Telefone,Data Nascimento,Cargo,Centro de Custo,Data Admissão,Custo Mensal
João Silva,123.456.789-00,joao@empresa.com.br,71999887766,1985-01-15,Analista,Financeiro,2024-01-10,350.00
Maria Santos,987.654.321-00,maria@empresa.com.br,71988776655,1990-03-22,Coordenadora,RH,2024-02-01,420.00`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_colaboradores.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Upload de Planilha</h2>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Baixar Template
        </Button>
      </div>

      {/* Área de Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Colaboradores e Dependentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuração do Webhook n8n */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Label htmlFor="webhook-url">URL do Webhook n8n</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-n8n-instance.com/webhook/your-webhook-id"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={sendToWebhook}
                  disabled={!file || !webhookUrl || isUploading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isUploading ? 'Enviando...' : 'Enviar para n8n'}
                </Button>
              </div>
            </div>
          </div>

          {/* Área de Upload com Drag and Drop */}
          {!file ? (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                isDragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <FileSpreadsheet className={`h-16 w-16 mx-auto mb-4 ${
                isDragOver ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <h3 className="text-lg font-medium mb-2">
                {isDragOver ? 'Solte o arquivo aqui' : 'Selecione uma planilha'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Arraste e solte ou clique para selecionar um arquivo Excel (.xlsx, .xls) ou CSV
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleInputChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button 
                  className="cursor-pointer" 
                  onClick={() => {
                    console.log('🖱️ Botão "Selecionar Arquivo" clicado');
                    document.getElementById('file-upload')?.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              </label>
            </div>
          ) : (
            /* Validador de Arquivo */
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-semibold text-green-800">{file.name}</h4>
                        <Badge className="bg-green-200 text-green-800 text-xs">
                          Arquivo válido
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-700">
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4" />
                          <span>Tamanho: {formatFileSize(file.size)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Modificado: {formatFileDate(new Date(file.lastModified))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Tipo: {file.type || 'Detectado por extensão'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setFile(null)}
                    disabled={isProcessing || isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center gap-3 mt-4">
                  <Button 
                    onClick={processSpreadsheet}
                    disabled={isProcessing || isUploading}
                    variant="outline"
                  >
                    {isProcessing ? 'Processando...' : 'Processar Local'}
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    ou use o botão "Enviar para n8n" acima para processamento externo
                  </div>
                </div>

                {isProcessing && (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span>Processando arquivo...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Resultado do Processamento */}
      {processedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Colaboradores Identificados
                <Badge className="bg-blue-100 text-blue-800">
                  {processedData.colaboradores.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {processedData.colaboradores.map((colaborador, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{colaborador.nome}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {colaborador.cargo} • {colaborador.centro_custo}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      CPF: {colaborador.cpf} • Custo: R$ {colaborador.custo_mensal}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Dependentes Identificados
                <Badge className="bg-green-100 text-green-800">
                  {processedData.dependentes.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {processedData.dependentes.length > 0 ? (
                  processedData.dependentes.map((dependente, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{dependente.nome}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dependente.grau_parentesco} • CPF: {dependente.cpf}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Custo: R$ {dependente.custo_mensal}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum dependente identificado na planilha
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Avisos e Erros */}
          {(processedData.warnings.length > 0 || processedData.errors.length > 0) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Avisos e Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {processedData.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <span className="text-sm">{warning}</span>
                    </div>
                  ))}
                  {processedData.errors.map((error, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão de Confirmação */}
          <div className="lg:col-span-2 flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setProcessedData(null)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmImport}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Importando...' : 'Confirmar Importação'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};