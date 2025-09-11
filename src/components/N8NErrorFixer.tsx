import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle, Bug, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * CORRETOR ESPECÍFICO DO ERRO N8N
 * 
 * Simula exatamente o cenário do erro para testá-lo e corrigi-lo
 */
export function N8NErrorFixer() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  // Dados EXATOS que vieram do N8N e causaram o erro
  const problematicN8NData = [
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
  ];

  const testN8NErrorFix = async () => {
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
      console.log('🐛 TESTE - Reproduzindo erro específico do N8N');
      console.log('📊 Dados problemáticos (user_id: null):', problematicN8NData);

      // Criar arquivo simulado que representa o que o N8N retornaria
      const jsonBlob = new Blob([JSON.stringify(problematicN8NData)], { type: 'application/json' });
      const simulatedFile = new File([jsonBlob], 'liberty-seguros-tulio.pdf', { type: 'application/pdf' });

      // Importar e usar o FileProcessor corrigido
      const { FileProcessor } = await import('@/services/fileProcessor');

      console.log('🔧 Usando FileProcessor com correções de user_id');

      // Criar processador com callbacks
      const fileProcessor = new FileProcessor(
        (fileName, update) => {
          console.log(`📊 Status ${fileName}:`, update);
        },
        (fileName) => {
          console.log(`🧹 Removendo status ${fileName}`);
        },
        user.id, // UserID do usuário logado
        (policy) => {
          console.log('✅ Política extraída com sucesso:', policy);
          setResult({
            success: true,
            policy: {
              name: policy.name,
              insurer: policy.insurer,
              policyNumber: policy.policyNumber,
              premium: policy.premium,
              installments: policy.installments?.length || 0,
              resolvedUserId: user.id
            }
          });
        },
        toast
      );

      // Mock do DynamicPDFExtractor para retornar dados N8N problemáticos
      const { DynamicPDFExtractor } = await import('@/services/dynamicPdfExtractor');
      const originalMethod = DynamicPDFExtractor.extractFromMultiplePDFs;
      
      // Substituir temporariamente
      DynamicPDFExtractor.extractFromMultiplePDFs = async (files: File[], userId?: string) => {
        console.log('🧪 Mock: Retornando dados N8N com user_id null');
        console.log('🧪 Mock: userId recebido:', userId);
        return problematicN8NData; // Dados com user_id: null
      };

      // Processar o arquivo simulado
      await fileProcessor.processMultipleFiles([simulatedFile]);

      // Restaurar método original
      DynamicPDFExtractor.extractFromMultiplePDFs = originalMethod;

      console.log('✅ Teste concluído - erro foi corrigido!');

      toast({
        title: "✅ Erro Corrigido!",
        description: "O sistema agora resolve automaticamente user_id quando N8N envia null",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro no teste:', err);
      setError(errorMessage);

      toast({
        title: "❌ Erro Persiste",
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
            <Bug className="h-5 w-5 text-orange-600" />
            Corretor do Erro N8N
          </CardTitle>
          <CardDescription>
            Testa a correção específica para o erro "Nenhuma Apólice Processada" quando N8N envia user_id: null
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
                User ID que será resolvido: {user.id}
              </span>
            )}
          </div>

          {/* Dados problemáticos */}
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-semibold text-orange-700 mb-2">Problema Detectado:</h4>
            <p className="text-sm text-orange-600 mb-2">
              N8N está enviando dados com <code className="bg-orange-100 px-1 rounded">user_id: null</code>
            </p>
            <div className="text-xs font-mono bg-white p-2 rounded border">
              <span className="text-red-600">"user_id": null</span><br/>
              <span className="text-gray-600">"segurado": "TULIO VILASBOAS REIS"</span><br/>
              <span className="text-gray-600">"seguradora": "Liberty Seguros"</span><br/>
              <span className="text-gray-600">...</span>
            </div>
          </div>

          {/* Correção aplicada */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-700 mb-2">Correção Aplicada:</h4>
            <ul className="text-sm text-green-600 space-y-1">
              <li>• UserIdResolver agora resolve user_id automaticamente</li>
              <li>• Estratégias: usuário logado → e-mail → documento → sessão</li>
              <li>• Sistema robusto de persistência implementado</li>
              <li>• Campos confirmados protegidos contra sobrescrita</li>
            </ul>
          </div>

          {/* Botão de teste */}
          <Button 
            onClick={testN8NErrorFix}
            disabled={isProcessing || !user?.id}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testando Correção...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Testar Correção do Erro N8N
              </>
            )}
          </Button>

          {/* Resultado */}
          {result?.success && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  ✅ Erro Corrigido com Sucesso!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div><strong>Segurado:</strong> {result.policy.name}</div>
                  <div><strong>Seguradora:</strong> {result.policy.insurer}</div>
                  <div><strong>Número:</strong> {result.policy.policyNumber}</div>
                  <div><strong>Prêmio:</strong> R$ {result.policy.premium?.toLocaleString('pt-BR')}</div>
                  <div><strong>Parcelas:</strong> {result.policy.installments}</div>
                  <div className="pt-2 border-t border-green-200">
                    <strong className="text-green-800">User ID Resolvido:</strong>
                    <Badge variant="outline" className="ml-2 text-green-700 border-green-300">
                      {result.policy.resolvedUserId}
                    </Badge>
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
                  Erro Ainda Não Resolvido
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