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
import { Plus, Trash2, Users, UserPlus, X, Search, CheckCircle2, XCircle } from 'lucide-react';
import { DocumentValidator } from '@/utils/documentValidator';
import { useClienteLookup } from '@/hooks/useClienteLookup';

interface CPFVinculo {
  id: string;
  cpf: string;
  nome?: string;
  tipo: 'dependente' | 'subestipulante' | 'empresa';
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
    tipo: 'dependente' as 'dependente' | 'subestipulante' | 'empresa',
    observacoes: ''
  });
  const [selectedDocType, setSelectedDocType] = useState<'CPF' | 'CNPJ'>('CPF');
  const [documentInfo, setDocumentInfo] = useState<{ type: string; personType: string; isValid: boolean } | null>(null);
  const { toast } = useToast();
  const { result: lookupResult, searchByDocument } = useClienteLookup();

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

  const formatDocumentByType = (value: string, type: 'CPF' | 'CNPJ'): string => {
    const numbers = value.replace(/\D/g, '');
    
    if (type === 'CPF') {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
        .slice(0, 18);
    }
  };

  const validateDocumentByType = (value: string, type: 'CPF' | 'CNPJ'): boolean => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (type === 'CPF') {
      return cleanValue.length === 11;
    } else {
      return cleanValue.length === 14;
    }
  };

  const handleDocumentChange = (value: string) => {
    const formatted = formatDocumentByType(value, selectedDocType);
    setFormData({ ...formData, cpf: formatted });
    
    // Validar o documento
    const isValid = validateDocumentByType(formatted, selectedDocType);
    const docInfo = DocumentValidator.detectDocument(formatted);
    
    if (docInfo && docInfo.type !== 'INVALID') {
      setDocumentInfo({
        type: docInfo.type,
        personType: docInfo.personType,
        isValid: docInfo.isValid
      });
      
      // Ajustar tipo automaticamente
      if (docInfo.type === 'CNPJ') {
        setFormData({ ...formData, cpf: formatted, tipo: 'empresa' });
      }
    } else if (isValid) {
      setDocumentInfo({
        type: selectedDocType,
        personType: selectedDocType === 'CPF' ? 'PF' : 'PJ',
        isValid: true
      });
    } else {
      setDocumentInfo(null);
    }
  };

  const handleDocTypeChange = (type: 'CPF' | 'CNPJ') => {
    setSelectedDocType(type);
    setFormData({ ...formData, cpf: '', tipo: type === 'CNPJ' ? 'empresa' : 'dependente' });
    setDocumentInfo(null);
  };

  const handleSearchDocument = async () => {
    const cleanValue = formData.cpf.replace(/\D/g, '');
    const minLength = selectedDocType === 'CPF' ? 11 : 14;
    
    if (cleanValue.length < minLength) {
      toast({
        title: "Documento incompleto",
        description: `Por favor, insira um ${selectedDocType} completo antes de buscar.`,
        variant: "destructive",
      });
      return;
    }

    const personType = selectedDocType === 'CPF' ? 'pf' : 'pj';
    const nome = await searchByDocument(formData.cpf, personType);
    
    if (nome) {
      setFormData({ ...formData, nome });
      toast({
        title: "Cliente encontrado!",
        description: `Nome: ${nome}`,
      });
    }
  };

  const handleAddVinculo = async () => {
    if (!documentInfo || !documentInfo.isValid) {
      toast({
        title: "Documento inválido",
        description: "Por favor, insira um CPF ou CNPJ válido.",
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
            title: "Documento já vinculado",
            description: "Este documento já está vinculado à sua conta.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Documento vinculado",
        description: "O documento foi vinculado com sucesso!",
      });

      setFormData({ cpf: '', nome: '', tipo: 'dependente', observacoes: '' });
      setDocumentInfo(null);
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
        .delete()
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
            Gerenciar CPFs/CNPJs Vinculados
          </DialogTitle>
          <DialogDescription>
            Vincule CPFs de dependentes/subestipulantes ou CNPJs de empresas para buscar suas apólices automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de vínculos existentes */}
          <div className="space-y-3">
            {vinculos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum documento vinculado ainda.</p>
                <p className="text-sm">Adicione CPFs ou CNPJs para visualizar as apólices.</p>
              </div>
            ) : (
              vinculos.map((vinculo) => {
                const docInfo = DocumentValidator.detectDocument(vinculo.cpf);
                const formatted = docInfo?.formatted || vinculo.cpf;
                return (
                  <div key={vinculo.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{formatted}</span>
                        <Badge variant={vinculo.tipo === 'empresa' ? 'outline' : vinculo.tipo === 'dependente' ? 'default' : 'secondary'} className="text-xs">
                          {vinculo.tipo === 'dependente' ? 'Dependente' : vinculo.tipo === 'subestipulante' ? 'Subestipulante' : 'Empresa'}
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
              );
              })
            )}
          </div>

          {/* Formulário de adição */}
          {showAddForm ? (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Adicionar Novo CPF/CNPJ
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ cpf: '', nome: '', tipo: 'dependente', observacoes: '' });
                    setSelectedDocType('CPF');
                    setDocumentInfo(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="docType">Tipo de Documento *</Label>
                  <Select value={selectedDocType} onValueChange={handleDocTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cpf">{selectedDocType} *</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => handleDocumentChange(e.target.value)}
                        placeholder={selectedDocType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                        maxLength={selectedDocType === 'CPF' ? 14 : 18}
                      />
                      {documentInfo && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          {documentInfo.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleSearchDocument}
                      disabled={lookupResult.loading || !formData.cpf}
                      title="Buscar na base de dados"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                  {documentInfo && (
                    <p className={`text-xs mt-1 ${documentInfo.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {documentInfo.isValid 
                        ? `✓ ${documentInfo.type} válido`
                        : `✗ ${documentInfo.type} inválido`
                      }
                    </p>
                  )}
                  {lookupResult.found && lookupResult.name && (
                    <p className="text-xs mt-1 text-blue-600">
                      ✓ Encontrado: {lookupResult.name}
                    </p>
                  )}
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
                    onValueChange={(value: 'dependente' | 'subestipulante' | 'empresa') => 
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dependente">Dependente</SelectItem>
                      <SelectItem value="subestipulante">Subestipulante</SelectItem>
                      <SelectItem value="empresa">Empresa</SelectItem>
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
                  disabled={loading || !formData.cpf || !documentInfo?.isValid}
                  className="w-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {loading ? 'Adicionando...' : 'Adicionar Documento'}
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
              Adicionar Novo CPF/CNPJ
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}