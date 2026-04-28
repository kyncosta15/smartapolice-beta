import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, FileEdit, Lock } from 'lucide-react';
import { PolicyDocumentUploadModal } from '@/components/policy/PolicyDocumentUploadModal';

interface PolicyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: any;
  onSave: (updatedPolicy: any) => void;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 mb-4 mt-2">
    <span className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
      {children}
    </span>
    <span className="flex-1 h-px bg-border" />
  </div>
);

export const PolicyEditModal = ({ isOpen, onClose, policy, onSave }: PolicyEditModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: '', insurer: '', premium: '', monthlyAmount: '', status: '',
    startDate: '', endDate: '', policyNumber: '', category: '', entity: '', coverage: '',
    paymentForm: '', installments: '', deductible: '', limits: '', insuredName: '',
    documento: '', documento_tipo: '', vehicleModel: '', uf: '', responsavel_nome: '',
    marca: '', placa: '', nome_embarcacao: '', ano_modelo: '', nome_plano_saude: ''
  });

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name || '',
        type: policy.type || '',
        insurer: policy.insurer || '',
        premium: (policy.valor_premio || policy.premium)?.toString() || '',
        monthlyAmount: (policy.custo_mensal || policy.valor_parcela || policy.monthlyAmount)?.toString() || '',
        status: policy.status || '',
        startDate: policy.startDate || '',
        endDate: policy.endDate || '',
        policyNumber: policy.numero_apolice || policy.policyNumber || '',
        category: policy.category || '',
        entity: policy.entity || '',
        coverage: Array.isArray(policy.coverage) ? policy.coverage.join(', ') : policy.coverage || '',
        paymentForm: policy.forma_pagamento || policy.paymentForm || '',
        installments: (policy.quantidade_parcelas || policy.installments)?.toString() || '',
        deductible: (policy.franquia || policy.deductible)?.toString() || '',
        limits: policy.limits || '',
        insuredName: policy.insuredName || '',
        documento: policy.documento || '',
        documento_tipo: policy.documento_tipo || '',
        vehicleModel: policy.modelo_veiculo || policy.vehicleModel || '',
        uf: policy.uf || '',
        responsavel_nome: policy.responsavel_nome || '',
        marca: policy.marca || '',
        placa: policy.placa || '',
        nome_embarcacao: policy.nome_embarcacao || '',
        ano_modelo: policy.ano_modelo || '',
        nome_plano_saude: policy.nome_plano_saude || ''
      });
    }
  }, [policy]);

  const computedMonthly = useMemo(() => {
    const annual = parseFloat(formData.premium);
    const inst = parseInt(formData.installments);
    if (!annual || !inst || inst <= 0) return '';
    return (annual / inst).toFixed(2);
  }, [formData.premium, formData.installments]);

  const coverageDays = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return null;
    const [sy, sm, sd] = formData.startDate.split('-').map(Number);
    const [ey, em, ed] = formData.endDate.split('-').map(Number);
    if (!sy || !ey) return null;
    const start = new Date(sy, sm - 1, sd).getTime();
    const end = new Date(ey, em - 1, ed).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  }, [formData.startDate, formData.endDate]);

  const formatBR = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d}/${m}/${y}`;
  };

  const formatBRL = (n: number) =>
    n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSave = async () => {
    const premiumValue = parseFloat(formData.premium) || 0;
    const installmentsCount = parseInt(formData.installments) || 12;
    const monthlyValue = parseFloat(computedMonthly) || parseFloat(formData.monthlyAmount) || 0;

    const updatedPolicy = {
      id: policy.id,
      name: formData.name,
      type: formData.type,
      tipo_seguro: formData.type,
      insurer: formData.insurer,
      premium: premiumValue,
      valor_premio: premiumValue,
      monthlyAmount: monthlyValue,
      custo_mensal: monthlyValue,
      valor_parcela: monthlyValue,
      status: formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate,
      policyNumber: formData.policyNumber,
      numero_apolice: formData.policyNumber,
      category: formData.category,
      entity: formData.entity,
      coverage: formData.coverage.split(', ').map((c) => c.trim()),
      paymentForm: formData.paymentForm,
      forma_pagamento: formData.paymentForm,
      installments: installmentsCount,
      quantidade_parcelas: installmentsCount,
      deductible: parseFloat(formData.deductible) || 0,
      franquia: parseFloat(formData.deductible) || 0,
      limits: formData.limits,
      insuredName: formData.insuredName,
      documento: formData.documento,
      documento_tipo: formData.documento_tipo,
      vehicleModel: formData.vehicleModel,
      modelo_veiculo: formData.vehicleModel,
      uf: formData.uf,
      responsavel_nome: formData.responsavel_nome,
      marca: formData.marca,
      placa: formData.placa,
      nome_embarcacao: formData.nome_embarcacao,
      ano_modelo: formData.ano_modelo,
      nome_plano_saude: formData.nome_plano_saude,
    };

    try {
      await onSave(updatedPolicy);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  if (!policy) return null;

  const subtitle = [
    formData.policyNumber ? `Apólice nº ${formData.policyNumber}` : null,
    formData.insuredName || formData.name || null,
  ].filter(Boolean).join(' · ');

  const isAuto = formData.type === 'auto';
  const isNautico = formData.type.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'nautico';
  const isSaude = formData.type.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'saude';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl max-h-[95vh] sm:max-h-[92vh] overflow-hidden p-0 bg-background border-border">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileEdit className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground">
                Editar Apólice
              </DialogTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto px-6 py-5 space-y-6" style={{ maxHeight: 'calc(92vh - 170px)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome da Apólice</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="policyNumber">Número da Apólice</Label>
              <Input id="policyNumber" value={formData.policyNumber} onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger id="type"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="nautico">Náutico</SelectItem>
                  <SelectItem value="vida">Vida</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="empresarial">Empresarial</SelectItem>
                  <SelectItem value="patrimonial">Patrimonial</SelectItem>
                  <SelectItem value="acidentes_pessoais">Acidentes Pessoais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="insurer">Seguradora</Label>
              <Input id="insurer" value={formData.insurer} onChange={(e) => setFormData({ ...formData, insurer: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger id="status"><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="expiring">Vencendo</SelectItem>
                  <SelectItem value="expired">Vencida</SelectItem>
                  <SelectItem value="under_review">Em Análise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <SectionTitle>Vigência</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">Data de Término</Label>
                <Input id="endDate" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground tabular-nums">{formatBR(formData.startDate) || '—'}</span>
              <span className="font-medium text-success">
                {coverageDays !== null ? `${coverageDays} dias de cobertura` : 'Defina as datas'}
              </span>
              <span className="text-muted-foreground tabular-nums">{formatBR(formData.endDate) || '—'}</span>
            </div>
          </div>

          <div>
            <SectionTitle>Financeiro</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="premium">Prêmio Anual (R$)</Label>
                <Input id="premium" type="number" step="0.01" value={formData.premium} onChange={(e) => setFormData({ ...formData, premium: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Select value={formData.installments} onValueChange={(value) => setFormData({ ...formData, installments: value })}>
                  <SelectTrigger id="installments"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((num) => (
                      <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="monthly">Valor Mensal (R$)</Label>
                <div className="relative">
                  <Input id="monthly" readOnly value={computedMonthly ? formatBRL(parseFloat(computedMonthly)) : ''} placeholder="0,00" className="pr-9 text-muted-foreground" />
                  <Lock className="h-3.5 w-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                </div>
                <p className="text-[11px] text-muted-foreground">Calculado automaticamente</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="entity">Corretora</Label>
                <Input id="entity" value={formData.entity} onChange={(e) => setFormData({ ...formData, entity: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="paymentForm">Forma de Pagamento</Label>
                <Select value={formData.paymentForm} onValueChange={(value) => setFormData({ ...formData, paymentForm: value })}>
                  <SelectTrigger id="paymentForm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="Débito em Conta">Débito em Conta</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <SectionTitle>Segurado</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="insuredName">Nome do Segurado</Label>
                <Input id="insuredName" value={formData.insuredName} onChange={(e) => setFormData({ ...formData, insuredName: e.target.value })} />
              </div>
              <div className="grid grid-cols-[1fr_110px] gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="documento">Documento</Label>
                  <Input id="documento" value={formData.documento} onChange={(e) => setFormData({ ...formData, documento: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="documento_tipo">Tipo</Label>
                  <Select value={formData.documento_tipo} onValueChange={(value) => setFormData({ ...formData, documento_tipo: value })}>
                    <SelectTrigger id="documento_tipo"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="uf">Estado (UF)</Label>
                <Select value={formData.uf} onValueChange={(value) => setFormData({ ...formData, uf: value })}>
                  <SelectTrigger id="uf"><SelectValue placeholder="Selecione o estado" /></SelectTrigger>
                  <SelectContent>
                    {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="responsavel_nome">Responsável</Label>
                <Input id="responsavel_nome" placeholder="Nome do responsável" value={formData.responsavel_nome} onChange={(e) => setFormData({ ...formData, responsavel_nome: e.target.value })} />
              </div>
            </div>
          </div>

          {(isAuto || isNautico) && (
            <div>
              <SectionTitle>{isAuto ? 'Veículo' : 'Embarcação'}</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="marca">Marca</Label>
                  <Input id="marca" placeholder={isAuto ? 'Ex: Toyota, Volkswagen' : 'Ex: Lancha, Jet Ski'} value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vehicleModel">Modelo</Label>
                  <Input id="vehicleModel" placeholder={isAuto ? 'Ex: Corolla, Gol' : 'Ex: Phantom 300'} value={formData.vehicleModel} onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ano_modelo">Ano do Modelo</Label>
                  <Input id="ano_modelo" type="number" placeholder="Ex: 2023" value={formData.ano_modelo} onChange={(e) => setFormData({ ...formData, ano_modelo: e.target.value })} />
                </div>
                {isAuto && (
                  <div className="space-y-1.5">
                    <Label htmlFor="placa">Placa</Label>
                    <Input id="placa" placeholder="Ex: ABC-1234" value={formData.placa} onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })} />
                  </div>
                )}
                {isNautico && (
                  <div className="space-y-1.5">
                    <Label htmlFor="nome_embarcacao">Nome da Embarcação</Label>
                    <Input id="nome_embarcacao" placeholder="Ex: Vento Sul" value={formData.nome_embarcacao} onChange={(e) => setFormData({ ...formData, nome_embarcacao: e.target.value })} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="deductible">Franquia (R$)</Label>
                  <Input id="deductible" type="number" step="0.01" value={formData.deductible} onChange={(e) => setFormData({ ...formData, deductible: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {isSaude && (
            <div>
              <SectionTitle>Plano de Saúde</SectionTitle>
              <div className="space-y-1.5">
                <Label htmlFor="nome_plano_saude">Nome do Plano</Label>
                <Input id="nome_plano_saude" placeholder="Ex: Unimed, Bradesco Saúde, SulAmérica" value={formData.nome_plano_saude} onChange={(e) => setFormData({ ...formData, nome_plano_saude: e.target.value })} />
              </div>
            </div>
          )}

          <div>
            <SectionTitle>Cobertura</SectionTitle>
            <div className="space-y-1.5">
              <Label htmlFor="coverage">Descrição</Label>
              <Textarea id="coverage" value={formData.coverage} onChange={(e) => setFormData({ ...formData, coverage: e.target.value })} rows={3} />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-6 py-4 border-t border-border bg-background">
          <Button variant="ghost" size="sm" onClick={() => setShowUploadModal(true)} className="text-muted-foreground hover:text-primary">
            <Upload className="h-4 w-4 mr-2" />
            Anexar PDF
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">Cancelar</Button>
            <Button onClick={handleSave} className="flex-1 sm:flex-none">Salvar Alterações</Button>
          </div>
        </div>

        {user && (
          <PolicyDocumentUploadModal
            open={showUploadModal}
            onOpenChange={setShowUploadModal}
            policyId={policy?.id}
            userId={user.id}
            onUploadComplete={(_path, type) => {
              toast({
                title: 'Documento anexado',
                description: `${type === 'apolice' ? 'Apólice' : type === 'endosso' ? 'Endosso' : 'Renovação'} anexada com sucesso`,
              });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
