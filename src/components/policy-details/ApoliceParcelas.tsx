import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/currencyFormatter';

interface Parcela {
  id: string;
  numero_parcela: number;
  vencimento: string;
  valor: number;
  status_pagamento: string;
}

interface ApoliceParcelasProps {
  policyId: string;
}

export function ApoliceParcelas({ policyId }: ApoliceParcelasProps) {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParcelas = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('apolice_parcelas')
        .select('*')
        .eq('apolice_id', policyId)
        .order('numero_parcela', { ascending: true });

      if (!error && data) {
        setParcelas(data as unknown as Parcela[]);
      }
      setLoading(false);
    };

    if (policyId) fetchParcelas();
  }, [policyId]);

  if (loading) return null;
  if (parcelas.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const proximoVencimento = parcelas.find(p => {
    const d = new Date(p.vencimento);
    d.setHours(0, 0, 0, 0);
    return d >= today && p.status_pagamento !== 'Pago';
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-base">
          <CalendarClock className="h-5 w-5 mr-2 text-primary" />
          Parcelas / Vencimentos
        </CardTitle>
        {proximoVencimento && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            Próximo vencimento: {new Date(proximoVencimento.vencimento).toLocaleDateString('pt-BR')} — {formatCurrency(proximoVencimento.valor)}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-4">Nº</th>
                <th className="py-2 pr-4">Vencimento</th>
                <th className="py-2 pr-4 text-right">Valor</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {parcelas.map((p) => {
                const vencDate = new Date(p.vencimento);
                vencDate.setHours(0, 0, 0, 0);
                const isOverdue = vencDate < today && p.status_pagamento !== 'Pago';
                
                return (
                  <tr key={p.id} className={`border-b last:border-0 ${isOverdue ? 'bg-red-50' : ''}`}>
                    <td className="py-2 pr-4 font-medium">{p.numero_parcela}</td>
                    <td className="py-2 pr-4">{vencDate.toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 pr-4 text-right font-semibold">{formatCurrency(p.valor)}</td>
                    <td className="py-2">
                      <Badge
                        variant={p.status_pagamento === 'Pago' ? 'default' : isOverdue ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {isOverdue ? 'Vencida' : p.status_pagamento}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
