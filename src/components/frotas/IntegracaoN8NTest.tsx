import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Zap, Eye, EyeOff, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface N8NResponse {
  success: boolean;
  message: string;
  detalhes: {
    total_recebidos: number;
    veiculos_inseridos: number;
    erros_insercao: number;
    empresa_id: string;
  };
  erros?: any[];
}

interface N8NTestData {
  empresa: {};
  apolice: {
    tipo_beneficio: string;
    status: string;
  };
  veiculos: Array<{
    codigo?: string;
    placa: string;
    modelo?: string;
    chassi?: string;
    renavam?: string;
    marca?: string;
    ano?: number;
    proprietario?: string;
    localizacao?: string;
    familia?: string;
    status?: string;
    origem_planilha?: string;
  }>;
}

interface IntegracaoN8NTestProps {
  onSuccess?: () => void;
}

export function IntegracaoN8NTest({ onSuccess }: IntegracaoN8NTestProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [testResult, setTestResult] = useState<N8NResponse | null>(null);
  const [showJsonData, setShowJsonData] = useState(false);
  const { toast } = useToast();

  const testData: N8NTestData = {
    empresa: {},
    apolice: {
      tipo_beneficio: "gestao_frotas",
      status: "ativa"
    },
    veiculos: [
      {
        codigo: "TEST001",
        placa: "ABC1D23",
        modelo: "TOYOTA HILUX SW4 SRX",
        chassi: "8AJBA3FS3N0310052",
        renavam: "1299450706",
        marca: "TOYOTA",
        ano: 2022,
        proprietario: "EMPRESA TESTE LTDA",
        localizacao: "SEDE - SALVADOR-BA",
        familia: "CARRO DE APOIO",
        status: "ativo",
        origem_planilha: "N8N_TEST"
      },
      {
        codigo: "TEST002", 
        placa: "XYZ9E76",
        modelo: "HONDA CG 160 START",
        chassi: "9C2KC2500JR122389",
        renavam: "1146831371",
        marca: "HONDA",
        ano: 2018,
        proprietario: "EMPRESA TESTE LTDA",
        localizacao: "FILIAL - SALVADOR-BA",
        familia: "TRICICLO MOTORIZADO",
        status: "ativo",
        origem_planilha: "N8N_TEST"
      },
      {
        placa: "QWE4R56", // Sem código para testar dados parciais
        modelo: "VOLKSWAGEN GOL 1.0",
        marca: "VOLKSWAGEN",
        ano: 2020,
        familia: "CARRO DE APOIO",
        status: "ativo",
        origem_planilha: "N8N_TEST"
      }
    ]
  };

  const testIntegration = async () => {
    console.log('🧪 Testando integração N8N com dados simulados...');
    setIsProcessing(true);
    setTestResult(null);

    try {
      console.log('📤 Enviando dados de teste para a edge function:', testData);

      const { data, error } = await supabase.functions.invoke('processar-n8n-frotas', {
        body: testData
      });

      if (error) {
        console.error('❌ Erro na função edge:', error);
        throw error;
      }

      console.log('✅ Resposta da função:', data);
      setTestResult(data);

      if (data.success) {
        toast({
          title: "✅ Teste da Integração N8N Concluído",
          description: `${data.detalhes.veiculos_inseridos} veículos de teste inseridos com sucesso`,
        });
        onSuccess?.(); // Atualizar dados na interface
      } else {
        toast({
          title: "⚠️ Teste com Problemas Parciais",
          description: data.message,
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('💥 Erro no teste da integração:', error);
      setTestResult({
        success: false,
        message: `Erro na integração: ${error.message}`,
        detalhes: {
          total_recebidos: 0,
          veiculos_inseridos: 0,
          erros_insercao: 0,
          empresa_id: 'N/A'
        }
      });
      
      toast({
        title: "❌ Erro no Teste da Integração",
        description: `Erro: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Integração N8N - Teste Completo
        </CardTitle>
        <CardDescription>
          Teste a funcionalidade completa de recebimento e processamento de dados JSON do N8N
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Botões de ação */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={testIntegration}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testando Integração...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Executar Teste
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Ocultar Detalhes
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalhes
              </>
            )}
          </Button>

          <Button 
            variant="outline"
            onClick={() => setShowJsonData(!showJsonData)}
          >
            <Code className="w-4 h-4 mr-2" />
            {showJsonData ? 'Ocultar' : 'Ver'} JSON
          </Button>
        </div>

        {/* Resultado do teste */}
        {testResult && (
          <div className={`p-4 rounded-lg border ${
            testResult.success 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className="font-medium">
                {testResult.success ? 'Integração Funcionando ✅' : 'Problemas na Integração ❌'}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 mb-4">{testResult.message}</p>
            
            {/* Métricas do resultado */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {testResult.detalhes.total_recebidos}
                </div>
                <div className="text-gray-600">Recebidos</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {testResult.detalhes.veiculos_inseridos}
                </div>
                <div className="text-gray-600">Inseridos</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-red-600">
                  {testResult.detalhes.erros_insercao}
                </div>
                <div className="text-gray-600">Erros</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-xs font-mono text-gray-600 truncate">
                  {testResult.detalhes.empresa_id?.substring(0, 8) || 'N/A'}...
                </div>
                <div className="text-gray-600">Empresa</div>
              </div>
            </div>

            {/* Erros detalhados */}
            {testResult.erros && testResult.erros.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <h5 className="font-medium text-red-800 mb-2">Erros Detalhados:</h5>
                <div className="text-sm text-red-700 space-y-2">
                  {testResult.erros.map((erro, index) => (
                    <div key={index} className="bg-white p-2 rounded border">
                      <div><strong>Lote {erro.lote}:</strong> {erro.erro}</div>
                      {erro.veiculos && (
                        <div className="text-xs mt-1">
                          <strong>Placas afetadas:</strong> {erro.veiculos.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informações técnicas */}
        {showDetails && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <h5 className="font-medium mb-2">Endpoint da Integração:</h5>
              <code className="text-xs bg-white p-2 rounded border block break-all">
                POST https://jhvbfvqhuemuvwgqpskz.supabase.co/functions/v1/processar-n8n-frotas
              </code>
            </div>
            
            <div>
              <h5 className="font-medium mb-2">Mapeamento de Campos:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="bg-white p-2 rounded border">
                  <code>familia</code> → <code>categoria</code>
                </div>
                <div className="bg-white p-2 rounded border">
                  <code>ano</code> → <code>ano_modelo</code>
                </div>
                <div className="bg-white p-2 rounded border">
                  <code>proprietario</code> → <code>proprietario_nome</code>
                </div>
                <div className="bg-white p-2 rounded border">
                  Status padrão: <code>sem_seguro</code>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-2">Funcionalidades:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Processa dados JSON diretamente do N8N</li>
                <li>✅ Mapeia automaticamente campos entre sistemas</li>
                <li>✅ Insere dados em lotes para melhor performance</li>
                <li>✅ Associa automaticamente veículos à empresa correta</li>
                <li>✅ Relatório detalhado de erros e sucessos</li>
                <li>✅ Tratamento de dados parciais e campos opcionais</li>
              </ul>
            </div>
          </div>
        )}

        {/* JSON de teste */}
        {showJsonData && (
          <div className="bg-gray-900 p-4 rounded-lg">
            <h5 className="font-medium text-white mb-2">Dados JSON de Teste:</h5>
            <pre className="text-xs text-green-400 overflow-x-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}