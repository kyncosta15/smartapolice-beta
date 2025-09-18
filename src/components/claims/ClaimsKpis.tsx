import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Wrench, Clock, CheckCircle } from 'lucide-react';
import { Claim, Assistance } from '@/types/claims';

interface ClaimsKpisProps {
  claims: Claim[];
  assistances: Assistance[];
  loading?: boolean;
}

export function ClaimsKpis({ claims, assistances, loading = false }: ClaimsKpisProps) {
  const sinistrosAbertos = claims.filter(c => c.status === 'aberto').length;
  const sinistrosFinalizados = claims.filter(c => c.status === 'finalizado').length;
  const assistenciasAbertas = assistances.filter(a => a.status === 'aberto').length;
  const assistenciasFinalizadas = assistances.filter(a => a.status === 'finalizado').length;

  const kpis = [
    {
      title: 'Total de Sinistros',
      value: claims.length,
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'Sinistros Abertos',
      value: sinistrosAbertos,
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Total de Assistências',
      value: assistances.length,
      icon: Wrench,
      color: 'text-purple-600'
    },
    {
      title: 'Finalizados',
      value: sinistrosFinalizados + assistenciasFinalizadas,
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Gestão de Sinistros e Assistências</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${kpi.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {kpi.title}
                    </p>
                    <p className="text-2xl font-bold">
                      {kpi.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}