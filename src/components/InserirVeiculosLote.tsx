import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Building, ArrowLeft, Edit2 } from 'lucide-react';

interface Empresa {
  id: string;
  nome: string;
  email?: string;
}

export default function InserirVeiculosLote() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(5);
  const [placas, setPlacas] = useState<string[]>([]);
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [resultado, setResultado] = useState<Array<{ placa: string; status: string; mensagem: string }>>([]);

  // Inicializar placas quando quantidade mudar
  useEffect(() => {
    const novasPlacas = Array(quantidade).fill('').map((_, i) => 
      placas[i] || ''
    );
    setPlacas(novasPlacas);
  }, [quantidade]);

  // Carregar lista de empresas ao montar o componente
  useEffect(() => {
    const carregarEmpresas = async () => {
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('id, nome')
          .order('nome');

        if (error) throw error;

        // Buscar emails dos usuários de cada empresa
        const empresasComEmail: Empresa[] = [];
        for (const empresa of data || []) {
          const { data: users } = await supabase
            .from('users')
            .select('email')
            .eq('company', empresa.nome)
            .limit(1)
            .single();
          
          empresasComEmail.push({
            id: empresa.id,
            nome: empresa.nome,
            email: users?.email
          });
        }

        setEmpresas(empresasComEmail);
      } catch (error: any) {
        console.error('Erro ao carregar empresas:', error);
        toast.error('Erro ao carregar lista de empresas');
      } finally {
        setLoadingEmpresas(false);
      }
    };

    carregarEmpresas();
  }, []);

  const handlePlacaChange = (index: number, valor: string) => {
    const novasPlacas = [...placas];
    novasPlacas[index] = valor.toUpperCase();
    setPlacas(novasPlacas);
  };

  const handlePlacaClick = (index: number) => {
    setEditandoIndex(index);
  };

  const handlePlacaBlur = () => {
    setEditandoIndex(null);
  };

  const inserirVeiculos = async () => {
    if (!empresaSelecionada) {
      toast.error('Selecione uma conta primeiro');
      return;
    }

    // Validar placas
    const placasValidas = placas.filter(p => p.trim().length > 0);
    if (placasValidas.length === 0) {
      toast.error('Preencha pelo menos uma placa');
      return;
    }

    setLoading(true);
    setResultado([]);
    
    try {
      const empresaId = empresaSelecionada;
      const resultados: Array<{ placa: string; status: string; mensagem: string }> = [];

      // Inserir cada veículo
      for (const placa of placasValidas) {
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
              categoria: 'Carros',
              proprietario_tipo: 'pj',
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

  const empresaSelecionadaInfo = empresas.find(e => e.id === empresaSelecionada);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate('/admin')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Painel
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Inserir Veículos em Lote</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seletor de Empresa/Conta */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione a Conta</label>
              <Select value={empresaSelecionada} onValueChange={setEmpresaSelecionada} disabled={loadingEmpresas}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={loadingEmpresas ? "Carregando contas..." : "Selecione uma conta"}>
                    {empresaSelecionadaInfo && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span className="truncate">{empresaSelecionadaInfo.nome}</span>
                        {empresaSelecionadaInfo.email && (
                          <span className="text-xs text-muted-foreground">
                            ({empresaSelecionadaInfo.email})
                          </span>
                        )}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{empresa.nome}</span>
                        {empresa.email && (
                          <span className="text-xs text-muted-foreground">{empresa.email}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Quantidade */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade de Veículos</label>
              <Select 
                value={quantidade.toString()} 
                onValueChange={(v) => setQuantidade(parseInt(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {[1, 2, 3, 4, 5, 10, 15, 20, 30, 50].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'veículo' : 'veículos'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Placas Editáveis */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Placas dos Veículos</label>
                <span className="text-xs text-muted-foreground">
                  Clique para editar
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {placas.map((placa, index) => (
                  <div key={index} className="relative">
                    {editandoIndex === index ? (
                      <Input
                        type="text"
                        value={placa}
                        onChange={(e) => handlePlacaChange(index, e.target.value)}
                        onBlur={handlePlacaBlur}
                        autoFocus
                        placeholder="ABC1D23"
                        maxLength={7}
                        className="font-mono uppercase"
                      />
                    ) : (
                      <button
                        onClick={() => handlePlacaClick(index)}
                        className="w-full font-mono text-sm bg-muted hover:bg-muted/70 p-3 rounded-md transition-colors text-left flex items-center justify-between group"
                      >
                        <span className={placa ? 'text-foreground' : 'text-muted-foreground'}>
                          {placa || 'Clique para editar'}
                        </span>
                        <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Botão Inserir */}
            <Button 
              onClick={inserirVeiculos} 
              disabled={loading || !empresaSelecionada || loadingEmpresas}
              className="w-full"
              size="lg"
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

            {/* Resultado */}
            {resultado.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Resultado:</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {resultado.map((r, idx) => (
                    <div 
                      key={idx} 
                      className={`text-xs p-3 rounded-md flex justify-between items-center ${
                        r.status === 'inserido' ? 'bg-green-100 dark:bg-green-900/20 text-green-900 dark:text-green-100' :
                        r.status === 'pulado' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100' :
                        'bg-red-100 dark:bg-red-900/20 text-red-900 dark:text-red-100'
                      }`}
                    >
                      <span className="font-mono font-semibold">{r.placa}</span>
                      <span>{r.mensagem}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
