

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Plus, Eye, Download, Edit, LayoutGrid, List, RefreshCw, Filter, Users, Link, Car, Heart, Activity, Home, Building2, ShieldAlert, Ship, Shield, Anchor, Search, MoreHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PolicyKPIs } from './policy/PolicyKPIs';
import { MonthlyValueEditor } from './policy/MonthlyValueEditor';
import { NewPolicyManualModal } from './NewPolicyManualModal';
import { PolicyDetailsModal } from './PolicyDetailsModal';
import { PolicyEditModal } from './PolicyEditModal';
import { PolicyWithStatus, PolicyStatus } from '@/types/policyStatus';
import { STATUS_COLORS, formatStatusText } from '@/utils/statusColors';
import { InfoModal } from '@/components/InfoModal';
import { formatCurrency } from '@/utils/currencyFormatter';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { useToast } from '@/hooks/use-toast';
import { useInfoCapSync } from '@/hooks/useInfoCapSync';
import { renderValue, renderValueAsString, renderCurrency } from '@/utils/renderValue';
import { toText, moedaBR, normalizePolicy } from '@/lib/policies';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ManageCPFVinculosModal } from './ManageCPFVinculosModal';
import { supabase } from '@/integrations/supabase/client';
import { usePolicyAttachedDocs } from '@/hooks/usePolicyAttachedDocs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, FileText as FileTextIcon } from 'lucide-react';

