import React, { useState } from 'react';
import { StatusStepper, MiniStepper } from './';
import { SINISTRO_STEPS, ASSISTENCIA_STEPS, TicketType, StatusEvent } from '@/types/status-stepper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const StatusStepperExample: React.FC = () => {
  const [sinistroStatus, setSinistroStatus] = useState('aberto');
  const [assistenciaStatus, setAssistenciaStatus] = useState('aberto');

  // Dados de exemplo
  const mockHistory: StatusEvent[] = [
    {
      id: '1',
      ticket_id: '1',
      to_status: 'aberto',
      note: 'Sinistro reportado pelo segurado',
      changed_by: 'user1',
      created_at: new Date().toISOString(),
      user_name: 'João Silva'
    }
  ];

  const handleSinistroStatusChange = async (newStatus: string, note?: string) => {
    console.log('Mudando status do sinistro para:', newStatus, note);
    setSinistroStatus(newStatus);
  };

  const handleAssistenciaStatusChange = async (newStatus: string, note?: string) => {
    console.log('Mudando status da assistência para:', newStatus, note);
    setAssistenciaStatus(newStatus);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Demonstração da Esteira de Status</h1>
        <p className="text-muted-foreground">
          Componente reutilizável para Sinistros e Assistências
        </p>
      </div>

      <Tabs defaultValue="sinistro" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sinistro">Sinistro</TabsTrigger>
          <TabsTrigger value="assistencia">Assistência</TabsTrigger>
        </TabsList>

        <TabsContent value="sinistro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Esteira de Sinistro - Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusStepper
                type="sinistro"
                currentStatus={sinistroStatus}
                steps={SINISTRO_STEPS}
                history={mockHistory}
                onChangeStatus={handleSinistroStatusChange}
                slaInfo={{ 
                  due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                  isOverdue: false 
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mini Stepper - Para Listas</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniStepper
                type="sinistro"
                currentStatus={sinistroStatus}
                steps={SINISTRO_STEPS}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assistencia" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Esteira de Assistência - Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusStepper
                type="assistencia"
                currentStatus={assistenciaStatus}
                steps={ASSISTENCIA_STEPS}
                history={mockHistory}
                onChangeStatus={handleAssistenciaStatusChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mini Stepper - Para Listas</CardTitle>
            </CardHeader>
            <CardContent>
              <MiniStepper
                type="assistencia"
                currentStatus={assistenciaStatus}
                steps={ASSISTENCIA_STEPS}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Controles de Teste</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => setSinistroStatus('analise_seguradora')}>
              Sinistro → Análise
            </Button>
            <Button size="sm" onClick={() => setSinistroStatus('na_oficina')}>
              Sinistro → Oficina
            </Button>
            <Button size="sm" onClick={() => setSinistroStatus('finalizado_reparado')}>
              Sinistro → Finalizado
            </Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => setAssistenciaStatus('atendimento_andamento')}>
              Assistência → Andamento
            </Button>
            <Button size="sm" onClick={() => setAssistenciaStatus('reembolso')}>
              Assistência → Reembolso
            </Button>
            <Button size="sm" onClick={() => setAssistenciaStatus('finalizado')}>
              Assistência → Finalizado
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};