import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DialogRCorp } from '@/components/ui-v2/dialog-rcorp';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

interface BatchResult {
  ok: boolean;
  stats: {
    total: number;
    processed: number;
    success: number;
    fail: number;
    skipped: number;
  };
  updatedSample?: any[];
  errors: Array<{ id: any; reason: string }>;
}

interface BatchFipeUpdateProps {
  selectedVehicleIds?: string[];
  onSuccess?: () => void;
}

export function BatchFipeUpdate({ selectedVehicleIds, onSuccess }: BatchFipeUpdateProps) {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { activeEmpresaId } = useTenant();

  const isRunningRef = useRef(false);

  const handleProcess = async () => {
    // Prevenir chamadas concorrentes
    if (isRunningRef.current) {
      console.log('[BatchFipeUpdate] Processamento já em andamento, ignorando clique duplicado');
      return;
    }

    if (!activeEmpresaId) {
      toast({
        title: 'Erro',
        description: 'Empresa não identificada',
        variant: 'destructive'
      });
      return;
    }

    isRunningRef.current = true;
    setIsProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 1000);

      const { data, error } = await supabase.functions.invoke('refresh-fipe-batch', {
        body: {
          mode: "query",
          empresa_id: activeEmpresaId,
          vehicle_ids: selectedVehicleIds,
          concurrency: 6,
          pageSize: 50,
          delayMs: 200,
          maxRetries: 2
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      setResult(data as BatchResult);

      if (data.stats.success > 0) {
        toast({
          title: 'Processamento concluído',
          description: `${data.stats.success} veículo(s) atualizado(s) com sucesso`
        });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: 'Nenhum veículo atualizado',
          description: 'Verifique os detalhes do processamento',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao processar FIPE em lote:', error);
      toast({
        title: 'Erro ao processar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
      setProgress(0);
    } finally {
      setIsProcessing(false);
      isRunningRef.current = false;
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setOpen(false);
      setResult(null);
      setProgress(0);
    }
  };

  const vehicleCount = selectedVehicleIds?.length || 'todos os';

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Zap className="h-4 w-4" />
        Atualizar FIPE em Lote
      </Button>

      <DialogRCorp
        open={open}
        onOpenChange={handleClose}
        title="Atualização em Lote de Valores FIPE"
        size="lg"
      >
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {selectedVehicleIds && selectedVehicleIds.length > 0 ? (
                <>Esta operação irá consultar a API FIPE e atualizar os valores de <strong>{selectedVehicleIds.length} veículo(s) selecionado(s)</strong>.</>
              ) : (
                <>Esta operação irá consultar a API FIPE e atualizar os valores de <strong>todos os veículos</strong> da sua empresa.</>
              )}
              <br />
              <span className="text-xs mt-1 block">
                ⚠️ O processamento pode levar alguns minutos dependendo da quantidade de veículos.
              </span>
            </AlertDescription>
          </Alert>

          {!result && !isProcessing && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <RefreshCw className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Pronto para começar</h3>
                  <p className="text-sm text-gray-600">
                    Atualizar {vehicleCount} veículo(s)
                  </p>
                </div>
              </div>
              <Button
                onClick={handleProcess}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Iniciar Atualização
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-4">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="font-medium">Processando consultas FIPE...</p>
                <p className="text-sm text-gray-500 mt-1">
                  Por favor, aguarde. Não feche esta janela.
                </p>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-center text-gray-500">{progress}%</p>
            </div>
          )}

          {result && !isProcessing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-blue-600" />
                      Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">{result.stats.total}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Sucesso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{result.stats.success}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                      Ignorados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-yellow-600">{result.stats.skipped}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-red-600" />
                      Erros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600">{result.stats.fail}</p>
                  </CardContent>
                </Card>
              </div>

              {result.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Detalhes dos Erros e Ignorados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                         {result.errors.map((error, index) => (
                          <div
                            key={index}
                            className="text-sm p-2 bg-gray-50 rounded border"
                          >
                            <span className="font-medium font-mono">ID {error.id}:</span>{' '}
                            <span className="text-gray-600">{error.reason}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setResult(null);
                    setProgress(0);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Processar Novamente
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogRCorp>
    </>
  );
}
