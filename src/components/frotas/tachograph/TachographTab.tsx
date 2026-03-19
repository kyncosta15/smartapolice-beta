import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, CheckCircle2, AlertTriangle, Clock, Trash2, Edit, FileText,
  Calendar, Wrench, Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTachographData, TachographInspection, TachographYearlyRecord } from './useTachographData';
import TachographInspectionModal from './TachographInspectionModal';
import TachographYearlyModal from './TachographYearlyModal';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMaintenanceData } from '../maintenance/useMaintenanceData';

interface Props {
  vehicleId: string;
}

export default function TachographTab({ vehicleId }: Props) {
  const { toast } = useToast();
  const { inspections, yearlyRecords, loading, fetchData, getStatusInfo } = useTachographData(vehicleId);
  const { allLogs, rules, fetchData: fetchMaintenance, getStatusInfo: getMaintenanceStatus } = useMaintenanceData(vehicleId);

  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [yearlyModalOpen, setYearlyModalOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<TachographInspection | null>(null);
  const [editingYearly, setEditingYearly] = useState<TachographYearlyRecord | null>(null);

  const statusInfo = getStatusInfo();
  const revisionStatus = getMaintenanceStatus('REVISAO');

  const statusConfig = {
    OK: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2, label: 'Em dia' },
    ATENCAO: { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: Clock, label: 'Atenção' },
    VENCIDO: { color: 'bg-destructive/10 text-destructive border-destructive/30', icon: AlertTriangle, label: 'Vencido' },
  };

  const currentStatus = statusConfig[statusInfo.status];

  const handleDeleteInspection = async (id: string) => {
    const { error } = await supabase.from('truck_tachograph_inspections').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Vistoria excluída' });
      fetchData();
    }
  };

  const handleDeleteYearly = async (id: string) => {
    const { error } = await supabase.from('truck_tachograph_yearly_records').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Registro anual excluído' });
      fetchData();
    }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Status da Vistoria do Tacógrafo */}
      <Card className="p-3 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Status da Vistoria do Tacógrafo
          </h3>
          <Button size="sm" onClick={() => { setEditingInspection(null); setInspectionModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Vistoria
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Status Badge */}
          <Card className={`p-4 border ${currentStatus.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <currentStatus.icon className="h-5 w-5" />
              <span className="font-semibold text-sm">{currentStatus.label}</span>
            </div>
            {statusInfo.remainingDays !== null ? (
              <p className="text-xs mt-1">
                {statusInfo.remainingDays > 0
                  ? `Vence em ${statusInfo.remainingDays} dias`
                  : `Vencido há ${Math.abs(statusInfo.remainingDays)} dias`}
              </p>
            ) : (
              <p className="text-xs mt-1 text-muted-foreground">Nenhuma vistoria registrada</p>
            )}
          </Card>

          {/* Última Vistoria */}
          <Card className="p-4 border">
            <p className="text-xs text-muted-foreground mb-1">Última Vistoria</p>
            <p className="font-semibold text-sm">
              {statusInfo.lastInspection
                ? format(parseISO(statusInfo.lastInspection.inspection_date), 'dd/MM/yyyy')
                : '—'}
            </p>
            {statusInfo.lastInspection?.provider_name && (
              <p className="text-xs text-muted-foreground mt-0.5">{statusInfo.lastInspection.provider_name}</p>
            )}
          </Card>

          {/* Validade */}
          <Card className="p-4 border">
            <p className="text-xs text-muted-foreground mb-1">Validade</p>
            <p className="font-semibold text-sm">
              {statusInfo.validUntil
                ? format(parseISO(statusInfo.validUntil), 'dd/MM/yyyy')
                : '—'}
            </p>
            {statusInfo.lastInspection?.certificate_number && (
              <p className="text-xs text-muted-foreground mt-0.5">Cert: {statusInfo.lastInspection.certificate_number}</p>
            )}
          </Card>
        </div>
      </Card>

      {/* Histórico de Vistorias */}
      <Card className="p-3 md:p-6">
        <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-primary" />
          Histórico de Vistorias
        </h3>

        {inspections.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Nenhuma vistoria registrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3">Data</th>
                  <th className="py-2 pr-3">Validade</th>
                  <th className="py-2 pr-3 hidden md:table-cell">Fornecedor</th>
                  <th className="py-2 pr-3 hidden md:table-cell">Certificado</th>
                  <th className="py-2 pr-3">Custo</th>
                  <th className="py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((insp) => {
                  const isExpired = new Date(insp.valid_until) < new Date();
                  return (
                    <tr key={insp.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2.5 pr-3">{format(parseISO(insp.inspection_date), 'dd/MM/yyyy')}</td>
                      <td className="py-2.5 pr-3">
                        <span className={isExpired ? 'text-destructive font-medium' : ''}>
                          {format(parseISO(insp.valid_until), 'dd/MM/yyyy')}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 hidden md:table-cell">{insp.provider_name || '—'}</td>
                      <td className="py-2.5 pr-3 hidden md:table-cell font-mono text-xs">{insp.certificate_number || '—'}</td>
                      <td className="py-2.5 pr-3">{formatCurrency(insp.cost)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingInspection(insp); setInspectionModalOpen(true); }}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteInspection(insp.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Registros Anuais */}
      <Card className="p-3 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Registro Anual (Mapeamento)
          </h3>
          <Button size="sm" variant="outline" onClick={() => { setEditingYearly(null); setYearlyModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Registro
          </Button>
        </div>

        {yearlyRecords.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Nenhum registro anual cadastrado.
          </div>
        ) : (
          <div className="space-y-3">
            {yearlyRecords.map((rec) => (
              <Card key={rec.id} className="p-3 border">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{rec.year}</Badge>
                      {rec.km_start != null && rec.km_end != null && (
                        <span className="text-xs text-muted-foreground">
                          {rec.km_start.toLocaleString('pt-BR')} → {rec.km_end.toLocaleString('pt-BR')} km
                          ({(rec.km_end - rec.km_start).toLocaleString('pt-BR')} km percorridos)
                        </span>
                      )}
                    </div>
                    {rec.summary && <p className="text-sm text-foreground">{rec.summary}</p>}
                    {rec.incidents && <p className="text-xs text-amber-600 mt-1">⚠ {rec.incidents}</p>}
                    {rec.notes && <p className="text-xs text-muted-foreground mt-1">{rec.notes}</p>}
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingYearly(rec); setYearlyModalOpen(true); }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteYearly(rec.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Revisão por KM (integração com manutenção existente) */}
      <Card className="p-3 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            Revisão do Caminhão por KM
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Regra atual */}
          <Card className="p-4 border">
            <p className="text-xs text-muted-foreground mb-1">Regra de Revisão</p>
            {revisionStatus.hasRule ? (
              <>
                <p className="font-semibold text-sm">
                  A cada {revisionStatus.nextDueKm && revisionStatus.lastKm
                    ? ((revisionStatus.nextDueKm - revisionStatus.lastKm)).toLocaleString('pt-BR')
                    : '—'} km
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma regra configurada</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Configure em Operação → Regras
            </p>
          </Card>

          {/* Última revisão */}
          <Card className="p-4 border">
            <p className="text-xs text-muted-foreground mb-1">Última Revisão</p>
            <p className="font-semibold text-sm">
              {revisionStatus.lastDate
                ? format(parseISO(revisionStatus.lastDate), 'dd/MM/yyyy')
                : '—'}
            </p>
            {revisionStatus.lastKm != null && (
              <p className="text-xs text-muted-foreground mt-0.5">{revisionStatus.lastKm.toLocaleString('pt-BR')} km</p>
            )}
          </Card>

          {/* Status da revisão */}
          <Card className={`p-4 border ${
            revisionStatus.status === 'OK' ? 'bg-green-50 border-green-200' :
            revisionStatus.status === 'ATENCAO' ? 'bg-amber-50 border-amber-200' :
            revisionStatus.status === 'VENCIDO' ? 'bg-red-50 border-red-200' : ''
          }`}>
            <p className="text-xs text-muted-foreground mb-1">Próxima Revisão</p>
            {revisionStatus.nextDueKm ? (
              <>
                <p className="font-semibold text-sm">{revisionStatus.nextDueKm.toLocaleString('pt-BR')} km</p>
                {revisionStatus.remainingKm != null && (
                  <p className={`text-xs mt-0.5 font-medium ${
                    revisionStatus.remainingKm <= 0 ? 'text-destructive' :
                    revisionStatus.status === 'ATENCAO' ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {revisionStatus.remainingKm > 0
                      ? `Faltam ${revisionStatus.remainingKm.toLocaleString('pt-BR')} km`
                      : `Excedido em ${Math.abs(revisionStatus.remainingKm).toLocaleString('pt-BR')} km`}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sem regra definida</p>
            )}
          </Card>
        </div>
      </Card>

      {/* Modals */}
      <TachographInspectionModal
        open={inspectionModalOpen}
        onOpenChange={setInspectionModalOpen}
        vehicleId={vehicleId}
        editingInspection={editingInspection}
        onSaved={fetchData}
      />
      <TachographYearlyModal
        open={yearlyModalOpen}
        onOpenChange={setYearlyModalOpen}
        vehicleId={vehicleId}
        editingRecord={editingYearly}
        onSaved={fetchData}
      />
    </div>
  );
}
