import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { FileProcessor } from '@/services/fileProcessor';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Play, CheckCircle } from 'lucide-react';

/**
 * TESTADOR DE DADOS N8N
 * 
 * Componente para testar o processamento de dados vindos do N8N
 * com user_id null, simulando o cenário real.
 */
export function N8NDataTester() {
  const [jsonInput, setJsonInput] = useState(JSON.stringify([
    {
      "user_id": null,
      "segurado": "TULIO VILASBOAS REIS",
      "documento": "80604005504",
      "documento_tipo": "CPF",
      "data_nascimento": "",
      "seguradora": "Liberty Seguros",
      "numero_apolice": "53.19.2024.0407195",
      "inicio": "2024-02-05",
      "fim": "2025-02-05",
      "tipo": "Automóvel",
      "modelo_veiculo": "PAJERO HPE FULL 3.2 4X4 T.I.DIES. 5P AUT",
      "placa": "OUR0599",
      "ano_modelo": "2014",
      "premio": 1586.88,
      "parcelas": 12,
      "valor_parcela": 132.22,
      "pagamento": "CARTAO DE CREDITO",
      "custo_mensal": 132.24,
      "vencimentos_futuros": [
        "2024-02-13", "2024-03-13", "2024-04-13", "2024-05-13",
        "2024-06-13", "2024-07-13", "2024-08-13", "2024-09-13",
        "2024-10-13", "2024-11-13", "2024-12-13", "2025-01-13"
      ],
      "franquia": 0,
      "condutor": "",
      "email": "TULIOVBREIS@BOL.COM.BR",
      "telefone": "(71) 9996-45781",
      "status": "Ativa",
      "corretora": "AMAIS ADM E CORRETORA DE SEGUROS",
      "cidade": "SALVADOR",
      "uf": "BA",
      "coberturas": [
        {
          "descricao": "RESP CIVIL FACULTATIVA VEICULOS - DANOS MATERIAIS",
          "lmi": 150000
        },
        {
          "descricao": "RESP CIVIL FACULTATIVA VEICULOS - DANOS CORPORAIS", 
          "lmi": 150000
        },
        {
          "descricao": "RESP CIVIL FACULTATIVA VEICULOS - DANOS MORAIS",
          "lmi": 5000
        },
        {
          "descricao": "LIBERTY ASSISTENCIA PLANO ASSISTENCIA RCF",
          "lmi": 0
        }
      ]
    }
  ], null, 2));

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const simulateFileProcessing = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para testar",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 TESTE - Processando dados N8N simulados');
      
      // Parsear JSON
      const n8nData = JSON.parse(jsonInput);
      console.log('📊 Dados N8N parseados:', n8nData);

      // Criar arquivo simulado
      const jsonBlob = new Blob([JSON.stringify(n8nData)], { type: 'application/json' });
      const simulatedFile = new File([jsonBlob], 'test-n8n-data.json', { type: 'application/json' });

      // Simular o processamento através do extrator que retornaria esses dados
      console.log('🔄 Simulando processamento com FileProcessor...');

      // Criar processador de arquivos
      const fileProcessor = new FileProcessor(
        (fileName, update) => {
          console.log(`📊 Status update for ${fileName}:`, update);
        },
        (fileName) => {
          console.log(`🧹 Removendo status para ${fileName}`);
        },
        user.id, // userId do usuário logado
        (policy) => {
          console.log('✅ Política extraída:', policy);
          setResult(policy);
        },
        toast
      );

      // Mock do DynamicPDFExtractor para retornar nossos dados de teste
      const originalExtractFromMultiplePDFs = (await import('@/services/dynamicPdfExtractor')).DynamicPDFExtractor.extractFromMultiplePDFs;
      
      // Substituir temporariamente o método para retornar nossos dados de teste
      (await import('@/services/dynamicPdfExtractor')).DynamicPDFExtractor.extractFromMultiplePDFs = async (files: File[], userId?: string) => {
        console.log('🧪 Mock extractor retornando dados N8N de teste');
        return n8nData; // Retornar os dados parseados diretamente
      };

      // Processar arquivos
      await fileProcessor.processMultipleFiles([simulatedFile]);

      // Restaurar método original
      (await import('@/services/dynamicPdfExtractor')).DynamicPDFExtractor.extractFromMultiplePDFs = originalExtractFromMultiplePDFs;

      console.log('✅ Teste concluído com sucesso!');

      toast({
        title: "✅ Teste Concluído",
        description: "Dados N8N processados com sucesso!",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro no teste:', err);
      setError(errorMessage);

      toast({
        title: "❌ Erro no Teste",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Testador de Dados N8N
          </CardTitle>
          <CardDescription>
            Simule o processamento de dados vindos do N8N com user_id null para testar a resolução automática de usuário.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status do usuário */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Badge variant={user?.id ? "default" : "destructive"}>
              {user?.id ? "Logado" : "Não logado"}
            </Badge>
            {user?.id && (
              <span className="text-sm text-blue-700">
                User ID: {user.id}
              </span>
            )}
          </div>

          {/* JSON Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Dados JSON do N8N (com user_id: null)
            </label>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="font-mono text-sm"
              rows={10}
              placeholder="Cole aqui os dados JSON do N8N..."
            />
          </div>

          {/* Botão de teste */}
          <Button 
            onClick={simulateFileProcessing}
            disabled={isProcessing || !user?.id}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Simular Processamento N8N
              </>
            )}
          </Button>

          {/* Resultado */}
          {result && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Processamento Bem-sucedido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Nome:</strong> {result.name}</div>
                  <div><strong>Seguradora:</strong> {result.insurer}</div>
                  <div><strong>Número Apólice:</strong> {result.policyNumber}</div>
                  <div><strong>Prêmio:</strong> R$ {result.premium?.toLocaleString('pt-BR')}</div>
                  <div><strong>Parcelas:</strong> {result.installments?.length || 0}</div>
                  <div><strong>User ID Resolvido:</strong> 
                    <Badge variant="outline" className="ml-2">{user?.id}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Erro */}
          {error && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Erro no Processamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}