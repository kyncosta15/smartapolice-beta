import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  CheckSquare, 
  Shield, 
  X, 
  AlertTriangle,
  Loader2,
  Trash2
} from 'lucide-react';
import { FrotaVeiculo } from '@/hooks/useFrotasData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FrotasBulkActionsProps {
  selectedVehicles: FrotaVeiculo[];
  onClearSelection: () => void;
  onUpdateComplete: () => void;
}

export function FrotasBulkActions({ 
  selectedVehicles, 
  onClearSelection, 
  onUpdateComplete 
}: FrotasBulkActionsProps) {
  const [bulkStatus, setBulkStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (selectedVehicles.length === 0) {
    return null;
  }

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus) {
      toast.error('Selecione um status para aplicar aos veículos selecionados');
      return;
    }

    setLoading(true);
    try {
      const vehicleIds = selectedVehicles.map(v => v.id);
      
      const { error } = await supabase
        .from('frota_veiculos')
        .update({ 
          status_seguro: bulkStatus,
          updated_at: new Date().toISOString()
        })
        .in('id', vehicleIds);

      if (error) throw error;

      toast.success(`Status atualizado para ${selectedVehicles.length} veículo(s)`);
      
      // Clear selection and refresh data
      onClearSelection();
      onUpdateComplete();
      setBulkStatus('');
      
      // Dispatch events to refresh dashboard
      window.dispatchEvent(new CustomEvent('frota-data-updated'));
      
    } catch (error) {
      console.error('Erro ao atualizar status em lote:', error);
      toast.error('Erro ao atualizar o status dos veículos');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedVehicles.length === 0) {
      toast.error('Selecione veículos para excluir');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir ${selectedVehicles.length} veículo(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeleting(true);
    try {
      const vehicleIds = selectedVehicles.map(v => v.id);
      
      // Primeiro deletar documentos relacionados
      const { error: docsError } = await supabase
        .from('frota_documentos')
        .delete()
        .in('veiculo_id', vehicleIds);

      if (docsError) throw docsError;

      // Deletar responsáveis relacionados
      const { error: responsaveisError } = await supabase
        .from('frota_responsaveis')
        .delete()
        .in('veiculo_id', vehicleIds);

      if (responsaveisError) throw responsaveisError;

      // Deletar pagamentos relacionados
      const { error: pagamentosError } = await supabase
        .from('frota_pagamentos')
        .delete()
        .in('veiculo_id', vehicleIds);

      if (pagamentosError) throw pagamentosError;

      // Por fim, deletar os veículos
      const { error } = await supabase
        .from('frota_veiculos')
        .delete()
        .in('id', vehicleIds);

      if (error) throw error;

      toast.success(`${selectedVehicles.length} veículo(s) excluído(s) com sucesso`);
      
      // Clear selection and refresh data
      onClearSelection();
      onUpdateComplete();
      
      // Dispatch events to refresh dashboard
      window.dispatchEvent(new CustomEvent('frota-data-updated'));
      
    } catch (error) {
      console.error('Erro ao excluir veículos:', error);
      toast.error('Erro ao excluir os veículos');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'sem_seguro': 'Sem Seguro',
      'segurado': 'Segurado',
      'vencido': 'Vencido',
      'vigente': 'Vigente',
      'vence_30_dias': 'Vence em 30 dias',
      'vence_60_dias': 'Vence em 60 dias',
      'cotacao': 'Em Cotação'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      'vigente': 'bg-green-100 text-green-800',
      'segurado': 'bg-green-100 text-green-800',
      'vencido': 'bg-red-100 text-red-800',
      'vence_30_dias': 'bg-yellow-100 text-yellow-800',
      'vence_60_dias': 'bg-blue-100 text-blue-800',
      'sem_seguro': 'bg-gray-100 text-gray-800',
      'cotacao': 'bg-purple-100 text-purple-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardContent className="p-3 md:p-4">
        {/* Mobile-first layout */}
        <div className="space-y-3">
          {/* Selection Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-900">
                {selectedVehicles.length} selecionado(s)
              </span>
            </div>
            
            {/* Cancel button - always visible on mobile */}
            <Button
              onClick={onClearSelection}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-800 h-8 px-3"
            >
              <X className="h-3 w-3 md:mr-1" />
              <span className="hidden md:inline">Cancelar</span>
            </Button>
          </div>

          {/* Current Status Summary - scrollable on mobile */}
          <div className="overflow-x-auto">
            <div className="flex gap-1 pb-1 min-w-max">
              {Object.entries(
                selectedVehicles.reduce((acc, vehicle) => {
                  const status = vehicle.status_seguro || 'sem_seguro';
                  acc[status] = (acc[status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([status, count]) => (
                <Badge 
                  key={status} 
                  variant="outline" 
                  className={`text-xs whitespace-nowrap ${getStatusBadgeColor(status)}`}
                >
                  {getStatusLabel(status)}: {count}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions - stacked on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center gap-2 flex-1">
              <Shield className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="flex-1 min-w-0 h-9 text-sm">
                  <SelectValue placeholder="Alterar status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem_seguro">Sem Seguro</SelectItem>
                  <SelectItem value="segurado">Segurado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                  <SelectItem value="vigente">Vigente</SelectItem>
                  <SelectItem value="vence_30_dias">Vence em 30 dias</SelectItem>
                  <SelectItem value="vence_60_dias">Vence em 60 dias</SelectItem>
                  <SelectItem value="cotacao">Em Cotação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatus || loading || deleting}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none h-9"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3 w-3 mr-2" />
                    Aplicar Status
                  </>
                )}
              </Button>

              <Button
                onClick={handleBulkDelete}
                disabled={loading || deleting}
                size="sm"
                variant="destructive"
                className="flex-1 sm:flex-none h-9"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 mr-2" />
                    Excluir
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Confirmation message */}
          {bulkStatus && (
            <div className="p-3 bg-white rounded border border-blue-200">
              <div className="flex items-start gap-2 text-sm text-blue-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">
                  Será aplicado o status "<strong>{getStatusLabel(bulkStatus)}</strong>" 
                  para <strong>{selectedVehicles.length}</strong> veículo(s) selecionado(s).
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}