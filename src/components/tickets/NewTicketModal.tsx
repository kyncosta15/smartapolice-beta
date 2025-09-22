import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Car, Shield, ShieldCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTicketsData } from '@/hooks/useTicketsData';
import { TicketTipo, TicketSubtipo } from '@/types/tickets';
import { toast } from '@/hooks/use-toast';

interface NewTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialVehicleId?: string;
  initialTipo?: TicketTipo;
}

interface Vehicle {
  id: string;
  placa: string;
  marca?: string;
  modelo?: string;
  status_seguro?: string;
  categoria?: string;
}

const SINISTRO_SUBTIPOS: TicketSubtipo[] = [
  'colisao', 'roubo', 'furto', 'avaria', 'incendio', 'danos_terceiros'
];

const ASSISTENCIA_SUBTIPOS: TicketSubtipo[] = [
  'guincho', 'vidro', 'mecanica', 'chaveiro', 'pneu', 'combustivel', 'residencia'
];

export function NewTicketModal({ 
  open, 
  onOpenChange, 
  initialVehicleId, 
  initialTipo 
}: NewTicketModalProps) {
  const { user } = useAuth();
  const { createTicket } = useTicketsData();
  
  const [activeTab, setActiveTab] = useState<TicketTipo>(initialTipo || 'sinistro');
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    subtipo: '',
    data_evento: '',
    valor_estimado: '',
    descricao: '',
    localizacao: '',
  });

  // Buscar veículos
  const searchVehicles = async (term: string) => {
    if (!term || term.length < 2) {
      setVehicles([]);
      return;
    }

    setSearching(true);
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('company')
        .eq('id', user?.id)
        .single();

      if (!userData?.company) return;

      const { data: empresaData } = await supabase
        .from('empresas')
        .select('id')
        .eq('nome', userData.company)
        .single();

      if (!empresaData) return;

      const { data, error } = await supabase
        .from('frota_veiculos')
        .select('id, placa, marca, modelo, status_seguro, categoria')
        .eq('empresa_id', empresaData.id)
        .or(`placa.ilike.%${term}%,marca.ilike.%${term}%,modelo.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;

      setVehicles(data || []);
    } catch (error) {
      console.error('Erro ao buscar veículos:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchVehicles(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Se um veículo foi pré-selecionado
  useEffect(() => {
    if (initialVehicleId && open) {
      const loadInitialVehicle = async () => {
        const { data } = await supabase
          .from('frota_veiculos')
          .select('id, placa, marca, modelo, status_seguro, categoria')
          .eq('id', initialVehicleId)
          .single();

        if (data) {
          setSelectedVehicle(data);
          setSearchTerm(`${data.placa} - ${data.marca} ${data.modelo}`);
        }
      };

      loadInitialVehicle();
    }
  }, [initialVehicleId, open]);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSearchTerm(`${vehicle.placa} - ${vehicle.marca} ${vehicle.modelo}`);
    setVehicles([]);
  };

  const handleSubmit = async () => {
    if (!selectedVehicle) {
      toast({
        title: "Erro",
        description: "Selecione um veículo",
        variant: "destructive",
      });
      return;
    }

    if (!formData.subtipo) {
      toast({
        title: "Erro",
        description: "Selecione o tipo específico",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await createTicket({
        tipo: activeTab,
        subtipo: formData.subtipo as TicketSubtipo,
        vehicle_id: selectedVehicle.id,
        data_evento: formData.data_evento || undefined,
        valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : undefined,
        descricao: formData.descricao || undefined,
        localizacao: formData.localizacao || undefined,
        status: 'aberto',
        origem: 'portal',
      });

      // Reset form
      setFormData({
        subtipo: '',
        data_evento: '',
        valor_estimado: '',
        descricao: '',
        localizacao: '',
      });
      setSelectedVehicle(null);
      setSearchTerm('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'segurado':
      case 'com_seguro':
        return <ShieldCheck className="h-4 w-4 text-green-600" />;
      case 'sem_seguro':
        return <Shield className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'segurado':
      case 'com_seguro':
        return 'Segurado';
      case 'sem_seguro':
        return 'Sem Seguro';
      default:
        return 'Status não definido';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'segurado':
      case 'com_seguro':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'sem_seguro':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Ticket</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TicketTipo)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sinistro">Sinistro</TabsTrigger>
            <TabsTrigger value="assistencia">Assistência</TabsTrigger>
          </TabsList>

          <div className="space-y-6 mt-6">
            {/* Busca de Veículo */}
            <div className="space-y-2">
              <Label>Localizar Veículo</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Digite a placa, marca ou modelo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Resultados da busca */}
              {vehicles.length > 0 && (
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleVehicleSelect(vehicle)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Car className="h-4 w-4 text-slate-400" />
                          <div>
                            <div className="font-medium">
                              {vehicle.placa} - {vehicle.marca} {vehicle.modelo}
                            </div>
                            <div className="text-sm text-slate-500">
                              Categoria: {vehicle.categoria || 'Não definida'}
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(vehicle.status_seguro)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(vehicle.status_seguro)}
                            {getStatusText(vehicle.status_seguro)}
                          </div>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searching && (
                <div className="text-center py-4 text-slate-500">
                  Buscando veículos...
                </div>
              )}
            </div>

            {/* Veículo Selecionado */}
            {selectedVehicle && (
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-slate-400" />
                    <div>
                      <div className="font-medium">
                        {selectedVehicle.placa} - {selectedVehicle.marca} {selectedVehicle.modelo}
                      </div>
                      <div className="text-sm text-slate-500">
                        Categoria: {selectedVehicle.categoria || 'Não definida'}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(selectedVehicle.status_seguro)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(selectedVehicle.status_seguro)}
                      {getStatusText(selectedVehicle.status_seguro)}
                    </div>
                  </Badge>
                </div>
              </Card>
            )}

            {/* Formulário específico por tipo */}
            <TabsContent value="sinistro" className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Sinistro</Label>
                <Select 
                  value={formData.subtipo} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subtipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de sinistro" />
                  </SelectTrigger>
                  <SelectContent>
                    {SINISTRO_SUBTIPOS.map((subtipo) => (
                      <SelectItem key={subtipo} value={subtipo}>
                        {subtipo.charAt(0).toUpperCase() + subtipo.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data do Evento</Label>
                  <Input
                    type="date"
                    value={formData.data_evento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_evento: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Estimado (R$)</Label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={formData.valor_estimado}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_estimado: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição do Sinistro</Label>
                <Textarea
                  placeholder="Descreva o que aconteceu..."
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="assistencia" className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Assistência</Label>
                <Select 
                  value={formData.subtipo} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subtipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de assistência" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSISTENCIA_SUBTIPOS.map((subtipo) => (
                      <SelectItem key={subtipo} value={subtipo}>
                        {subtipo.charAt(0).toUpperCase() + subtipo.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data da Solicitação</Label>
                  <Input
                    type="date"
                    value={formData.data_evento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_evento: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Localização</Label>
                  <Input
                    placeholder="Endereço ou referência"
                    value={formData.localizacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, localizacao: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição da Solicitação</Label>
                <Textarea
                  placeholder="Descreva o problema ou necessidade..."
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Criando...' : 'Criar Ticket'}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}