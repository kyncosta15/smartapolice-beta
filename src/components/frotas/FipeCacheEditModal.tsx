import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FrotaVeiculo } from '@/hooks/useFrotasData';

interface FipeCacheEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: FrotaVeiculo;
  onSuccess?: () => void;
}

const categoriaOptions = [
  { value: 'Carros', label: 'Carros' },
  { value: 'Caminhão', label: 'Caminhão' },
  { value: 'Moto', label: 'Moto' },
];

const combustivelOptions = [
  { value: 'Gasolina', label: 'Gasolina' },
  { value: 'Etanol', label: 'Etanol' },
  { value: 'Diesel', label: 'Diesel' },
  { value: 'Flex', label: 'Flex' },
  { value: 'GNV', label: 'GNV' },
  { value: 'Híbrido', label: 'Híbrido' },
  { value: 'Elétrico', label: 'Elétrico' },
];

export function FipeCacheEditModal({ open, onOpenChange, vehicle, onSuccess }: FipeCacheEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    categoria: vehicle.categoria || '',
    codigoFipe: vehicle.codigo_fipe || vehicle.codigo || '',
    ano: vehicle.ano_modelo?.toString() || '',
    combustivel: vehicle.combustivel || '',
    valorFipe: vehicle.preco_fipe?.toString() || '',
  });

  // Reset form when vehicle changes
  useEffect(() => {
    if (open) {
      setFormData({
        categoria: vehicle.categoria || '',
        codigoFipe: vehicle.codigo_fipe || vehicle.codigo || '',
        ano: vehicle.ano_modelo?.toString() || '',
        combustivel: vehicle.combustivel || '',
        valorFipe: vehicle.preco_fipe?.toString() || '',
      });
    }
  }, [open, vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação básica
      if (!formData.categoria) {
        toast.error('Categoria é obrigatória');
        setLoading(false);
        return;
      }

      // Atualizar dados do veículo (categoria)
      const { error: vehicleError } = await supabase
        .from('frota_veiculos')
        .update({
          categoria: formData.categoria,
          codigo_fipe: formData.codigoFipe || null,
          ano_modelo: formData.ano ? parseInt(formData.ano) : null,
          combustivel: formData.combustivel || null,
          preco_fipe: formData.valorFipe ? parseFloat(formData.valorFipe.replace(/[^\d,]/g, '').replace(',', '.')) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicle.id);

      if (vehicleError) throw vehicleError;

      // Se existe cache FIPE, atualizar também
      if (vehicle.preco_fipe) {
        const { error: cacheError } = await supabase
          .from('fipe_cache')
          .update({
            fipe_code: formData.codigoFipe || null,
            year_model: formData.ano ? parseInt(formData.ano) : null,
            fuel: formData.combustivel || null,
            price_value: formData.valorFipe ? parseFloat(formData.valorFipe.replace(/[^\d,]/g, '').replace(',', '.')) : null,
            updated_at: new Date().toISOString(),
          })
          .eq('vehicle_id', vehicle.id);

        // Não vamos falhar se não encontrar cache, apenas log
        if (cacheError) {
          console.warn('Erro ao atualizar cache FIPE:', cacheError);
        }
      }

      toast.success('Dados atualizados com sucesso!');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast.error('Erro ao atualizar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    // Converte para número e formata
    if (numbers) {
      const numValue = parseFloat(numbers) / 100;
      return numValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return '';
  };

  const handleValorFipeChange = (value: string) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({ ...prev, valorFipe: formatted }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Dados FIPE</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Veículo
            </Label>
            <div className="text-sm text-muted-foreground">
              {vehicle.marca} {vehicle.modelo} - {vehicle.placa}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">
              Categoria <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
            >
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriaOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigoFipe">Código FIPE</Label>
            <Input
              id="codigoFipe"
              placeholder="Ex: 012345-6"
              value={formData.codigoFipe}
              onChange={(e) => setFormData(prev => ({ ...prev, codigoFipe: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ano">Ano do Modelo</Label>
              <Input
                id="ano"
                type="number"
                placeholder="Ex: 2020"
                min="1900"
                max="2030"
                value={formData.ano}
                onChange={(e) => setFormData(prev => ({ ...prev, ano: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="combustivel">Combustível</Label>
              <Select
                value={formData.combustivel}
                onValueChange={(value) => setFormData(prev => ({ ...prev, combustivel: value }))}
              >
                <SelectTrigger id="combustivel">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {combustivelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valorFipe">Valor FIPE (R$)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="valorFipe"
                placeholder="0,00"
                value={formData.valorFipe}
                onChange={(e) => handleValorFipeChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
