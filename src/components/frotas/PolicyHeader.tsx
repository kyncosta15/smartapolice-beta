import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PolicyInfo {
  id: string;
  seguradora: string;
  numero_apolice: string;
  inicio_vigencia: string;
  fim_vigencia: string;
  status: 'ativa' | 'vencida' | 'cancelada';
  tipo_beneficio: string;
}

interface PolicyHeaderProps {
  policies: PolicyInfo[];
  selectedPolicyId?: string;
  onPolicyChange: (policyId: string) => void;
}

export function PolicyHeader({ policies, selectedPolicyId, onPolicyChange }: PolicyHeaderProps) {
  const selectedPolicy = policies.find(p => p.id === selectedPolicyId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Ativa</Badge>;
      case 'vencida':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Vencida</Badge>;
      case 'cancelada':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (policies.length === 0) {
    return (
      <Card className="border-0 shadow-sm rounded-xl mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Apólice não definida</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm rounded-xl mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Policy Selector */}
          {policies.length > 1 && (
            <div className="min-w-0 flex-1">
              <Select value={selectedPolicyId} onValueChange={onPolicyChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma apólice" />
                </SelectTrigger>
                <SelectContent>
                  {policies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>{policy.seguradora} - {policy.numero_apolice}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Policy Info */}
          {selectedPolicy && (
            <div className="flex flex-col sm:flex-row gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">{selectedPolicy.seguradora}</div>
                  <div className="text-muted-foreground">Nº {selectedPolicy.numero_apolice}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Vigência</div>
                  <div className="text-muted-foreground">
                    {format(new Date(selectedPolicy.inicio_vigencia), 'dd/MM/yyyy', { locale: ptBR })} até{' '}
                    {format(new Date(selectedPolicy.fim_vigencia), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-medium">Tipo</div>
                  <div className="text-muted-foreground">{selectedPolicy.tipo_beneficio}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getStatusBadge(selectedPolicy.status)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}