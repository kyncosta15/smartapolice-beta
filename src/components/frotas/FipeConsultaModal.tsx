import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Copy, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { useFipeConsulta } from '@/hooks/useFipeConsulta';
import { useToast } from '@/hooks/use-toast';
import { Fuel } from '@/services/fipeApiService';

interface FipeConsultaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: {
    id: string;
    placa?: string;
    marca: string;
    modelo: string;
    ano_modelo: number;
    combustivel?: Fuel; // Opcional - se não informado, tenta todos os tipos
    tipo_veiculo: number;
    codigo_fipe?: string;
    preco_nf?: number;
  };
}

export function FipeConsultaModal({ open, onOpenChange, vehicle }: FipeConsultaModalProps) {
  const { consultar, isLoading, result } = useFipeConsulta();
  const { toast } = useToast();
  const [hasConsulted, setHasConsulted] = useState(false);

  const handleConsultar = async (forceRefresh = false) => {
    try {
      await consultar({
        id: vehicle.id,
        brand: vehicle.marca,
        model: vehicle.modelo,
        year: vehicle.ano_modelo,
        fuel: vehicle.combustivel || "Flex", // Fallback para tentar todos os tipos
        tipoVeiculo: vehicle.tipo_veiculo,
        fipeCode: vehicle.codigo_fipe,
        placa: vehicle.placa,
      }, forceRefresh);
      setHasConsulted(true);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleCopyResult = () => {
    if (!result) return;

    const text = `
Valor FIPE: ${result.data.price_label}
Marca/Modelo: ${vehicle.marca} / ${vehicle.modelo}
Ano/Combustível: ${vehicle.ano_modelo} / ${vehicle.combustivel || 'Automático'}
Mês de Referência: ${result.data.mes_referencia}
Código FIPE: ${result.data.fipe_code || 'N/A'}
Data da Consulta: ${new Date(result.data.data_consulta).toLocaleString('pt-BR')}
    `.trim();

    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Resultado copiado para a área de transferência",
    });
  };

  const getDifferencePercentage = () => {
    if (!result || !vehicle.preco_nf) return null;
    const diff = ((result.data.price_value - vehicle.preco_nf) / vehicle.preco_nf) * 100;
    return diff.toFixed(2);
  };

  const diffPercentage = getDifferencePercentage();

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
              <div>
                <span className="text-muted-foreground">Marca:</span>
                <span className="ml-2 font-medium">{vehicle.marca}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Modelo:</span>
                <span className="ml-2 font-medium">{vehicle.modelo}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ano:</span>
                <span className="ml-2 font-medium">{vehicle.ano_modelo}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Combustível:</span>
                <span className="ml-2 font-medium">
                  {vehicle.combustivel || (
                    <span className="text-amber-600">Automático (tenta todos)</span>
                  )}
                </span>
              </div>
              {vehicle.preco_nf && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Valor NF:</span>
                  <span className="ml-2 font-medium">
                    R$ {vehicle.preco_nf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleConsultar(false)}
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
            {hasConsulted && (
              <Button
                onClick={() => handleConsultar(true)}
                disabled={isLoading}
                variant="outline"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Resultado */}
          {result && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Resultado da Consulta</h3>
                <div className="flex items-center gap-2">
                  {result.cached && (
                    <Badge variant="secondary">
                      <Calendar className="w-3 h-3 mr-1" />
                      Cache ({result.data.dias_desde_consulta}d)
                    </Badge>
                  )}
                  {!result.cached && (
                    <Badge variant="default">
                      Atualizado
                    </Badge>
                  )}
                </div>
              </div>

              <div className="bg-primary/5 p-6 rounded-lg space-y-3">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Valor FIPE</div>
                  <div className="text-3xl font-bold text-primary">
                    {result.data.price_label}
                  </div>
                </div>

                {diffPercentage && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    {parseFloat(diffPercentage) > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={parseFloat(diffPercentage) > 0 ? 'text-green-500' : 'text-red-500'}>
                      {diffPercentage}% {parseFloat(diffPercentage) > 0 ? 'acima' : 'abaixo'} da NF
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Mês de Referência:</span>
                  <div className="font-medium mt-1">{result.data.mes_referencia}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Data da Consulta:</span>
                  <div className="font-medium mt-1">
                    {new Date(result.data.data_consulta).toLocaleString('pt-BR')}
                  </div>
                </div>
                {result.data.fipe_code && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Código FIPE:</span>
                    <div className="font-medium mt-1">{result.data.fipe_code}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleCopyResult}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Resultado
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2">
                Fonte: Tabela FIPE (consulta automática; uso informativo)
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
