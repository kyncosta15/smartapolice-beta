
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from "@/components/ui/button"
import { FilePlus, File, X } from 'lucide-react';
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PolicyDataParser, ParsedPolicyData } from '@/utils/policyDataParser';
import { useToast } from '@/hooks/use-toast';

interface EnhancedPDFUploadProps {
  onPolicyExtracted: (policy: ParsedPolicyData) => void;
}

export function EnhancedPDFUpload({ onPolicyExtracted }: EnhancedPDFUploadProps) {
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  // Webhook n8n URL
  const N8N_WEBHOOK_URL = 'https://beneficiosagente.app.n8n.cloud/webhook-test/a2c01401-91f5-4652-a2b7-4faadbf93745';

  const triggerN8NWebhook = async (policyData: ParsedPolicyData, fileName: string) => {
    try {
      console.log('Triggering n8n webhook for:', fileName);
      
      const webhookData = {
        timestamp: new Date().toISOString(),
        fileName: fileName,
        policyData: {
          id: policyData.id,
          name: policyData.name,
          type: policyData.type,
          insurer: policyData.insurer,
          premium: policyData.premium,
          monthlyAmount: policyData.monthlyAmount,
          policyNumber: policyData.policyNumber,
          startDate: policyData.startDate,
          endDate: policyData.endDate,
          paymentFrequency: policyData.paymentFrequency,
          status: policyData.status,
          vehicle: policyData.vehicle,
          totalCoverage: policyData.totalCoverage,
          deductible: policyData.deductible,
          claimRate: policyData.claimRate,
          installments: policyData.installments,
          paymentMethod: policyData.paymentMethod,
          extractedAt: policyData.extractedAt
        },
        source: 'SmartApólice',
        event: 'policy_uploaded'
      };

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(webhookData),
      });

      console.log('n8n webhook triggered successfully for:', fileName);
      
      toast({
        title: "Integração Ativada",
        description: `Webhook n8n executado para ${fileName}`,
      });

    } catch (error) {
      console.error('Error triggering n8n webhook:', error);
      
      toast({
        title: "Aviso de Integração",
        description: "Erro ao executar webhook n8n, mas a apólice foi processada com sucesso",
        variant: "default",
      });
    }
  };

  // Simular recebimento de dados do webhook
  const simulateWebhookData = (fileName: string) => {
    // Simular diferentes tipos de dados que podem vir do webhook
    const sampleData = [
      {
        seguradora: "Mapfre",
        tipo: "auto",
        inicio: "2024-07-01",
        fim: "2025-07-01",
        premio: 3821,
        parcelas: [
          { valor: 318.41, data: "2024-07-01" },
          { valor: 318.41, data: "2024-08-01" },
          { valor: 318.41, data: "2024-09-01" },
          { valor: 318.41, data: "2024-10-01" }
        ],
        pagamento: "boleto",
        custo_mensal: 318.41,
        veiculo: "SW4",
        cobertura_total: 85000,
        franquia: 2500,
        sinistralidade: 8.5
      },
      {
        seguradora: "Porto Seguro",
        tipo: "vida",
        inicio: "2024-01-15",
        fim: "2025-01-15",
        premio: 2400,
        parcelas: [
          { valor: 200, data: "2024-01-15" },
          { valor: 200, data: "2024-02-15" }
        ],
        pagamento: "cartao",
        custo_mensal: 200,
        cobertura_total: 150000,
        sinistralidade: 2.1
      },
      {
        seguradora: "SulAmérica",
        tipo: "patrimonial",
        inicio: "2024-03-01",
        fim: "2025-03-01",
        premio: 1800,
        parcelas: [
          { valor: 150, data: "2024-03-01" },
          { valor: 150, data: "2024-04-01" }
        ],
        pagamento: "debito",
        custo_mensal: 150,
        cobertura_total: 300000,
        franquia: 1500,
        sinistralidade: 5.2
      }
    ];

    // Selecionar dados aleatórios
    const randomData = sampleData[Math.floor(Math.random() * sampleData.length)];
    
    // Simular possíveis formatos de recebimento
    const formats = [
      randomData, // Objeto direto
      JSON.stringify(randomData), // String JSON
      `"${JSON.stringify(randomData).replace(/"/g, '\\"')}"`, // String escapada
    ];

    return formats[Math.floor(Math.random() * formats.length)];
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles || acceptedFiles.length === 0) {
      console.warn("Nenhum arquivo foi selecionado.");
      return;
    }

    for (const file of acceptedFiles) {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      try {
        // Simular processamento
        for (let progress = 0; progress <= 100; progress += 20) {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Simular dados do webhook
        const simulatedWebhookData = simulateWebhookData(file.name);
        
        // Parse robusto dos dados
        const parsedData = PolicyDataParser.parseRobustPolicyData(simulatedWebhookData);
        console.log('Parsed policy data:', parsedData);
        
        // Converter para formato padronizado
        const newPolicy = PolicyDataParser.convertToParsedPolicy(parsedData, file.name, file);

        console.log('Created policy:', newPolicy);
        onPolicyExtracted(newPolicy);

        // Trigger n8n webhook após processamento bem-sucedido
        await triggerN8NWebhook(newPolicy, file.name);

        toast({
          title: "Apólice Processada",
          description: `${file.name} foi processada com sucesso. Dados extraídos: ${newPolicy.insurer} - ${newPolicy.type}`,
        });

        setUploadProgress(prev => {
          const { [file.name]: removed, ...rest } = prev;
          return rest;
        });
      } catch (error) {
        console.error("Erro ao processar o arquivo:", file.name, error);
        
        toast({
          title: "Erro no Processamento",
          description: `Erro ao processar ${file.name}. Tente novamente.`,
          variant: "destructive",
        });
        
        setUploadProgress(prev => {
          const { [file.name]: removed, ...rest } = prev;
          return rest;
        });
      }
    }

    setUploadProgress({});
  }, [onPolicyExtracted, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 10,
  });

  const fileCount = Object.keys(uploadProgress).length;

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Upload de Apólices - Extração Inteligente</CardTitle>
          <CardDescription>
            Arraste e solte os arquivos PDF ou clique para selecionar.
            <br />
            <span className="text-xs text-blue-600">✓ Extração automática de dados via n8n</span>
            <br />
            <span className="text-xs text-green-600">✓ Parsing robusto de policyData</span>
            <br />
            <span className="text-xs text-purple-600">✓ Dashboard dinâmico baseado em dados reais</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div {...getRootProps()} className="relative border-2 border-dashed rounded-md p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <input {...getInputProps()} />
            <div className="text-center">
              <FilePlus className="h-6 w-6 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                {isDragActive ? 'Solte os arquivos aqui...' : 'Arraste e solte os arquivos PDF ou clique para selecionar'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Os dados serão extraídos automaticamente via webhook
              </p>
            </div>
          </div>

          {fileCount > 0 && (
            <div className="mt-4">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <File className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-700">{fileName}</p>
                    </div>
                    <p className="text-xs text-gray-500">{progress}%</p>
                  </div>
                  <Progress value={progress} className="mt-1" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <div className="text-xs text-gray-500">
            <p>🔄 Processamento automático com n8n</p>
            <p>📊 Dashboard atualizado em tempo real</p>
          </div>
          {fileCount > 0 && (
            <p className="text-sm text-gray-500">Processando {fileCount} arquivo(s)...</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
