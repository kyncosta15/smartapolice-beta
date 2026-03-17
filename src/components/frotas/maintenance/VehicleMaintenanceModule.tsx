import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, Wrench, ClipboardCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMaintenanceData } from './useMaintenanceData';
import { MaintenanceType, MaintenanceLog, MAINTENANCE_TYPE_LABELS, MAINTENANCE_TYPE_ICONS } from './types';
import MaintenanceStatusCards from './MaintenanceStatusCards';
import MaintenanceLogList from './MaintenanceLogList';
import MaintenanceLogModal from './MaintenanceLogModal';
import MaintenanceRulesModal from './MaintenanceRulesModal';

interface Props {
  vehicleId: string;
}

// Tipos de REVISÃO
const REVISAO_TYPES: MaintenanceType[] = ['REVISAO', 'REVISAO_COMPLETA', 'PREVENTIVA', 'CORRETIVA'];

// Tipos de MANUTENÇÃO
const MANUTENCAO_TYPES: MaintenanceType[] = ['TROCA_OLEO', 'TROCA_PNEUS', 'TROCA_FREIOS', 'TROCA_FILTROS', 'TROCA_BATERIA', 'BATERIA', 'PNEU', 'OUTRA'];

export default function VehicleMaintenanceModule({ vehicleId }: Props) {
  const { toast } = useToast();
  const { logs, allLogs, rules, loading, initialLoaded, fetchData, getStatusInfo } = useMaintenanceData(vehicleId);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [internalTab, setInternalTab] = useState('revisoes');
  const [filterType, setFilterType] = useState<MaintenanceType | 'ALL'>('ALL');

  const handleEdit = (log: MaintenanceLog) => {
    setEditingLog(log);
    setLogModalOpen(true);
  };

  const handleNew = (defaultType?: MaintenanceType) => {
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

  // Filter logs by tab category and optional type filter
  const currentTypes = internalTab === 'revisoes' ? REVISAO_TYPES : MANUTENCAO_TYPES;
  const tabLogs = allLogs.filter(l => currentTypes.includes(l.type));
  const filteredLogs = filterType === 'ALL' ? tabLogs : tabLogs.filter(l => l.type === filterType);

  // Alert counts
  const pendentes = allLogs.filter(l => !l.realizada).length;
  const vencidos = (() => {
    let count = 0;
    for (const type of [...REVISAO_TYPES, ...MANUTENCAO_TYPES]) {
      const info = getStatusInfo(type);
      if (info.status === 'VENCIDO') count++;
    }
    return count;
  })();
  const atencao = (() => {
    let count = 0;
    for (const type of [...REVISAO_TYPES, ...MANUTENCAO_TYPES]) {
      const info = getStatusInfo(type);
      if (info.status === 'ATENCAO') count++;
    }
    return count;
  })();

  if (loading) {
    return <div className="text-center py-6 text-muted-foreground text-sm">Carregando manutenções...</div>;
  }

  const filterOptions = internalTab === 'revisoes'
    ? [{ value: 'ALL' as const, label: 'Todos' }, ...REVISAO_TYPES.map(t => ({ value: t, label: `${MAINTENANCE_TYPE_ICONS[t]} ${MAINTENANCE_TYPE_LABELS[t]}` }))]
    : [{ value: 'ALL' as const, label: 'Todos' }, ...MANUTENCAO_TYPES.map(t => ({ value: t, label: `${MAINTENANCE_TYPE_ICONS[t]} ${MAINTENANCE_TYPE_LABELS[t]}` }))];

  return (
    <Card className="p-3 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
          <Wrench className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          Revisões e Manutenções
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setRulesModalOpen(true)}>
            <Settings className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">Regras</span>
          </Button>
          <Button size="sm" onClick={() => handleNew()}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Registro
          </Button>
        </div>
      </div>

      {/* Alert banner */}
      {(vencidos > 0 || atencao > 0 || pendentes > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {vencidos > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              {vencidos} vencido(s)
            </div>
          )}
          {atencao > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-medium">
              <Clock className="h-3.5 w-3.5" />
              {atencao} atenção
            </div>
          )}
          {pendentes > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-xs font-medium">
              <ClipboardCheck className="h-3.5 w-3.5" />
              {pendentes} não realizada(s)
            </div>
          )}
        </div>
      )}

      {/* Internal Tabs */}
      <Tabs value={internalTab} onValueChange={(v) => { setInternalTab(v); setFilterType('ALL'); }}>
        <TabsList className="w-full mb-4">
          <TabsTrigger value="revisoes" className="flex-1 gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Revisões
            {tabLogs.length > 0 && internalTab !== 'revisoes' && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{allLogs.filter(l => REVISAO_TYPES.includes(l.type)).length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="manutencoes" className="flex-1 gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            Manutenções
            {tabLogs.length > 0 && internalTab !== 'manutencoes' && (
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{allLogs.filter(l => MANUTENCAO_TYPES.includes(l.type)).length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revisoes" className="mt-0 space-y-4">
          <MaintenanceStatusCards getStatusInfo={getStatusInfo} types={REVISAO_TYPES.slice(0, 3)} />
          
          {/* Filter Chips */}
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filterType === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <Badge variant="secondary" className="ml-auto text-xs">
              {filteredLogs.length} registro(s)
            </Badge>
          </div>

          <MaintenanceLogList logs={filteredLogs} onEdit={handleEdit} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="manutencoes" className="mt-0 space-y-4">
          <MaintenanceStatusCards getStatusInfo={getStatusInfo} types={['TROCA_OLEO', 'TROCA_PNEUS', 'TROCA_FREIOS']} />

          {/* Filter Chips */}
          <div className="flex gap-2 flex-wrap">
            {filterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filterType === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <Badge variant="secondary" className="ml-auto text-xs">
              {filteredLogs.length} registro(s)
            </Badge>
          </div>

          <MaintenanceLogList logs={filteredLogs} onEdit={handleEdit} onDelete={handleDelete} />
        </TabsContent>
      </Tabs>

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
