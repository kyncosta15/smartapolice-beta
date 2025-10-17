import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const PLACAS = [
  'GSO7B86',
  'HZP4I77',
  'OUT6987',
  'PRD4C17',
  'RCD3E21',
  'RCD5J51',
  'RCL8J73',
  'RPC5G27',
  'TGY9J40',
  'TGZ0J76',
  'TGZ8C99',
  'THC0C41',
  'THC0D35',
  'THC1B48'
];

export default function InserirVeiculosLote() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<Array<{ placa: string; status: string; mensagem: string }>>([]);

  const inserirVeiculos = async () => {
    setLoading(true);
    setResultado([]);
    
    try {
      // Buscar empresa_id do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Buscar empresa do usuário via membership
      const { data: membership, error: membershipError } = await supabase
        .from('user_memberships')
        .select('empresa_id')
        .eq('user_id', user.id)
        .single();

      if (membershipError || !membership) {
        toast.error('Empresa não encontrada para o usuário');
        return;
      }

      const empresaId = membership.empresa_id;
      const resultados: Array<{ placa: string; status: string; mensagem: string }> = [];

      // Inserir cada veículo
      for (const placa of PLACAS) {
        try {
          // Verificar se já existe
          const { data: existente } = await supabase
            .from('frota_veiculos')
            .select('id')
            .eq('placa', placa)
            .eq('empresa_id', empresaId)
            .maybeSingle();

          if (existente) {
            resultados.push({
              placa,
              status: 'pulado',
              mensagem: 'Veículo já existe'
            });
            continue;
          }

          // Inserir novo veículo
          const { error: insertError } = await supabase
            .from('frota_veiculos')
            .insert({
              placa,
              empresa_id: empresaId,
              status_seguro: 'sem_seguro',
              categoria: 'outros',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (insertError) {
            resultados.push({
              placa,
              status: 'erro',
              mensagem: insertError.message
            });
          } else {
            resultados.push({
              placa,
              status: 'inserido',
              mensagem: 'Veículo inserido com sucesso'
            });
          }
        } catch (error: any) {
          resultados.push({
            placa,
            status: 'erro',
            mensagem: error.message || 'Erro desconhecido'
          });
        }
      }

      setResultado(resultados);
      
      const inseridos = resultados.filter(r => r.status === 'inserido').length;
      const pulados = resultados.filter(r => r.status === 'pulado').length;
      const erros = resultados.filter(r => r.status === 'erro').length;

      toast.success(`✅ ${inseridos} veículos inseridos, ${pulados} já existiam, ${erros} erros`);
      
    } catch (error: any) {
      console.error('Erro ao inserir veículos:', error);
      toast.error('Erro ao inserir veículos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Inserir Veículos em Lote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Serão inseridos {PLACAS.length} veículos:</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PLACAS.map(placa => (
              <div key={placa} className="font-mono text-xs bg-muted p-2 rounded">
                {placa}
              </div>
            ))}
          </div>
        </div>

        <Button 
          onClick={inserirVeiculos} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Inserindo...
            </>
          ) : (
            'Inserir Veículos'
          )}
        </Button>

        {resultado.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-sm">Resultado:</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {resultado.map((r, idx) => (
                <div 
                  key={idx} 
                  className={`text-xs p-2 rounded flex justify-between ${
                    r.status === 'inserido' ? 'bg-green-100 dark:bg-green-900/20' :
                    r.status === 'pulado' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                    'bg-red-100 dark:bg-red-900/20'
                  }`}
                >
                  <span className="font-mono">{r.placa}</span>
                  <span>{r.mensagem}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
