import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export interface CompanyFormData {
  id?: string;
  nome: string;
  cnpj: string;
  contato_rh_nome?: string;
  contato_rh_email?: string;
  contato_rh_telefone?: string;
}

interface CompanyFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  initialData?: CompanyFormData | null;
  loading?: boolean;
}

export function CompanyFormModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialData,
  loading = false 
}: CompanyFormModalProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    nome: '',
    cnpj: '',
    contato_rh_nome: '',
    contato_rh_email: '',
    contato_rh_telefone: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        nome: '',
        cnpj: '',
        contato_rh_nome: '',
        contato_rh_email: '',
        contato_rh_telefone: '',
      });
    }
    setErrors({});
  }, [initialData, open]);

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    return value;
  };

  const handleChange = (field: keyof CompanyFormData, value: string) => {
    let formattedValue = value;
    
    if (field === 'cnpj') {
      formattedValue = formatCNPJ(value);
    } else if (field === 'contato_rh_telefone') {
      formattedValue = formatPhone(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof CompanyFormData, string>> = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else {
      const cnpjNumbers = formData.cnpj.replace(/\D/g, '');
      if (cnpjNumbers.length !== 14) {
        newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
      }
    }
    
    if (formData.contato_rh_email && !formData.contato_rh_email.includes('@')) {
      newErrors.contato_rh_email = 'Email inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData?.id ? 'Editar Empresa' : 'Nova Empresa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">
              Nome da Empresa <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Ex: Empresa LTDA"
              disabled={loading}
            />
            {errors.nome && (
              <p className="text-sm text-destructive">{errors.nome}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">
              CNPJ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cnpj"
              value={formData.cnpj}
              onChange={(e) => handleChange('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
              disabled={loading}
              maxLength={18}
            />
            {errors.cnpj && (
              <p className="text-sm text-destructive">{errors.cnpj}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-4">Contato RH (Opcional)</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contato_rh_nome">Nome do Contato</Label>
                <Input
                  id="contato_rh_nome"
                  value={formData.contato_rh_nome || ''}
                  onChange={(e) => handleChange('contato_rh_nome', e.target.value)}
                  placeholder="Nome completo"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contato_rh_email">Email do Contato</Label>
                <Input
                  id="contato_rh_email"
                  type="email"
                  value={formData.contato_rh_email || ''}
                  onChange={(e) => handleChange('contato_rh_email', e.target.value)}
                  placeholder="email@empresa.com"
                  disabled={loading}
                />
                {errors.contato_rh_email && (
                  <p className="text-sm text-destructive">{errors.contato_rh_email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contato_rh_telefone">Telefone do Contato</Label>
                <Input
                  id="contato_rh_telefone"
                  value={formData.contato_rh_telefone || ''}
                  onChange={(e) => handleChange('contato_rh_telefone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  disabled={loading}
                  maxLength={15}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData?.id ? 'Salvar Alterações' : 'Criar Empresa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
