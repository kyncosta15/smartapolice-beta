import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMaintenanceData } from './useMaintenanceData';
import { MaintenanceType, MaintenanceLog, MAINTENANCE_TYPE_LABELS } from './types';
import MaintenanceStatusCards from './MaintenanceStatusCards';
import MaintenanceLogList from './MaintenanceLogList';
import MaintenanceLogModal from './MaintenanceLogModal';
import MaintenanceRulesModal from './MaintenanceRulesModal';

interface Props {
  vehicleId: string;
}

const FILTER_OPTIONS: { value: MaintenanceType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todos' },
  { value: 'REVISAO', label: '🔧 Revisão' },
  { value: 'PNEU', label: '🛞 Pneu' },
  { value: 'BATERIA', label: '🔋 Bateria' },
];

export default function VehicleMaintenanceModule({ vehicleId }: Props) {
  const { toast } = useToast();
  const { logs, rules, loading, filter, setFilter, fetchData, getStatusInfo } = useMaintenanceData(vehicleId);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);

  const handleEdit = (log: MaintenanceLog) => {
    setEditingLog(log);
    setLogModalOpen(true);
  };

  const handleNew = () => {
    setEditingLog(null);
    setLogModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('vehicle_maintenance_logs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Registro excluído' });
      fetchData();
    }
  };

  if (loading) {
    return <div className="text-center py-6 text-muted-foreground text-sm">Carregando manutenções...</div>;
  }

  return (
    <Card className="p-3 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <Wrench className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          Manutenções & Acompanhamento
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRulesModalOpen(true)}>
            <Settings className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Regras</span>
          </Button>
          <Button size="sm" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Registro
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <MaintenanceStatusCards getStatusInfo={getStatusInfo} />

      {/* Filter Chips */}
      <div className="flex gap-2 mt-4 mb-3 flex-wrap">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <Badge variant="secondary" className="ml-auto text-xs">
          {logs.length} registro(s)
        </Badge>
      </div>

      {/* Log List */}
      <MaintenanceLogList logs={logs} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Modals */}
      <MaintenanceLogModal
        open={logModalOpen}
        onOpenChange={setLogModalOpen}
        vehicleId={vehicleId}
        editingLog={editingLog}
        onSaved={fetchData}
      />
      <MaintenanceRulesModal
        open={rulesModalOpen}
        onOpenChange={setRulesModalOpen}
        vehicleId={vehicleId}
        rules={rules}
        onSaved={fetchData}
      />
    </Card>
  );
}