// Formatar data ISO p/ pt-BR sem bug de timezone UTC
const formatDatePtBrSafe = (isoDate?: string | null): string => {
  if (!isoDate) return '';
  const d = String(isoDate).slice(0, 10); // "YYYY-MM-DD"
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

// Verificar se data já passou (compara só YYYY-MM-DD, sem timezone)
const isDatePast = (isoDate?: string | null): boolean => {
  if (!isoDate) return false;
  const d = String(isoDate).slice(0, 10);
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return d < todayISO;
};

interface MyPoliciesProps {
  initialStatusFilter?: 'todas' | 'vigentes' | 'antigas';
  highlightPolicyId?: string | null;
  refreshToken?: number;
}

export function MyPolicies({
  initialStatusFilter = 'vigentes',
  highlightPolicyId = null,
  refreshToken = 0,
}: MyPoliciesProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNewPolicyModal, setShowNewPolicyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<PolicyWithStatus | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPolicies, setSelectedPolicies] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'todas' | 'vigentes' | 'antigas'>(initialStatusFilter);
  const [detailedStatusFilter, setDetailedStatusFilter] = useState<'todas' | 'ativa' | 'pendente_analise' | 'vencida'>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [showManageCPFModal, setShowManageCPFModal] = useState(false);
  const [cpfVinculos, setCpfVinculos] = useState<Array<{ cpf: string; tipo: string }>>([]);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(highlightPolicyId);
  const itemsPerPage = 10;
  const { policies, updatePolicy, deletePolicy, refreshPolicies, downloadPDF } = usePersistedPolicies();
  const { toast } = useToast();
  const { isSyncing: isInfoCapSyncing } = useInfoCapSync();

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
    setDetailedStatusFilter('todas');
    setViewMode('cards');
    setCurrentPage(1);

    if (refreshToken > 0) {
      void refreshPolicies();
    }
  }, [initialStatusFilter, refreshToken]);

  useEffect(() => {
    if (!highlightPolicyId) {
      setActiveHighlightId(null);
      return;
    }

    setActiveHighlightId(highlightPolicyId);

    const scrollTimeout = window.setTimeout(() => {
      const targetCard = document.getElementById(`policy-card-${highlightPolicyId}`);
      targetCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 350);

    const highlightTimeout = window.setTimeout(() => {
      setActiveHighlightId(null);
    }, 6000);

    return () => {
      window.clearTimeout(scrollTimeout);
      window.clearTimeout(highlightTimeout);
    };
  }, [highlightPolicyId, refreshToken]);
  
  // Função para carregar vínculos de CPF
  const loadCPFVinculos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('🔍 [CPF Vínculos] Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase
        .from('user_cpf_vinculos')
        .select('cpf, tipo')
        .eq('user_id', user.id)
        .eq('ativo', true);

      if (error) throw error;
      
      console.log('🔍 [CPF Vínculos] Vínculos carregados:', data);
      setCpfVinculos(data || []);
    } catch (error) {
      console.error('❌ [CPF Vínculos] Erro ao carregar vínculos de CPF:', error);
    }
  };

  // Carregar vínculos na montagem do componente
  useEffect(() => {
    loadCPFVinculos();
  }, []);

  // Função helper para verificar se um CPF vinculado é de dependente
  const isDependentCPF = (vinculoCpf: string | undefined): boolean => {
    if (!vinculoCpf) return false;
    const cleanCpf = vinculoCpf.replace(/\D/g, '');
    const isDependent = cpfVinculos.some(v => v.cpf === cleanCpf && v.tipo === 'dependente');
    
    console.log('🔍 [isDependentCPF] Verificando CPF:', {
      vinculoCpf,
      cleanCpf,
      cpfVinculos,
      isDependent
    });
    
    return isDependent;
  };

  // Funções helpers para normalizar e exibir o tipo de seguro
  const normalizePolicyType = (type?: string) => {
    const normalizedType =
      type?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() || '';

    if (normalizedType.includes('garantia')) {
      return 'garantia_obrigacoes';
    }

    return normalizedType;
  };

  const getPolicyTypeLabel = (type?: string) => {
    switch (normalizePolicyType(type)) {
      case 'auto':
      case 'automovel':
        return 'AUTOMÓVEL';
      case 'vida':
        return 'VIDA';
      case 'saude':
        return 'SAÚDE';
      case 'residencial':
        return 'RESIDENCIAL';
      case 'patrimonial':
        return 'PATRIMONIAL';
      case 'empresarial':
        return 'EMPRESARIAL';
      case 'acidentes_pessoais':
        return 'ACIDENTES PESSOAIS';
      case 'nautico':
        return 'NÁUTICO';
      case 'garantia':
      case 'garantia_obrigacoes':
        return 'GARANTIA DE OBRIGAÇÕES';
      default:
        return type?.toUpperCase() || 'N/A';
    }
  };

  const getTypeIcon = (type: string) => {
    const iconClass = 'h-4 w-4';
    const normalizedType = normalizePolicyType(type);

    switch (normalizedType) {
      case 'auto':
      case 'automovel':
        return <Car className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
      case 'vida':
        return <Heart className={`${iconClass} text-red-600 dark:text-red-400`} />;
      case 'saude':
        return <Activity className={`${iconClass} text-green-600 dark:text-green-400`} />;
      case 'residencial':
      case 'patrimonial':
        return <Home className={`${iconClass} text-orange-600 dark:text-orange-400`} />;
      case 'empresarial':
        return <Building2 className={`${iconClass} text-purple-600 dark:text-purple-400`} />;
      case 'acidentes_pessoais':
        return <ShieldAlert className={`${iconClass} text-yellow-600 dark:text-yellow-400`} />;
      case 'nautico':
        console.log('⚓ [getTypeIcon] Renderizando Anchor icon para nautico');
        return <Anchor className={`${iconClass} text-cyan-600 dark:text-cyan-400`} />;
      case 'garantia':
      case 'garantia_obrigacoes':
        return <Shield className={`${iconClass} text-primary`} />;
      default:
        console.log('🛡️ [getTypeIcon] Usando Shield icon (default) para:', type);
        return <Shield className={`${iconClass} text-gray-600 dark:text-gray-400`} />;
    }
  };
  
  // Handler para quando CPFs são atualizados
  const handleCPFsUpdated = () => {
    loadCPFVinculos();
    refreshPolicies();
  };
  
  const policiesWithStatus: PolicyWithStatus[] = policies.map(policy => {
    const finalStatus = policy.status as PolicyStatus;
    const normalizedPolicyType = normalizePolicyType(toText(policy.type)) || toText(policy.type);
    
    console.log(`✅ [MyPolicies] Apólice ${toText(policy.name)}: status do banco = ${finalStatus}`);
    
    return {
      id: policy.id,
      name: toText(policy.name),
      insurer: toText(policy.insurer),
      policyNumber: toText(policy.policyNumber),
      type: normalizedPolicyType,
      monthlyAmount: typeof policy.monthlyAmount === 'number' ? policy.monthlyAmount : 0,
      startDate: policy.startDate,
      endDate: policy.endDate,
      expirationDate: policy.expirationDate || policy.endDate,
      status: finalStatus,
      nosnum: policy.nosnum,
      codfil: policy.codfil,
      // Campos de veículo/embarcação
      marca: policy.marca,
      placa: policy.placa,
      ano_modelo: policy.ano_modelo,
      nome_embarcacao: policy.nome_embarcacao,
      modelo_veiculo: (policy as any).modelo_veiculo || policy.vehicleModel,
      vehicleModel: policy.vehicleModel || (policy as any).modelo_veiculo,
      // Campo específico saúde
      nome_plano_saude: policy.nome_plano_saude,
      // Campos de renovação
      renovado_nosnum: (policy as any).renovado_nosnum ?? null,
      renovado_codfil: (policy as any).renovado_codfil ?? null,
      sit_renovacao_txt: (policy as any).sit_renovacao_txt ?? null,
    };
  });

  // Mapa para resolver relações de renovação: "codfil-nosnum" -> { policyNumber, id, endDate }
  const renewalLookup = React.useMemo(() => {
    const byKey = new Map<string, { policyNumber: string; id: string; endDate?: string }>();
    const renewedBy = new Map<string, { policyNumber: string; id: string; endDate?: string }>();
    policiesWithStatus.forEach(p => {
      if (p.codfil != null && p.nosnum != null) {
        byKey.set(`${p.codfil}-${p.nosnum}`, { policyNumber: p.policyNumber, id: p.id, endDate: p.endDate });
      }
    });
    // renewedBy: para cada apólice antiga (que tem renovado_nosnum apontando para a nova),
    // mapeamos antiga -> nova. Inverso: nova -> antiga (quem renovou)
    policiesWithStatus.forEach(p => {
      if (p.renovado_nosnum != null && p.renovado_codfil != null) {
        const newKey = `${p.renovado_codfil}-${p.renovado_nosnum}`;
        // p é a antiga, newKey aponta para a nova
        renewedBy.set(newKey, { policyNumber: p.policyNumber, id: p.id, endDate: p.endDate });
      }
    });
    return { byKey, renewedBy };
  }, [policiesWithStatus]);

  const getRenewalInfo = (policy: PolicyWithStatus): { label: string; targetNumber: string } | null => {
    // Caso 1: esta apólice foi RENOVADA → encontrar a nova
    if (policy.status === 'renovada' && policy.renovado_nosnum != null && policy.renovado_codfil != null) {
      const target = renewalLookup.byKey.get(`${policy.renovado_codfil}-${policy.renovado_nosnum}`);
      if (target) {
        return { label: `Renovada pela apólice ${target.policyNumber}`, targetNumber: target.policyNumber };
      }
      return { label: `Renovada pela apólice nº ${policy.renovado_nosnum}`, targetNumber: String(policy.renovado_nosnum) };
    }
    // Caso 2: esta é uma apólice NOVA que renovou outra → encontrar a antiga
    if (policy.codfil != null && policy.nosnum != null) {
      const old = renewalLookup.renewedBy.get(`${policy.codfil}-${policy.nosnum}`);
      if (old) {
        return { label: `Renovação da apólice ${old.policyNumber}`, targetNumber: old.policyNumber };
      }
    }
    return null;
  };

  const handleDeleteClick = (e: React.MouseEvent, policy: PolicyWithStatus) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`🗑️ [handleDeleteClick] Preparando deleção da apólice: ${policy.name} (${policy.id})`);
    setPolicyToDelete(policy);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!policyToDelete) {
      console.log('❌ [handleConfirmDelete] Nenhuma apólice selecionada para deleção');
      return;
    }
    
    setIsDeleting(true);
    console.log(`🗑️ [handleConfirmDelete] Iniciando deleção da apólice: ${policyToDelete.name} (${policyToDelete.id})`);
    
    try {
      const success = await deletePolicy(policyToDelete.id);
      
      if (success) {
        console.log(`✅ [handleConfirmDelete] Apólice ${policyToDelete.id} deletada com sucesso`);
        
        toast({
          title: "✅ Apólice Deletada",
          description: `A apólice "${policyToDelete.name}" foi removida com sucesso`,
        });
        
        setShowDeleteDialog(false);
        setPolicyToDelete(null);
        
        setTimeout(() => {
          refreshPolicies();
        }, 500);
        
      } else {
        console.log(`❌ [handleConfirmDelete] Falha ao deletar apólice ${policyToDelete.id}`);
        
        toast({
          title: "❌ Erro na Deleção",
          description: "Não foi possível deletar a apólice. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ [handleConfirmDelete] Erro na deleção:', error);
      
      toast({
        title: "❌ Erro Inesperado",
        description: "Ocorreu um erro ao deletar a apólice",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    console.log('❌ [handleCancelDelete] Deleção cancelada pelo usuário');
    setShowDeleteDialog(false);
    setPolicyToDelete(null);
  };

  // Funções de multiseleção
  const togglePolicySelection = (policyId: string) => {
    setSelectedPolicies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(policyId)) {
        newSet.delete(policyId);
      } else {
        newSet.add(policyId);
      }
      return newSet;
    });
  };

  const toggleAllPolicies = () => {
    if (selectedPolicies.size === currentPolicies.length && currentPolicies.length > 0) {
      setSelectedPolicies(new Set());
    } else {
      setSelectedPolicies(new Set(currentPolicies.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPolicies.size === 0) return;

    const confirmDelete = confirm(
      `Deseja realmente excluir ${selectedPolicies.size} apólice(s) selecionada(s)?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (!confirmDelete) return;

    setIsDeleting(true);

    toast({
      title: "⏳ Excluindo apólices",
      description: `Processando ${selectedPolicies.size} apólice(s)...`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const policyId of selectedPolicies) {
      try {
        const success = await deletePolicy(policyId);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        errorCount++;
        console.error(`Erro ao deletar apólice ${policyId}:`, error);
      }
    }

    setSelectedPolicies(new Set());
    setIsDeleting(false);
    await refreshPolicies();

    if (errorCount === 0) {
      toast({
        title: "✅ Exclusão concluída",
        description: `${successCount} apólice(s) excluída(s) com sucesso!`,
      });
    } else {
      toast({
        title: "⚠️ Exclusão parcial",
        description: `${successCount} apólice(s) excluída(s), ${errorCount} falhou(ram)`,
        variant: "destructive",
      });
    }
  };

  const handleBulkStatusChange = async (newStatus: PolicyStatus) => {
    if (selectedPolicies.size === 0) return;

    setIsDeleting(true);

    toast({
      title: "⏳ Atualizando status",
      description: `Processando ${selectedPolicies.size} apólice(s)...`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const policyId of selectedPolicies) {
      try {
        const success = await updatePolicy(policyId, { status: newStatus });
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Erro ao atualizar apólice ${policyId}:`, error);
        errorCount++;
      }
    }

    setIsDeleting(false);
    setSelectedPolicies(new Set());
    
    await refreshPolicies();

    if (errorCount === 0) {
      toast({
        title: "✅ Status atualizado",
        description: `${successCount} apólice(s) atualizada(s) para: ${formatStatusText(newStatus)}`,
      });
    } else {
      toast({
        title: "⚠️ Atualização parcial",
        description: `${successCount} apólice(s) atualizada(s), ${errorCount} falhou(ram)`,
        variant: "destructive",
      });
    }
  };

  const handleViewPolicy = async (policy: PolicyWithStatus) => {
    console.log('👁️ [handleViewPolicy] Abrindo modal para policy:', policy.id);
    
    // Buscar dados atualizados DIRETO DO BANCO sempre que abrir o modal
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: freshData, error } = await supabase
        .from('policies')
        .select('*')
        .eq('id', policy.id)
        .eq('user_id', user.id)
        .single();
      
      if (!error && freshData) {
        console.log('✅ [handleViewPolicy] Dados frescos do banco:', {
          marca: freshData.marca,
          modelo_veiculo: freshData.modelo_veiculo,
          nome_embarcacao: freshData.nome_embarcacao,
          ano_modelo: freshData.ano_modelo,
          franquia: freshData.franquia
        });
        
        // Normalizar e usar dados do banco
        const normalized = normalizePolicy(freshData);
        setSelectedPolicy(normalized);
      } else {
        // Fallback para dados do estado
        const originalPolicy = policies.find(p => p.id === policy.id);
        setSelectedPolicy(originalPolicy || policy);
      }
    } else {
      // Fallback para dados do estado
      const originalPolicy = policies.find(p => p.id === policy.id);
      setSelectedPolicy(originalPolicy || policy);
    }
    
    setShowDetailsModal(true);
  };

  const handleDownloadPolicy = async (policy: PolicyWithStatus) => {
    // DEBUG: Verificar valores de nosnum e codfil
    console.log('🔍 [Download Debug] PolicyWithStatus recebida:', { 
      name: policy.name,
      nosnum: policy.nosnum,
      codfil: policy.codfil,
      nosnum_type: typeof policy.nosnum,
      codfil_type: typeof policy.codfil
    });
    
    // Buscar a policy original para ter todos os dados
    const originalPolicy = policies.find(p => p.id === policy.id);
    
    console.log('🔍 [Download Debug] Original Policy encontrada:', { 
      found: !!originalPolicy,
      name: originalPolicy?.name,
      nosnum: originalPolicy?.nosnum,
      codfil: originalPolicy?.codfil,
      pdfPath: originalPolicy?.pdfPath
    });
    
    // Usar nosnum e codfil do PolicyWithStatus que já estão mapeados corretamente
    if (policy.nosnum && policy.codfil) {
      console.log('📥 Tentando baixar da API InfoCap:', { 
        nosnum: policy.nosnum, 
        codfil: policy.codfil 
      });
      
      try {
        const { getDocumentoAnexos, downloadDocumentoAnexo } = await import('@/services/corpnuvem/anexos');
        
        toast({
          title: "Baixando apólice",
          description: "Por favor, aguarde...",
        });
        
        const response = await getDocumentoAnexos({
          codfil: policy.codfil,
          nosnum: policy.nosnum
        });
        
        console.log('📦 [Download Debug] Resposta da API:', response);
        
        if (response?.anexos && response.anexos.length > 0) {
          // Buscar o primeiro PDF disponível
          const pdfAnexo = response.anexos.find(anexo => 
            anexo.tipo?.toLowerCase().includes('pdf')
          );
          
          console.log('📄 [Download Debug] PDF encontrado:', pdfAnexo);
          
          if (pdfAnexo) {
            await downloadDocumentoAnexo(
              pdfAnexo.url, 
              `${policy.name}.pdf`
            );
            
            toast({
              title: "Download concluído",
              description: "Apólice baixada com sucesso",
            });
            return;
          }
        }
        
        console.warn('⚠️ Nenhum PDF encontrado nos anexos da API InfoCap');
      } catch (error) {
        console.error('❌ Erro ao baixar da API InfoCap:', error);
        toast({
          title: "Erro ao baixar",
          description: "Não foi possível obter o arquivo",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Fallback: usar método tradicional se não conseguiu da API
    if (!originalPolicy?.pdfPath) {
      toast({
        title: "Arquivo não disponível",
        description: "Esta apólice não possui arquivo para download",
        variant: "destructive",
      });
      return;
    }

    console.log('📥 Iniciando download via hook para:', policy.name);
    
    // Usar a função do hook que já tem toda a lógica correta
    await downloadPDF(policy.id, policy.name);
  };

  const handleEditPolicy = (policy: PolicyWithStatus) => {
    const originalPolicy = policies.find(p => p.id === policy.id);
    setSelectedPolicy(originalPolicy || policy);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedPolicy: any) => {
    try {
      console.log('💾 [handleSaveEdit] Salvando apólice:', updatedPolicy.id);
      
      const success = await updatePolicy(updatedPolicy.id, updatedPolicy);
      
      if (success) {
        // Buscar dados atualizados DIRETO DO BANCO
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: updatedData, error } = await supabase
            .from('policies')
            .select('*')
            .eq('id', updatedPolicy.id)
            .eq('user_id', user.id)
            .single();
          
          if (!error && updatedData) {
            const normalized = normalizePolicy(updatedData);
            setSelectedPolicy(normalized);
          }
        }
        
        await refreshPolicies();
        setShowEditModal(false);
      }
      // Se success === false, updatePolicy já mostrou o toast de erro - NÃO fechar modal
    } catch (error: any) {
      console.error('❌ [handleSaveEdit] ERRO:', error);
      // Toast já foi mostrado pelo updatePolicy
    }
  };

  // Filtrar apólices por status baseado no ano atual
  const currentYear = new Date().getFullYear();
  
  const filteredPolicies = policiesWithStatus.filter(policy => {
    // Filtro por período (vigentes/antigas)
    if (statusFilter !== 'todas') {
      if (statusFilter === 'vigentes') {
        // Vigentes: mostrar APENAS as ativas (status vigente, ativa ou vencendo)
        const status = policy.status?.toLowerCase();
        if (status !== 'vigente' && status !== 'ativa' && status !== 'vencendo') return false;
      }
      
      if (statusFilter === 'antigas') {
        // Antigas: mostrar APENAS as não vigentes (status diferente de vigente, ativa ou vencendo)
        const status = policy.status?.toLowerCase();
        if (status === 'vigente' || status === 'ativa' || status === 'vencendo') return false;
      }
    }
    
    // Filtro por status detalhado
    if (detailedStatusFilter !== 'todas') {
      if (detailedStatusFilter === 'ativa') {
        return policy.status === 'vigente' || policy.status === 'ativa' || policy.status === 'vencendo';
      }
      if (detailedStatusFilter === 'pendente_analise') {
        return policy.status === 'pendente_analise' || policy.status === 'aguardando_emissao';
      }
      if (detailedStatusFilter === 'vencida') {
        return policy.status === 'vencida' || policy.status === 'nao_renovada';
      }
    }
    
    // Filtro por busca textual
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const haystack = [
        policy.name,
        policy.policyNumber,
        policy.insurer,
        policy.marca,
        policy.placa,
        policy.modelo_veiculo,
        policy.vehicleModel,
        policy.nome_embarcacao,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });

  // KPIs da carteira
  const kpiData = React.useMemo(() => {
    const isActive = (s?: string) => {
      const x = s?.toLowerCase();
      return x === 'vigente' || x === 'ativa' || x === 'vencendo';
    };
    const vigentesArr = policiesWithStatus.filter((p) => isActive(p.status));
    const premioMensalTotal = vigentesArr.reduce((sum, p) => sum + (p.monthlyAmount || 0), 0);

    const todayISO = (() => {
      const t = new Date();
      return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    })();

    const upcoming = vigentesArr
      .map((p) => ({ name: p.name, date: String(p.expirationDate || p.endDate || '').slice(0, 10) }))
      .filter((p) => p.date && p.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    return {
      total: policiesWithStatus.length,
      vigentes: vigentesArr.length,
      premioMensalTotal,
      proximoVencimento: upcoming || null,
    };
  }, [policiesWithStatus]);

  // Paginação
  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPolicies = viewMode === 'list' 
    ? filteredPolicies.slice(startIndex, endIndex)
    : filteredPolicies;

  // Buscar documentos vinculados (Central de Documentos) para as apólices visíveis
  const visiblePolicyIds = React.useMemo(
    () => currentPolicies.map(p => p.id),
    [currentPolicies]
  );
  const { getDocsForPolicy, downloadAttachedDoc } = usePolicyAttachedDocs(visiblePolicyIds);

  return (
    <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-0">
      <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
        {/* Título + Badge */}
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-foreground">Minhas Apólices</h2>
          <Badge variant="secondary" className="text-xs sm:text-sm shrink-0">
            {filteredPolicies.length}
          </Badge>
        </div>
        
        {/* Toggle de visualização + Botão Nova Apólice + Gerenciar CPFs */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowManageCPFModal(true)}
            variant="outline"
            className="order-0 gap-1.5 sm:gap-2 h-8 sm:h-10 px-3 sm:px-4 whitespace-nowrap"
            title="Gerenciar CPFs vinculados"
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Vínculos</span>
          </Button>
          
          <Button
            onClick={() => setShowNewPolicyModal(true)}
            className="order-1 sm:order-2 gap-1.5 sm:gap-2 h-8 sm:h-10 px-3 sm:px-4 whitespace-nowrap bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg active:shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 transition-all duration-200 rounded-md font-medium text-xs sm:text-sm"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Nova</span>
            <span className="hidden sm:inline">Apólice</span>
          </Button>
          
          <div className="order-2 sm:order-1 flex items-center border rounded-md shadow-sm">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setViewMode('cards');
                setCurrentPage(1);
              }}
              className="rounded-r-none h-8 sm:h-9 w-9 sm:w-10 p-0"
              title="Visualizar em cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setViewMode('list');
                setCurrentPage(1);
              }}
              className="rounded-l-none h-8 sm:h-9 w-9 sm:w-10 p-0"
              title="Visualizar em lista"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* KPIs da carteira */}
      <PolicyKPIs
        total={kpiData.total}
        vigentes={kpiData.vigentes}
        premioMensalTotal={kpiData.premioMensalTotal}
        proximoVencimento={kpiData.proximoVencimento}
      />

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Buscar por nome, número, segurado, placa..."
          className="pl-9 pr-9 h-10 bg-card border-border"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm text-muted-foreground font-medium">Período:</span>
        <Button
          variant={statusFilter === 'vigentes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('vigentes');
            setCurrentPage(1);
          }}
          className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
        >
          Vigentes ({policiesWithStatus.filter(p => {
            const status = p.status?.toLowerCase();
            return status === 'vigente' || status === 'ativa' || status === 'vencendo';
          }).length})
        </Button>
        <Button
          variant={statusFilter === 'antigas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('antigas');
            setCurrentPage(1);
          }}
          className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
        >
          Antigas ({policiesWithStatus.filter(p => {
            const status = p.status?.toLowerCase();
            return status !== 'vigente' && status !== 'ativa' && status !== 'vencendo';
          }).length})
        </Button>
        <Button
          variant={statusFilter === 'todas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('todas');
            setCurrentPage(1);
          }}
          className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
        >
          Todas ({policiesWithStatus.length})
        </Button>

        {/* Filtro de Status da Apólice como Dropdown */}
        <div className="flex items-center gap-2 ml-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={detailedStatusFilter} onValueChange={(value: any) => {
            setDetailedStatusFilter(value);
            setCurrentPage(1);
          }}>
            <SelectTrigger className="w-[180px] h-8 sm:h-9 text-xs sm:text-sm">
              <SelectValue placeholder="Status da Apólice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="ativa">
                Ativas ({policiesWithStatus.filter(p => 
                  p.status === 'vigente' || p.status === 'ativa' || p.status === 'vencendo'
                ).length})
              </SelectItem>
              <SelectItem value="pendente_analise">
                Em Análise ({policiesWithStatus.filter(p => 
                  p.status === 'pendente_analise' || p.status === 'aguardando_emissao'
                ).length})
              </SelectItem>
              <SelectItem value="vencida">
                Canceladas ({policiesWithStatus.filter(p => 
                  p.status === 'vencida' || p.status === 'nao_renovada'
                ).length})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Barra de ações em massa */}
      {selectedPolicies.size > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedPolicies.size} apólice(s) selecionada(s)
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPolicies(new Set())}
                  className="border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                >
                  Limpar seleção
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Select onValueChange={(value) => handleBulkStatusChange(value as PolicyStatus)}>
                  <SelectTrigger className="w-[180px] h-9 bg-white dark:bg-gray-800">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Alterar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vigente">Vigente</SelectItem>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="vencendo">Vencendo</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                    <SelectItem value="pendente_analise">Em Análise</SelectItem>
                    <SelectItem value="aguardando_emissao">Aguardando Emissão</SelectItem>
                    <SelectItem value="nao_renovada">Não Renovada</SelectItem>
                    <SelectItem value="renovada">Renovada</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir selecionadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visualização em Cards */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {currentPolicies.map((policy) => {
            const originalPolicy = policies.find(p => p.id === policy.id);
            const installmentsCount = originalPolicy?.quantidade_parcelas || 
                                    originalPolicy?.installments?.length || 
                                    1;
            
            console.log(`🎯 [MyPolicies-Render] Renderizando ${policy.name} com status: ${policy.status}`);
            console.log('🔍 [MyPolicies-Render] Original Policy campos:', {
              id: originalPolicy?.id,
              name: originalPolicy?.name,
              vinculo_cpf: originalPolicy?.vinculo_cpf,
              documento: originalPolicy?.documento,
              allKeys: originalPolicy ? Object.keys(originalPolicy) : []
            });
            
            const statusKey = (policy.status || '').toLowerCase();
            const isVigenteCard = ['vigente', 'ativa', 'vencendo'].includes(statusKey);
            const isVencidaCard = ['vencida', 'nao_renovada'].includes(statusKey);
            const stripeColor = isVigenteCard
              ? 'bg-emerald-500'
              : isVencidaCard
                ? 'bg-destructive'
                : 'bg-amber-500';
            const dotColor = isVigenteCard
              ? 'bg-emerald-500'
              : isVencidaCard
                ? 'bg-destructive'
                : 'bg-amber-500';
            const pillTone = isVigenteCard
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : isVencidaCard
                ? 'bg-destructive/15 text-destructive border-destructive/30'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';

            return (
              <Card
                key={policy.id}
                id={`policy-card-${policy.id}`}
                className={`relative overflow-hidden bg-card border-border transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 ${
                  policy.id === activeHighlightId
                    ? 'ring-2 ring-primary shadow-lg shadow-primary/20'
                    : ''
                }`}
              >
                {/* Faixa de status no topo */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${stripeColor}`} />

                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-4 sm:pt-6 space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-start gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getTypeIcon(policy.type)}
                        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">
                          {getPolicyTypeLabel(policy.type)}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        {originalPolicy?.documento && isDependentCPF(originalPolicy.documento) && (
                          <div title="Apólice de dependente" className="shrink-0 mt-0.5">
                            <Link className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        <CardTitle className="text-sm sm:text-base md:text-lg leading-tight break-words dark:text-foreground">
                          {toText(policy.name)}
                        </CardTitle>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${pillTone} shrink-0 gap-1.5 text-[10px] sm:text-xs whitespace-nowrap px-2 py-0.5 rounded-full font-medium`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                      {formatStatusText(policy.status)}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-muted-foreground truncate">
                    {toText(policy.insurer)}
                  </p>
                  {policy.type && ['auto', 'automovel'].includes(policy.type.toLowerCase()) && (() => {
                    const sanitizeVehicleField = (value?: string | null) => {
                      const text = String(value ?? '').trim();
                      const normalized = text
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .toLowerCase()
                        .replace(/\s+/g, ' ');

                      const invalidValues = new Set(['nao informado', 'n informado', 'na', 'n/a', '-', '']);
                      return invalidValues.has(normalized) ? '' : text;
                    };

                    const marca = sanitizeVehicleField(policy.marca);
                    const modeloVal = sanitizeVehicleField(policy.modelo_veiculo || policy.vehicleModel);
                    const veiculoText = [marca, modeloVal].filter(Boolean).join(' ');

                    return veiculoText ? (
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-foreground truncate">
                        {veiculoText}
                      </p>
                    ) : null;
                  })()}
                  {/* Nome do Plano de Saúde */}
                  {policy.nome_plano_saude && String(policy.nome_plano_saude).trim() !== '' && policy.nome_plano_saude !== 'Não informado' && policy.nome_plano_saude !== 'N/A' && (
                    <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 truncate font-medium">
                      Plano: {policy.nome_plano_saude}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-muted-foreground mb-0.5 sm:mb-1">Número</p>
                        <p className="font-medium text-xs sm:text-sm dark:text-foreground break-all leading-tight">{policy.policyNumber}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-muted-foreground mb-0.5 sm:mb-1">Valor Mensal</p>
                        {/* Editor de valor mensal para apólices de saúde */}
                        {(policy.type?.toLowerCase().includes('saude') || policy.type?.toLowerCase().includes('saúde')) ? (
                          <MonthlyValueEditor
                            policyId={policy.id}
                            currentValue={policy.monthlyAmount || 0}
                            onUpdate={updatePolicy}
                          />
                        ) : (
                          <p className="font-semibold text-xs sm:text-sm text-green-600 dark:text-green-400 whitespace-nowrap">
                            {moedaBR(policy.monthlyAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-muted-foreground mb-0.5 sm:mb-1">Parcelas</p>
                        <p className="font-medium text-xs sm:text-sm dark:text-foreground">{installmentsCount}x</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-muted-foreground mb-0.5 sm:mb-1">Vencimento</p>
                        <p className={`font-medium text-xs sm:text-sm whitespace-nowrap ${
                          isDatePast(policy.expirationDate || policy.endDate) 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-gray-900 dark:text-foreground'
                        }`}>
                          {formatDatePtBrSafe(policy.expirationDate || policy.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-border">
                    {/* Ação primária: Ver detalhes */}
                    <Button
                      onClick={() => handleViewPolicy(policy)}
                      size="sm"
                      className="flex-1 h-9 gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Ver detalhes
                    </Button>

                    {/* Menu de ações secundárias */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0 shrink-0"
                          title="Mais ações"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        sideOffset={8}
                        className="w-64 p-1.5 rounded-xl border border-border/60 shadow-xl bg-popover/95 backdrop-blur-sm"
                      >
                        {/* Header */}
                        <div className="px-2.5 pt-1.5 pb-2 flex items-center justify-between">
                          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Ações
                          </span>
                        </div>

                        {/* Ações principais */}
                        <div className="space-y-0.5">
                          <DropdownMenuItem
                            onClick={() => handleEditPolicy(policy)}
                            className="rounded-lg px-2 py-2 cursor-pointer focus:bg-accent/70 transition-colors gap-2.5"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/70 text-foreground/80">
                              <Edit className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-sm font-medium">Editar apólice</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleDownloadPolicy(policy)}
                            className="rounded-lg px-2 py-2 cursor-pointer focus:bg-accent/70 transition-colors gap-2.5"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/70 text-foreground/80">
                              <Download className="h-3.5 w-3.5" />
                            </span>
                            <span className="text-sm font-medium">Baixar PDF original</span>
                          </DropdownMenuItem>
                        </div>

                        {(() => {
                          const attached = getDocsForPolicy(policy.id);
                          if (attached.length === 0) return null;
                          return (
                            <>
                              <div className="my-1.5 h-px bg-border/60" />
                              <div className="px-2.5 py-1 flex items-center justify-between">
                                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                  Documentos anexos
                                </span>
                                <span className="text-[10px] font-semibold text-muted-foreground bg-muted/70 rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                                  {attached.length}
                                </span>
                              </div>
                              <div className="space-y-0.5 max-h-48 overflow-y-auto">
                                {attached.map((doc) => (
                                  <DropdownMenuItem
                                    key={doc.id}
                                    onClick={() => downloadAttachedDoc(doc)}
                                    className="rounded-lg px-2 py-1.5 cursor-pointer focus:bg-accent/70 transition-colors gap-2.5"
                                  >
                                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                                      <FileTextIcon className="h-3 w-3" />
                                    </span>
                                    <span className="text-xs font-medium truncate flex-1">{doc.title}</span>
                                    <Download className="h-3 w-3 text-muted-foreground shrink-0" />
                                  </DropdownMenuItem>
                                ))}
                              </div>
                            </>
                          );
                        })()}

                        <div className="my-1.5 h-px bg-border/60" />

                        <DropdownMenuItem
                          onClick={(e) => handleDeleteClick(e as any, policy)}
                          disabled={isDeleting}
                          className="rounded-lg px-2 py-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors gap-2.5"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-sm font-medium">Excluir apólice</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Visualização em Lista */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={currentPolicies.length > 0 && selectedPolicies.size === currentPolicies.length}
                      onCheckedChange={toggleAllPolicies}
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Seguradora</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead className="text-right">Valor Mensal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPolicies.map((policy) => (
                  <TableRow 
                    key={policy.id} 
                    className={`hover:bg-muted/50 ${
                      selectedPolicies.has(policy.id) ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedPolicies.has(policy.id)}
                        onCheckedChange={() => togglePolicySelection(policy.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const originalPolicy = policies.find(p => p.id === policy.id);
                          if (originalPolicy?.documento && isDependentCPF(originalPolicy.documento)) {
                            return (
                              <div 
                                className="shrink-0" 
                                title="Apólice de dependente"
                              >
                                <Link className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                            );
                          }
                          return null;
                        })()}
                        <span className="font-medium">{toText(policy.name)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{toText(policy.insurer)}</TableCell>
                    <TableCell className="font-mono text-sm">{policy.policyNumber}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {moedaBR(policy.monthlyAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_COLORS[policy.status] || STATUS_COLORS.vigente} text-xs`}>
                        {formatStatusText(policy.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={
                        isDatePast(policy.expirationDate || policy.endDate)
                          ? 'text-red-600 font-medium'
                          : ''
                      }>
                        {formatDatePtBrSafe(policy.expirationDate || policy.endDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPolicy(policy)}
                          className="h-8 w-8 p-0"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(() => {
                          const attached = getDocsForPolicy(policy.id);
                          if (attached.length === 0) {
                            return (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPolicy(policy)}
                                className="h-8 w-8 p-0"
                                title="Baixar"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            );
                          }
                          return (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-1.5 gap-0.5"
                                  title={`Baixar (${attached.length + 1} arquivos)`}
                                >
                                  <Download className="h-4 w-4" />
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-64">
                                <DropdownMenuLabel className="text-xs">
                                  {attached.length + 1} arquivo(s) disponível(is)
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDownloadPolicy(policy)}>
                                  <FileTextIcon className="h-4 w-4 mr-2 text-primary" />
                                  <span className="truncate">Apólice (PDF original)</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {attached.map(doc => (
                                  <DropdownMenuItem
                                    key={doc.id}
                                    onClick={() => downloadAttachedDoc(doc)}
                                  >
                                    <FileTextIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span className="truncate">{doc.title}</span>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          );
                        })()}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPolicy(policy)}
                          className="h-8 w-8 p-0"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteClick(e, policy)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          title="Deletar"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}

      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />

      <NewPolicyManualModal
        open={showNewPolicyModal}
        onOpenChange={setShowNewPolicyModal}
        onSuccess={refreshPolicies}
      />

      <PolicyDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPolicy(null);
        }}
        policy={selectedPolicy}
        onDelete={async (policyId) => {
          const success = await deletePolicy(policyId);
          if (success) {
            toast({
              title: "✅ Apólice Deletada",
              description: "A apólice foi removida com sucesso",
            });
            refreshPolicies();
          }
        }}
        onUpdate={refreshPolicies}
      />

      <PolicyEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedPolicy(null);
        }}
        policy={selectedPolicy}
        onSave={handleSaveEdit}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open && !isDeleting) {
          handleCancelDelete();
        }
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground space-y-3">
              <p>
                Tem certeza que deseja excluir a apólice <strong className="text-foreground">"{policyToDelete?.name}"</strong>?
              </p>
              <p className="text-xs">
                Esta ação não pode ser desfeita. Todos os dados relacionados a esta apólice, incluindo parcelas e coberturas, serão permanentemente removidos.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={handleCancelDelete} 
              disabled={isDeleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Excluindo...
                </div>
              ) : (
                "Excluir Apólice"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ManageCPFVinculosModal
        open={showManageCPFModal}
        onOpenChange={setShowManageCPFModal}
        onCPFsUpdated={handleCPFsUpdated}
      />
    </div>
  );
}
