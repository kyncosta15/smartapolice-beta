import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Users, UserPlus, X } from 'lucide-react';

interface CPFVinculo {
  id: string;
  cpf: string;
  nome?: string;
  tipo: 'dependente' | 'subestipulante';
  observacoes?: string;
  ativo: boolean;
  created_at: string;
}

interface ManageCPFVinculosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCPFsUpdated?: () => void;
}

export function ManageCPFVinculosModal({ open, onOpenChange, onCPFsUpdated }: ManageCPFVinculosModalProps) {
  const [vinculos, setVinculos] = useState<CPFVinculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    cpf: '',
    nome: '',
    tipo: 'dependente' as 'dependente' | 'subestipulante',
    observacoes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadVinculos();
    }
  }, [open]);

  const loadVinculos = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_cpf_vinculos')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVinculos((data || []) as CPFVinculo[]);
    } catch (error: any) {
      console.error('Erro ao carregar vínculos:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os CPFs vinculados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  };

  const handleAddVinculo = async () => {
    if (!formData.cpf || formData.cpf.replace(/\D/g, '').length !== 11) {
      toast({
        title: "CPF inválido",
        description: "Por favor, insira um CPF válido com 11 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_cpf_vinculos')
        .insert({
          user_id: user.id,
          cpf: formData.cpf.replace(/\D/g, ''),
          nome: formData.nome || null,
          tipo: formData.tipo,
          observacoes: formData.observacoes || null,
          ativo: true
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "CPF já vinculado",
            description: "Este CPF já está vinculado à sua conta.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "CPF vinculado",
        description: "O CPF foi vinculado com sucesso!",
      });

      setFormData({ cpf: '', nome: '', tipo: 'dependente', observacoes: '' });
      setShowAddForm(false);
      loadVinculos();
      onCPFsUpdated?.();
    } catch (error: any) {
      console.error('Erro ao adicionar vínculo:', error);
      toast({
        title: "Erro ao vincular",
        description: "Não foi possível vincular o CPF.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVinculo = async (id: string) => {
    if (!confirm('Deseja realmente remover este vínculo?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_cpf_vinculos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Vínculo removido",
        description: "O CPF foi desvinculado com sucesso!",
      });

      loadVinculos();
      onCPFsUpdated?.();
    } catch (error: any) {
      console.error('Erro ao remover vínculo:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o vínculo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gerenciar CPFs Vinculados
          </DialogTitle>
          <DialogDescription>
            Vincule CPFs de dependentes ou subestipulantes para buscar suas apólices automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de vínculos existentes */}
          <div className="space-y-3">
            {vinculos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum CPF vinculado ainda.</p>
                <p className="text-sm">Adicione CPFs para visualizar as apólices deles.</p>
              </div>
            ) : (
              vinculos.map((vinculo) => (
                <div key={vinculo.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{formatCPF(vinculo.cpf)}</span>
                      <Badge variant={vinculo.tipo === 'dependente' ? 'default' : 'secondary'} className="text-xs">
                        {vinculo.tipo === 'dependente' ? 'Dependente' : 'Subestipulante'}
                      </Badge>
                    </div>
                    {vinculo.nome && (
                      <p className="text-sm text-muted-foreground">{vinculo.nome}</p>
                    )}
                    {vinculo.observacoes && (
                      <p className="text-xs text-muted-foreground mt-1">{vinculo.observacoes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveVinculo(vinculo.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Formulário de adição */}
          {showAddForm ? (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Adicionar Novo CPF
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ cpf: '', nome: '', tipo: 'dependente', observacoes: '' });
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>

                <div>
                  <Label htmlFor="nome">Nome (opcional)</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do dependente/subestipulante"
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: 'dependente' | 'subestipulante') => 
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dependente">Dependente</SelectItem>
                      <SelectItem value="subestipulante">Subestipulante</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Adicione informações adicionais..."
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleAddVinculo}
                  disabled={loading || !formData.cpf}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {loading ? 'Adicionando...' : 'Adicionar CPF'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Novo CPF
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}