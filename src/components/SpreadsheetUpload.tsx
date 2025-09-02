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
import { usePlanilhaUploads } from '@/hooks/usePlanilhaUploads';
import * as XLSX from 'xlsx';

interface SpreadsheetUploadProps {
  onFileSelect?: (file: File) => void;
  onDataUpdate?: () => void;
}

export const SpreadsheetUpload = ({ onFileSelect, onDataUpdate }: SpreadsheetUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { createUpload, updateUploadStatus } = usePlanilhaUploads();

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
      onFileSelect?.(selectedFile);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
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

  const processSpreadsheet = async () => {
    if (!file) return;

    setIsProcessing(true);
    let uploadRecord: any = null;

    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // 1. Primeiro salvar arquivo no Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('💾 Salvando arquivo no storage:', filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('smartbeneficios')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Erro ao salvar arquivo: ${uploadError.message}`);
      }

      console.log('✅ Arquivo salvo no storage:', uploadData.path);

      // 2. Buscar empresa do usuário
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('company, name')
        .eq('id', user.id)
        .single();

      if (userError) {
        throw new Error(`Erro ao buscar perfil do usuário: ${userError.message}`);
      }

      // Se usuário não tem empresa, usar o nome do usuário como empresa
      let companyName = userProfile?.company;
      if (!companyName || companyName.trim() === '') {
        companyName = userProfile?.name || 'Empresa Padrão';
        
        // Atualizar o perfil do usuário com a empresa
        await supabase
          .from('users')
          .update({ company: companyName })
          .eq('id', user.id);
      }

      console.log('🏢 Empresa do usuário:', companyName);

      // Verificar se empresa existe, se não criar
      let { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', companyName)
        .maybeSingle();

      if (empresaError) {
        console.error('Erro ao buscar empresa:', empresaError);
      }

      if (!empresa) {
        console.log('🆕 Criando nova empresa:', companyName);
        const { data: novaEmpresa, error: empresaError } = await supabase
          .from('empresas')
          .insert([{ nome: companyName }])
          .select('id')
          .single();

        if (empresaError) {
          console.error('Erro ao criar empresa:', empresaError);
          throw new Error(`Erro ao criar empresa: ${empresaError.message}`);
        }
        empresa = novaEmpresa;
      }

      console.log('✅ Empresa configurada:', empresa.id);

      // 3. Salvar metadados do upload no banco
      const { data: uploadRecord, error: uploadRecordError } = await createUpload(
        file,
        uploadData.path,
        empresa?.id
      );

      if (uploadRecordError || !uploadRecord) {
        throw new Error(`Erro ao criar registro de upload: ${uploadRecordError}`);
      }

      // 4. Processar a planilha e extrair dados
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(worksheet);

          console.log('📊 Dados extraídos da planilha:', data);

          // Processar dados da planilha e inserir colaboradores
          const colaboradores = data.map((row: any) => ({
            empresa_id: empresa.id,
            nome: row.nome || row.Nome || row.NOME || '',
            cpf: row.cpf || row.CPF || '',
            email: row.email || row.Email || row.EMAIL || '',
            telefone: row.telefone || row.Telefone || row.TELEFONE || '',
            data_nascimento: row.data_nascimento || row['Data Nascimento'] || null,
            cargo: row.cargo || row.Cargo || row.CARGO || '',
            centro_custo: row.centro_custo || row['Centro de Custo'] || '',
            data_admissao: row.data_admissao || row['Data Admissão'] || null,
            status: 'ativo' as const,
            custo_mensal: parseFloat(row.custo_mensal || row['Custo Mensal'] || '0') || 0
          })).filter(col => col.nome && col.cpf);

          let colaboradoresImportados = 0;
          if (colaboradores.length > 0) {
            const { error: colaboradoresError } = await supabase
              .from('colaboradores')
              .upsert(colaboradores, { onConflict: 'cpf,empresa_id' });

            if (colaboradoresError) throw colaboradoresError;
            colaboradoresImportados = colaboradores.length;
          }

          // 5. Atualizar status do upload para processado
          await updateUploadStatus(
            uploadRecord.id, 
            'processado', 
            colaboradoresImportados, 
            0
          );

          toast({
            title: "Planilha processada com sucesso!",
            description: `${colaboradoresImportados} colaboradores foram importados e o arquivo foi salvo no sistema`,
          });

          // Recarregar dados do dashboard
          onDataUpdate?.();
          
          // Limpar arquivo
          setFile(null);

        } catch (error) {
          console.error('❌ Erro ao processar dados da planilha:', error);
          
          // Atualizar status para erro
          if (uploadRecord) {
            await updateUploadStatus(uploadRecord.id, 'erro');
          }
          
          toast({
            title: "Erro ao processar dados",
            description: "Verifique o formato da planilha e tente novamente",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error('❌ Erro ao processar planilha:', error);
      
      // Atualizar status para erro se houver upload record
      if (uploadRecord) {
        await updateUploadStatus(uploadRecord.id, 'erro');
      }
      
      toast({
        title: "Erro ao processar planilha",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const sendToWebhook = async () => {
    if (!file || !webhookUrl) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um arquivo e informe a URL do webhook",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Primeiro, salvar arquivo no Supabase Storage
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('smartbeneficios')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Agora enviar para webhook
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('fileSize', file.size.toString());
      formData.append('lastModified', file.lastModified.toString());
      formData.append('timestamp', new Date().toISOString());
      formData.append('source', 'SmartBeneficios');
      formData.append('userId', user.id);
      formData.append('storagePath', uploadData.path);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Arquivo enviado com sucesso",
          description: "O arquivo foi salvo no sistema e enviado para processamento",
        });
        
        setFile(null);
        setWebhookUrl('');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('Erro ao enviar para webhook:', error);
      toast({
        title: "Erro no envio",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `nome,cpf,email,telefone,data_nascimento,cargo,centro_custo,data_admissao,custo_mensal
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
            Importar Colaboradores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuração do Webhook n8n */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Label htmlFor="webhook-url">URL do Webhook n8n (opcional)</Label>
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
                  variant="outline"
                  className="w-full"
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
                id="file-input"
              />
              <Button 
                asChild 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </label>
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg p-6 bg-green-50 border-green-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <HardDrive className="h-4 w-4 mr-1" />
                        {formatFileSize(file.size)}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatFileDate(new Date(file.lastModified))}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={processSpreadsheet}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processando...' : 'Processar e Importar'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};