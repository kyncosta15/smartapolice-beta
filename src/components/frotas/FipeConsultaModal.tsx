import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, DollarSign, CheckCircle, AlertCircle, XCircle, FileJson } from 'lucide-react';
import { useFipeConsulta } from '@/hooks/useFipeConsulta';
import { useToast } from '@/hooks/use-toast';

interface VehicleData {
  id: string;
  placa?: string;
  marca: string;
  modelo: string;
  ano_modelo: number;
  combustivel?: string;
  tipo_veiculo: number;
  codigo_fipe?: string;
  preco_nf?: number;
  categoria?: string;
}

interface FipeConsultaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleData;
  onVehicleUpdate?: (fipeData: any) => void;
}

export function FipeConsultaModal({ open, onOpenChange, vehicle, onVehicleUpdate }: FipeConsultaModalProps) {
  const { consultar, isLoading, result, fullResponse } = useFipeConsulta();
  const { toast } = useToast();
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [isFetchingValue, setIsFetchingValue] = useState(false);
  const scrollPositionRef = useRef<number>(0);
  const [normalizedData, setNormalizedData] = useState({
    marca: vehicle.marca,
    modelo: vehicle.modelo,
    ano: vehicle.ano_modelo,
  });

  // Salvar e restaurar posição do scroll - REMOVIDO (gerenciado pelo componente pai)
  // useEffect(() => {
  //   if (open) {
  //     scrollPositionRef.current = window.scrollY;
  //   } else {
  //     requestAnimationFrame(() => {
  //       window.scrollTo({
  //         top: scrollPositionRef.current,
  //         behavior: 'instant'
  //       });
  //     });
  //   }
  // }, [open]);

  // Reset do estado quando o veículo mudar
  useEffect(() => {
    setNormalizedData({
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      ano: vehicle.ano_modelo,
    });
    // Limpar resultados anteriores
    setShowDetailsDrawer(false);
    setIsFetchingValue(false);
  }, [vehicle.id, vehicle.marca, vehicle.modelo, vehicle.ano_modelo]);

  const handleConsultar = async () => {
    setIsFetchingValue(false); // Reset estado
    try {
      const response = await consultar({
        id: vehicle.id,
        brand: vehicle.marca,
        model: vehicle.modelo,
        year: vehicle.ano_modelo,
        fuel: vehicle.combustivel,
        tipoVeiculo: vehicle.tipo_veiculo,
        fipeCode: vehicle.codigo_fipe,
        placa: vehicle.placa,
        categoria: vehicle.categoria,
      });

      // Atualizar dados normalizados se status OK
      if (response?.status === 'ok' && response.normalized) {
        const yearStr = response.normalized.year_hint?.split('-')[0] || String(vehicle.ano_modelo);
        const yearNum = parseInt(yearStr, 10);
        
        setNormalizedData({
          marca: response.normalized.brand.toUpperCase(),
          modelo: response.normalized.model,
          ano: yearNum,
        });

        // Notificar componente pai com os dados da FIPE se houver
        if (onVehicleUpdate && response.fipeValue) {
          onVehicleUpdate(response.fipeValue);
        }
      }
    } catch (error) {
      // Erro já tratado no hook
      setIsFetchingValue(false);
    }
  };

  const handleCopyJSON = () => {
    if (!fullResponse) return;
    
    const jsonText = JSON.stringify(fullResponse, null, 2);
    navigator.clipboard.writeText(jsonText);
    toast({
      title: "JSON copiado!",
      description: "Resposta completa copiada para a área de transferência",
    });
  };

  const getStatusBadge = () => {
    if (!result) return null;

    const confidence = result.normalized?.confidence || 0;
    const confidencePercent = Math.round(confidence * 100);

    if (result.status === 'ok') {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Padronizado FIPE ✓ ({confidencePercent}%)
        </Badge>
      );
    } else if (result.status === 'review') {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          <AlertCircle className="w-3 h-3 mr-1" />
          Revisar
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Erro
        </Badge>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Consulta FIPE
          </DialogTitle>
          <DialogDescription>
            Consulte o valor de mercado segundo a Tabela FIPE
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dados do Veículo */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Dados do Veículo</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {vehicle.placa && (
                <div>
                  <span className="text-muted-foreground">Placa:</span>
                  <span className="ml-2 font-medium">{vehicle.placa}</span>
                </div>
              )}
              {vehicle.codigo_fipe && (
                <div>
                  <span className="text-muted-foreground">Código FIPE:</span>
                  <span className="ml-2 font-medium">{vehicle.codigo_fipe}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Marca:</span>
                <span className="ml-2 font-medium">{normalizedData.marca}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ano:</span>
                <span className="ml-2 font-medium">{normalizedData.ano}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Modelo:</span>
                <span className="ml-2 font-medium">{normalizedData.modelo}</span>
              </div>
              {vehicle.combustivel && (
                <div>
                  <span className="text-muted-foreground">Combustível:</span>
                  <span className="ml-2 font-medium">{vehicle.combustivel}</span>
                </div>
              )}
              {vehicle.categoria && (
                <div>
                  <span className="text-muted-foreground">Categoria:</span>
                  <span className="ml-2 font-medium">{vehicle.categoria}</span>
                </div>
              )}
            </div>
          </div>

          {/* Botão de Ação */}
          <div className="flex gap-2">
            <Button
              onClick={handleConsultar}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>Consultar FIPE</>
              )}
            </Button>
          </div>

          {/* Status Badge e Link para Detalhes */}
          {result && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Resultado</h3>
                {getStatusBadge()}
              </div>

              {/* Valor FIPE */}
              {result.status === 'ok' && result.fipeValue && (
                <div className="bg-primary/5 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">Valor FIPE</div>
                    <div className="flex gap-2">
                      {result.fipeValue.used_year && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                          Ano {result.fipeValue.used_year}
                        </span>
                      )}
                      {result.fipeValue.cached && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          Cache
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {result.fipeValue.price_label}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {result.fipeValue.mes_referencia}
                    {result.fipeValue.fipe_code && (
                      <span className="ml-2">• Código: {result.fipeValue.fipe_code}</span>
                    )}
                    {result.fipeValue.used_year && (
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        ℹ️ Valor referente ao ano {result.fipeValue.used_year} (ano mais próximo disponível)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading da consulta FIPE */}
              {result.status === 'ok' && !result.fipeValue && isLoading && (
                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">
                    Consultando valor na tabela FIPE...
                  </div>
                </div>
              )}

              {/* Erro ao buscar valor FIPE */}
              {result.status === 'ok' && !result.fipeValue && !isLoading && result.error && (
                <div className="bg-yellow-500/5 p-4 rounded-lg border border-yellow-500/20 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                        Valor FIPE não encontrado
                      </div>
                      <div className="text-sm text-yellow-600 dark:text-yellow-500 whitespace-pre-wrap">
                        {result.error}
                      </div>
                    </div>
                  </div>
                  
                  {/* Dicas para resolver o problema */}
                  <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded border border-yellow-500/10">
                    <p className="font-medium mb-2">💡 Possíveis causas:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>O modelo normalizado pode ter variação de nome na FIPE</li>
                      <li>Ano/combustível não disponíveis para este modelo</li>
                      <li>Tipo de veículo incorreto (carro/caminhão/moto)</li>
                      <li>Modelo pode ter sido descontinuado antes deste ano</li>
                    </ul>
                    <p className="mt-2 text-xs italic">
                      📋 Verifique os "Detalhes FIPE (LLM)" abaixo para mais informações
                    </p>
                  </div>
                </div>
              )}

              {/* Mensagem de Review */}
              {result.status === 'review' && result.normalized?.reason && (
                <div className="bg-yellow-500/5 p-4 rounded-lg border border-yellow-500/20">
                  <div className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                    Motivo: {result.normalized.reason}
                  </div>
                </div>
              )}

              {/* Mensagem de Erro */}
              {result.status === 'error' && (
                <div className="bg-destructive/5 p-4 rounded-lg border border-destructive/20 space-y-3">
                  <div className="text-sm font-medium text-destructive">
                    {result.error === 'MISSING_FIELDS' 
                      ? 'Campos obrigatórios faltando (marca, modelo ou ano)'
                      : 'Dados incorretos, confirme o código FIPE e/ou categoria do veículo'}
                  </div>
                  
                  {/* Mostrar dados normalizados mesmo com erro, se existirem */}
                  {result.normalized && (
                    <div className="text-sm text-muted-foreground mt-2 pt-2 border-t border-destructive/20">
                      <div className="font-medium mb-1">Dados detectados:</div>
                      <div className="space-y-1 ml-2">
                        <div>Marca: {result.normalized.brand}</div>
                        <div>Modelo: {result.normalized.model}</div>
                        <div>Ano: {result.normalized.year_hint}</div>
                        {result.normalized.reason && (
                          <div className="mt-2 italic">{result.normalized.reason}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </DialogContent>

      {/* Drawer com Detalhes JSON */}
      <Drawer open={showDetailsDrawer} onOpenChange={setShowDetailsDrawer}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Detalhes da Resposta FIPE (LLM)</DrawerTitle>
            <DrawerDescription>
              JSON completo retornado pelo webhook de normalização
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 overflow-auto flex-1">
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
              {JSON.stringify(fullResponse, null, 2)}
            </pre>
          </div>

          <div className="p-4 border-t flex gap-2">
            <Button onClick={handleCopyJSON} className="flex-1">
              <Copy className="w-4 h-4 mr-2" />
              Copiar JSON
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </Dialog>
  );
}
