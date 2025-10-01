import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, X } from 'lucide-react';

interface NewPolicyManualModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Coverage {
  descricao: string;
  lmi: string;
}

export function NewPolicyManualModal({ open, onOpenChange, onSuccess }: NewPolicyManualModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nome_apolice: '',
    nome_segurado: '',
    tipo_beneficio: '',
    documento: '',
    documento_tipo: 'CPF' as 'CPF' | 'CNPJ',
    numero_apolice: '',
    premio_total: '',
    valor_mensal: '',
    quantidade_parcelas: '',
    data_inicio: '',
    data_fim: '',
    seguradora: '',
    responsavel: '',
  });

  const [coberturas, setCoberturas] = useState<Coverage[]>([{ descricao: '', lmi: '' }]);

  const handleAddCobertura = () => {
    setCoberturas([...coberturas, { descricao: '', lmi: '' }]);
  };

  const handleRemoveCobertura = (index: number) => {
    setCoberturas(coberturas.filter((_, i) => i !== index));
  };

  const handleCoberturaChange = (index: number, field: keyof Coverage, value: string) => {
    const newCoberturas = [...coberturas];
    newCoberturas[index][field] = value;
    setCoberturas(newCoberturas);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar coberturas formatadas
      const coberturasFormatadas = coberturas
        .filter(c => c.descricao.trim())
        .map(c => ({
          descricao: c.descricao,
          lmi: c.lmi ? parseFloat(c.lmi.replace(/[^\d,]/g, '').replace(',', '.')) : undefined,
        }));

      // Inserir apólice no banco
      const { data: policy, error } = await supabase
        .from('policies')
        .insert({
          user_id: user.id,
          segurado: formData.nome_segurado,
          tipo_seguro: formData.tipo_beneficio,
          documento: formData.documento,
          documento_tipo: formData.documento_tipo,
          numero_apolice: formData.numero_apolice,
          valor_premio: parseFloat(formData.premio_total.replace(/[^\d,]/g, '').replace(',', '.')),
          custo_mensal: parseFloat(formData.valor_mensal.replace(/[^\d,]/g, '').replace(',', '.')),
          valor_parcela: parseFloat(formData.valor_mensal.replace(/[^\d,]/g, '').replace(',', '.')),
          quantidade_parcelas: parseInt(formData.quantidade_parcelas),
          inicio_vigencia: formData.data_inicio,
          fim_vigencia: formData.data_fim,
          expiration_date: formData.data_fim,
          seguradora: formData.seguradora,
          responsavel_nome: formData.responsavel,
          status: 'vigente',
          created_by_extraction: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Inserir coberturas
      if (coberturasFormatadas.length > 0) {
        await supabase.from('coberturas').insert(
          coberturasFormatadas.map(cob => ({
            policy_id: policy.id,
            descricao: cob.descricao,
            lmi: cob.lmi,
          }))
        );
      }

      toast({
        title: "✅ Apólice Criada",
        description: "A apólice foi adicionada com sucesso",
      });

      onSuccess();
      onOpenChange(false);

      // Reset form
      setFormData({
        nome_apolice: '',
        nome_segurado: '',
        tipo_beneficio: '',
        documento: '',
        documento_tipo: 'CPF',
        numero_apolice: '',
        premio_total: '',
        valor_mensal: '',
        quantidade_parcelas: '',
        data_inicio: '',
        data_fim: '',
        seguradora: '',
        responsavel: '',
      });
      setCoberturas([{ descricao: '', lmi: '' }]);

    } catch (error) {
      console.error('Erro ao criar apólice:', error);
      toast({
        title: "❌ Erro",
        description: "Não foi possível criar a apólice",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Adicionar Apólice Individual</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <ScrollArea className="h-[calc(90vh-180px)] px-6 py-2">
            <div className="space-y-6 pb-6 pr-4">
              {/* Informações Gerais */}
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">Informações Gerais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="nome_apolice">Nome da Apólice *</Label>
                    <Input
                      id="nome_apolice"
                      value={formData.nome_apolice}
                      onChange={(e) => setFormData({ ...formData, nome_apolice: e.target.value })}
                      className="w-full focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="nome_segurado">Nome do Segurado *</Label>
                    <Input
                      id="nome_segurado"
                      value={formData.nome_segurado}
                      onChange={(e) => setFormData({ ...formData, nome_segurado: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="tipo_beneficio">Tipo de Benefício *</Label>
                    <Input
                      id="tipo_beneficio"
                      value={formData.tipo_beneficio}
                      onChange={(e) => setFormData({ ...formData, tipo_beneficio: e.target.value })}
                      placeholder="Ex: Saúde, Dental, Vida"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="documento_tipo">Tipo de Documento *</Label>
                    <Select
                      value={formData.documento_tipo}
                      onValueChange={(value: 'CPF' | 'CNPJ') => setFormData({ ...formData, documento_tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CPF">CPF</SelectItem>
                        <SelectItem value="CNPJ">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="documento">{formData.documento_tipo} *</Label>
                    <Input
                      id="documento"
                      value={formData.documento}
                      onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                      placeholder={formData.documento_tipo === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Informações Financeiras */}
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">Informações Financeiras</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="numero_apolice">Número da Apólice *</Label>
                    <Input
                      id="numero_apolice"
                      value={formData.numero_apolice}
                      onChange={(e) => setFormData({ ...formData, numero_apolice: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="seguradora">Seguradora *</Label>
                    <Input
                      id="seguradora"
                      value={formData.seguradora}
                      onChange={(e) => setFormData({ ...formData, seguradora: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="premio_total">Prêmio Total *</Label>
                    <Input
                      id="premio_total"
                      value={formData.premio_total}
                      onChange={(e) => setFormData({ ...formData, premio_total: e.target.value })}
                      placeholder="R$ 0,00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="valor_mensal">Valor Mensal *</Label>
                    <Input
                      id="valor_mensal"
                      value={formData.valor_mensal}
                      onChange={(e) => setFormData({ ...formData, valor_mensal: e.target.value })}
                      placeholder="R$ 0,00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantidade_parcelas">Número de Parcelas *</Label>
                    <Input
                      id="quantidade_parcelas"
                      type="number"
                      value={formData.quantidade_parcelas}
                      onChange={(e) => setFormData({ ...formData, quantidade_parcelas: e.target.value })}
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="responsavel">Responsável</Label>
                    <Input
                      id="responsavel"
                      value={formData.responsavel}
                      onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Validade e Histórico */}
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">Validade e Histórico</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="data_inicio">Data de Início *</Label>
                    <Input
                      id="data_inicio"
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="data_fim">Data de Fim *</Label>
                    <Input
                      id="data_fim"
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Coberturas */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-primary">Coberturas</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCobertura}
                    className="h-8"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                <div className="space-y-3">
                  {coberturas.map((cobertura, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          placeholder="Descrição da cobertura"
                          value={cobertura.descricao}
                          onChange={(e) => handleCoberturaChange(index, 'descricao', e.target.value)}
                        />
                      </div>
                      <div className="w-32">
                        <Input
                          placeholder="LMI"
                          value={cobertura.lmi}
                          onChange={(e) => handleCoberturaChange(index, 'lmi', e.target.value)}
                        />
                      </div>
                      {coberturas.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCobertura(index)}
                          className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Apólice'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
