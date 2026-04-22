import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShieldCheck, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface VehicleTheftSectionProps {
  vehicleId: string;
  empresaId: string;
  isStolen: boolean;
  stolenDate: string | null;
  mode: 'view' | 'edit';
  onUpdate: () => void;
}

interface TheftEvent {
  id: string;
  event_date: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export function VehicleTheftSection({ vehicleId, empresaId, isStolen, stolenDate, mode, onUpdate }: VehicleTheftSectionProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<TheftEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadEvents();
  }, [vehicleId]);

  const loadEvents = async () => {
    const { data } = await supabase
      .from('vehicle_theft_events')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('event_date', { ascending: false });
    setEvents((data || []) as TheftEvent[]);
  };

  const handleMarkStolen = async () => {
    setLoading(true);
    try {
      const eventDate = format(new Date(), 'yyyy-MM-dd');

      await supabase.from('vehicle_theft_events').insert({
        vehicle_id: vehicleId,
        empresa_id: empresaId,
        event_date: eventDate,
        status: 'ROUBADO',
        notes: notes || null,
      } as any);

      await supabase.from('frota_veiculos').update({
        is_stolen_current: true,
        stolen_current_date: eventDate,
      } as any).eq('id', vehicleId);

      toast({ title: 'Veículo marcado como roubado' });
      setNotes('');
      loadEvents();
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRecovered = async () => {
    setLoading(true);
    try {
      const eventDate = format(new Date(), 'yyyy-MM-dd');

      await supabase.from('vehicle_theft_events').insert({
        vehicle_id: vehicleId,
        empresa_id: empresaId,
        event_date: eventDate,
        status: 'RECUPERADO',
        notes: notes || null,
      } as any);

      await supabase.from('frota_veiculos').update({
        is_stolen_current: false,
        stolen_current_date: null,
      } as any).eq('id', vehicleId);

      toast({ title: 'Veículo marcado como recuperado' });
      setNotes('');
      loadEvents();
      onUpdate();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <Card
        className={
          isStolen
            ? 'border-destructive/50 bg-destructive/5'
            : 'border-emerald-500/30 bg-emerald-500/10 dark:border-emerald-400/30 dark:bg-emerald-400/10'
        }
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isStolen ? (
                <AlertTriangle className="h-6 w-6 text-destructive" />
              ) : (
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {isStolen ? 'Veículo Roubado' : 'Veículo Regular'}
                </p>
                {isStolen && stolenDate && (
                  <p className="text-xs text-muted-foreground">
                    Data do roubo: {format(new Date(stolenDate), 'dd/MM/yyyy')}
                  </p>
                )}
              </div>
            </div>

            {mode === 'edit' && (
              <div>
                {isStolen ? (
                  <Button size="sm" variant="outline" onClick={handleMarkRecovered} disabled={loading}>
                    <ShieldCheck className="h-4 w-4 mr-1.5" />
                    Marcar Recuperado
                  </Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={handleMarkStolen} disabled={loading}>
                    <AlertTriangle className="h-4 w-4 mr-1.5" />
                    Registrar Roubo
                  </Button>
                )}
              </div>
            )}
          </div>

          {mode === 'edit' && (
            <div className="mt-3">
              <Label className="text-xs">Observações do evento</Label>
              <Textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Detalhes sobre o evento..."
                className="mt-1"
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event History */}
      {events.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-3">Histórico de Eventos</h4>
            <div className="space-y-2">
              {events.map(event => (
                <div key={event.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={event.status === 'ROUBADO' ? 'destructive' : 'default'} className="text-xs">
                      {event.status}
                    </Badge>
                    <span>{format(new Date(event.event_date), 'dd/MM/yyyy')}</span>
                  </div>
                  {event.notes && (
                    <span className="text-muted-foreground text-xs truncate max-w-[200px]">{event.notes}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
