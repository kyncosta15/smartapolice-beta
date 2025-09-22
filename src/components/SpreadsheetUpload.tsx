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
  Send,
  Eye,
  Save,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePlanilhaUploads } from '@/hooks/usePlanilhaUploads';
import * as XLSX from 'xlsx';

interface SpreadsheetUploadProps {
  onFileSelect?: (file: File) => void;
  onDataUpdate?: () => void;
}

interface ColaboradorData {
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  cargo?: string;
  centro_custo?: string;
  data_admissao?: string;
  custo_mensal?: number;
  status: 'ativo' | 'inativo';
}

interface DependenteData {
  nome: string;
  cpf: string;
  data_nascimento: string;
  grau_parentesco: 'conjuge' | 'filho' | 'filha' | 'mae' | 'pai' | 'outros';
  colaborador_cpf: string;
  custo_mensal?: number;
}

interface PreviewData {
  colaboradores: ColaboradorData[];
  dependentes: DependenteData[];
  errors: string[];
}

export const SpreadsheetUpload = ({ onFileSelect, onDataUpdate }: SpreadsheetUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
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

  const normalizeFieldName = (field: string): string => {
    return field
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  };

  const mapColaboradorFields = (row: any): ColaboradorData | null => {
    const fieldMappings: { [key: string]: string[] } = {
      nome: ['nome', 'nome_completo', 'funcionario', 'colaborador'],
      cpf: ['cpf', 'documento'],
      email: ['email', 'e_mail', 'correio_eletronico'],
      telefone: ['telefone', 'celular', 'fone', 'tel'],
      data_nascimento: ['data_nascimento', 'nascimento', 'dt_nascimento', 'data_nasc'],
      cargo: ['cargo', 'funcao', 'posicao'],
      centro_custo: ['centro_custo', 'cc', 'centro_de_custo'],
      data_admissao: ['data_admissao', 'admissao', 'dt_admissao', 'data_adm'],
      custo_mensal: ['custo_mensal', 'valor', 'preco', 'custo']
    };

    const mapped: any = {
      status: 'ativo' as const
    };

    const normalizedRow: { [key: string]: any } = {};
    Object.keys(row).forEach(key => {
      normalizedRow[normalizeFieldName(key)] = row[key];
    });

    Object.entries(fieldMappings).forEach(([targetField, possibleNames]) => {
      for (const possibleName of possibleNames) {
        if (normalizedRow[possibleName] !== undefined && normalizedRow[possibleName] !== '') {
          let value = normalizedRow[possibleName];
          
          if (targetField === 'custo_mensal') {
            value = parseFloat(String(value).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
          } else if (targetField.includes('data_') && value) {
            if (typeof value === 'number') {
              const date = new Date((value - 25569) * 86400 * 1000);
              value = date.toISOString().split('T')[0];
            } else if (typeof value === 'string') {
              const dateFormats = [
                /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
                /(\d{4})-(\d{1,2})-(\d{1,2})/,
                /(\d{1,2})-(\d{1,2})-(\d{4})/
              ];
              
              for (const format of dateFormats) {
                const match = value.match(format);
                if (match) {
                  if (format.source.includes('\\d{4}.*\\d{1,2}.*\\d{1,2}')) {
                    value = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
                  } else {
                    value = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
                  }
                  break;
                }
              }
            }
          }
          
          mapped[targetField] = value;
          break;
        }
      }
    });

    if (!mapped.nome || !mapped.cpf) {
      return null;
    }

    if (mapped.cpf) {
      mapped.cpf = mapped.cpf.replace(/[^0-9]/g, '');
    }

    return mapped as ColaboradorData;
  };

  const mapDependenteFields = (row: any): DependenteData | null => {
    const fieldMappings: { [key: string]: string[] } = {
      nome: ['dependente_nome', 'nome_dependente', 'nome'],
      cpf: ['dependente_cpf', 'cpf_dependente', 'cpf'],
      data_nascimento: ['dependente_nascimento', 'data_nascimento', 'nascimento'],
      grau_parentesco: ['parentesco', 'grau_parentesco', 'relacao'],
      colaborador_cpf: ['colaborador_cpf', 'cpf_colaborador', 'titular_cpf'],
      custo_mensal: ['custo_dependente', 'valor_dependente', 'custo_mensal']
    };

    const mapped: any = {};

    const normalizedRow: { [key: string]: any } = {};
    Object.keys(row).forEach(key => {
      normalizedRow[normalizeFieldName(key)] = row[key];
    });

    Object.entries(fieldMappings).forEach(([targetField, possibleNames]) => {
      for (const possibleName of possibleNames) {
        if (normalizedRow[possibleName] !== undefined && normalizedRow[possibleName] !== '') {
          let value = normalizedRow[possibleName];
          
          if (targetField === 'custo_mensal') {
            value = parseFloat(String(value).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
          } else if (targetField === 'data_nascimento' && value) {
            if (typeof value === 'number') {
              const date = new Date((value - 25569) * 86400 * 1000);
              value = date.toISOString().split('T')[0];
            }
          } else if (targetField === 'grau_parentesco') {
            const parentescoMap: { [key: string]: DependenteData['grau_parentesco'] } = {
              'conjuge': 'conjuge',
              'esposa': 'conjuge',
              'esposo': 'conjuge',
              'cônjuge': 'conjuge',
              'filho': 'filho',
              'filha': 'filha',
              'enteado': 'outros',
              'enteada': 'outros',
              'mae': 'mae',
              'mãe': 'mae',
              'pai': 'pai'
            };
            const normalized = normalizeFieldName(String(value));
            value = parentescoMap[normalized] || 'outros';
          } else if (targetField === 'colaborador_cpf') {
            value = String(value).replace(/[^0-9]/g, '');
          }
          
          mapped[targetField] = value;
          break;
        }
      }
    });

    if (!mapped.nome || !mapped.cpf || !mapped.colaborador_cpf || !mapped.data_nascimento) {
      return null;
    }

    if (mapped.cpf) {
      mapped.cpf = mapped.cpf.replace(/[^0-9]/g, '');
    }
    if (mapped.colaborador_cpf) {
      mapped.colaborador_cpf = mapped.colaborador_cpf.replace(/[^0-9]/g, '');
    }

    return mapped as DependenteData;
  };

  const previewSpreadsheetData = async (file: File): Promise<PreviewData> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          
          const colaboradores: ColaboradorData[] = [];
          const dependentes: DependenteData[] = [];
          const errors: string[] = [];
          
          workbook.SheetNames.forEach((sheetName, sheetIndex) => {
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            
            data.forEach((row: any, rowIndex) => {
              const colaborador = mapColaboradorFields(row);
              if (colaborador) {
                colaboradores.push(colaborador);
                return;
              }
              
              const dependente = mapDependenteFields(row);
              if (dependente) {
                dependentes.push(dependente);
                return;
              }
              
              if (Object.values(row).some(val => val !== null && val !== undefined && val !== '')) {
                errors.push(`Linha ${rowIndex + 2} da aba "${sheetName}": dados não reconhecidos`);
              }
            });
          });
          
          resolve({ colaboradores, dependentes, errors });
        } catch (error) {
          console.error('Erro ao processar planilha:', error);
          resolve({ colaboradores: [], dependentes: [], errors: ['Erro ao processar arquivo'] });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setIsProcessing(true);
      
      try {
        const preview = await previewSpreadsheetData(selectedFile);
        setPreviewData(preview);
        setShowPreview(true);
        
        toast({
          title: "Arquivo carregado",
          description: `Encontrados: ${preview.colaboradores.length} colaboradores e ${preview.dependentes.length} dependentes`,
        });
      } catch (error) {
        toast({
          title: "Erro ao processar arquivo",
          description: "Não foi possível ler os dados da planilha",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
      
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

  const processAndSaveData = async () => {
    if (!file || !previewData) return;

    setIsProcessing(true);
    let uploadRecord: any = null;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente para continuar",
          variant: "destructive"
        });
        // Limpar dados locais e redirecionar para login
        setFile(null);
        setPreviewData(null);
        setShowPreview(false);
        window.location.href = '/auth/smartbeneficios';
        return;
      }

      // Salvar arquivo no storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('smartbeneficios')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Erro ao salvar arquivo: ${uploadError.message}`);
      }

      // Buscar/criar empresa
      const { data: userProfile } = await supabase
        .from('users')
        .select('company, name')
        .eq('id', user.id)
        .single();

      let companyName = userProfile?.company;
      if (!companyName) {
        companyName = userProfile?.name || 'Empresa Padrão';
        await supabase
          .from('users')
          .update({ company: companyName })
          .eq('id', user.id);
      }

      let { data: empresa } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', companyName)
        .maybeSingle();

      if (!empresa) {
        const { data: novaEmpresa } = await supabase
          .from('empresas')
          .insert([{ nome: companyName }])
          .select('id')
          .single();
        empresa = novaEmpresa;
      }

      // Criar registro de upload
      const { data: uploadRecord } = await createUpload(file, uploadData.path, empresa?.id);
      if (!uploadRecord) throw new Error('Erro ao criar registro de upload');

      let colaboradoresImportados = 0;
      let dependentesImportados = 0;

        // Importar colaboradores (SEMPRE permite duplicatas por empresa)
        if (previewData.colaboradores.length > 0) {
          const colaboradores = previewData.colaboradores.map(col => ({
            ...col,
            empresa_id: empresa.id
          }));

          // Inserir TODOS os colaboradores da planilha (permite duplicatas)
          const { error } = await supabase
            .from('colaboradores')
            .insert(colaboradores);

          if (error) throw error;
          
          colaboradoresImportados = colaboradores.length;
        }

      // Importar dependentes
      if (previewData.dependentes.length > 0) {
        // Primeiro buscar IDs dos colaboradores pelos CPFs
        const colaboradorCpfs = [...new Set(previewData.dependentes.map(d => d.colaborador_cpf))];
        
        const { data: colaboradoresIds } = await supabase
          .from('colaboradores')
          .select('id, cpf')
          .eq('empresa_id', empresa.id)
          .in('cpf', colaboradorCpfs);

        const cpfToIdMap = new Map(colaboradoresIds?.map(c => [c.cpf, c.id]) || []);

        const dependentesComId = previewData.dependentes
          .map(dep => ({
            nome: dep.nome,
            cpf: dep.cpf,
            data_nascimento: dep.data_nascimento,
            grau_parentesco: dep.grau_parentesco,
            colaborador_id: cpfToIdMap.get(dep.colaborador_cpf),
            custo_mensal: dep.custo_mensal || 0,
            status: 'ativo' as const
          }))
          .filter(dep => dep.colaborador_id);

        if (dependentesComId.length > 0) {
          // Inserir TODOS os dependentes da planilha (permite duplicatas)
          const { error } = await supabase
            .from('dependentes')
            .insert(dependentesComId);

          if (error) throw error;
          
          dependentesImportados = dependentesComId.length;
        }
      }

      // Atualizar status do upload
      await updateUploadStatus(
        uploadRecord.id,
        'processado',
        colaboradoresImportados,
        dependentesImportados
      );

      toast({
        title: "Importação concluída!",
        description: `✅ ${colaboradoresImportados} colaboradores e ${dependentesImportados} dependentes importados (duplicatas permitidas por empresa)`,
      });

      onDataUpdate?.();
      setFile(null);
      setPreviewData(null);
      setShowPreview(false);

    } catch (error) {
      console.error('Erro ao processar dados:', error);
      
      if (uploadRecord) {
        await updateUploadStatus(uploadRecord.id, 'erro');
      }
      
      toast({
        title: "Erro ao processar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `nome,cpf,email,telefone,data_nascimento,cargo,centro_custo,data_admissao,custo_mensal,dependente_nome,dependente_cpf,dependente_nascimento,parentesco,colaborador_cpf
João Silva,12345678900,joao@empresa.com,71999887766,1985-01-15,Analista,Financeiro,2024-01-10,350.00,,,,,
Maria Santos,98765432100,maria@empresa.com,71988776655,1990-03-22,Coordenadora,RH,2024-02-01,420.00,,,,,
,,,,,,,,,Ana Silva,12345678901,2010-05-10,filho,12345678900`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_colaboradores_dependentes.csv');
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
                disabled={isProcessing}
              >
                <label htmlFor="file-input" className="cursor-pointer">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Arquivo
                    </>
                  )}
                </label>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Informações do arquivo */}
              <div className="border rounded-lg p-6 bg-green-50 border-green-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
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
                    onClick={() => {
                      setFile(null);
                      setPreviewData(null);
                      setShowPreview(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Preview dos dados */}
              {showPreview && previewData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Preview dos Dados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Colaboradores ({previewData.colaboradores.length})
                        </h4>
                        <div className="max-h-32 overflow-y-auto border rounded p-2 text-sm">
                          {previewData.colaboradores.slice(0, 5).map((col, idx) => (
                            <div key={idx} className="py-1">{col.nome} - {col.cpf}</div>
                          ))}
                          {previewData.colaboradores.length > 5 && (
                            <div className="text-muted-foreground">
                              ... e mais {previewData.colaboradores.length - 5}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          Dependentes ({previewData.dependentes.length})
                        </h4>
                        <div className="max-h-32 overflow-y-auto border rounded p-2 text-sm">
                          {previewData.dependentes.slice(0, 5).map((dep, idx) => (
                            <div key={idx} className="py-1">{dep.nome} - {dep.grau_parentesco}</div>
                          ))}
                          {previewData.dependentes.length > 5 && (
                            <div className="text-muted-foreground">
                              ... e mais {previewData.dependentes.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {previewData.errors.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          Avisos ({previewData.errors.length})
                        </h4>
                        <div className="max-h-24 overflow-y-auto border rounded p-2 text-sm text-red-600 bg-red-50">
                          {previewData.errors.slice(0, 3).map((error, idx) => (
                            <div key={idx} className="py-1">{error}</div>
                          ))}
                          {previewData.errors.length > 3 && (
                            <div>... e mais {previewData.errors.length - 3} avisos</div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={processAndSaveData}
                  disabled={isProcessing || !previewData}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Dados
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};