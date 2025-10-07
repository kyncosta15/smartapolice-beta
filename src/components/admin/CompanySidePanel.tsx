import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, Car, FileText, AlertCircle, Clock } from 'lucide-react';
import type { CompanySummary } from '@/types/admin';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CompanySidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanySummary | null;
}

export function CompanySidePanel({ open, onOpenChange, company }: CompanySidePanelProps) {
  if (!company) return null;

  const stats = [
    {
      label: 'Usuários',
      value: company.usuarios,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      label: 'Veículos',
      value: company.veiculos,
      icon: Car,
      color: 'text-green-600',
    },
    {
      label: 'Apólices',
      value: company.apolices,
      icon: FileText,
      color: 'text-purple-600',
    },
    {
      label: 'Sinistros Abertos',
      value: company.sinistros_abertos,
      icon: AlertCircle,
      color: 'text-red-600',
    },
    {
      label: 'Assistências Abertas',
      value: company.assistencias_abertas,
      icon: AlertCircle,
      color: 'text-orange-600',
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {company.empresa_nome}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Última Atividade */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Última atividade:{' '}
                  {formatDistanceToNow(new Date(company.ultima_atividade), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      <span className="text-xs text-muted-foreground">
                        {stat.label}
                      </span>
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="pt-4">
            <Button 
              className="w-full" 
              onClick={() => {
                // TODO: Implementar navegação para dashboard filtrado por empresa
                console.log('Ver dados da empresa:', company.empresa_id);
              }}
            >
              Ver Dados Completos
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
