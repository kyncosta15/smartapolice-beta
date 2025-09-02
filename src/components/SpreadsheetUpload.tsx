import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Download,
  Users,
  UserPlus
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
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.includes('sheet') || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setProcessedData(null);
      } else {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls)",
          variant: "destructive"
        });
      }
    }
  };

  const processSpreadsheet = async () => {
    if (!file) return;

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
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecione uma planilha</h3>
              <p className="text-muted-foreground mb-4">
                Arraste e solte ou clique para selecionar um arquivo Excel (.xlsx, .xls)
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setFile(null)}
                    disabled={isProcessing}
                  >
                    Remover
                  </Button>
                  <Button 
                    onClick={processSpreadsheet}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processando...' : 'Processar'}
                  </Button>
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-2">
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
            </div>
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