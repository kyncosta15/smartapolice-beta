

import React, { useState } from 'react';
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
import { Trash2, Plus, Eye, Download, Edit, LayoutGrid, List, RefreshCw, Filter, FileDown } from 'lucide-react';
import { NewPolicyManualModal } from './NewPolicyManualModal';
import { PolicyDetailsModal } from './PolicyDetailsModal';
import { PolicyEditModal } from './PolicyEditModal';
import { PolicyWithStatus, PolicyStatus } from '@/types/policyStatus';
import { STATUS_COLORS, formatStatusText } from '@/utils/statusColors';
import { InfoModal } from '@/components/InfoModal';
import { formatCurrency } from '@/utils/currencyFormatter';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { useToast } from '@/hooks/use-toast';
// DESABILITADO: import { useInfoCapSync } from '@/hooks/useInfoCapSync';
import { usePdfExtraction } from '@/hooks/usePdfExtraction';
import { renderValue, renderValueAsString, renderCurrency } from '@/utils/renderValue';
import { toText, moedaBR } from '@/lib/policies';
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

export function MyPolicies() {
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
  const [statusFilter, setStatusFilter] = useState<'todas' | 'vigentes' | 'antigas'>('vigentes');
  const [detailedStatusFilter, setDetailedStatusFilter] = useState<'todas' | 'ativa' | 'pendente_analise' | 'vencida'>('todas');
  const itemsPerPage = 10;
  const { policies, updatePolicy, deletePolicy, refreshPolicies, downloadPDF } = usePersistedPolicies();
  const { toast } = useToast();
  // DESABILITADO: const { isSyncing: isInfoCapSyncing } = useInfoCapSync();
  const { isProcessing: isPdfProcessing, extractFromPolicy } = usePdfExtraction();
  
  const policiesWithStatus: PolicyWithStatus[] = policies.map(policy => {
    const finalStatus = policy.status as PolicyStatus;
    
    console.log(`✅ [MyPolicies] Apólice ${toText(policy.name)}: status do banco = ${finalStatus}`);
    
    return {
      id: policy.id,
      name: toText(policy.name),
      insurer: toText(policy.insurer),
      policyNumber: toText(policy.policyNumber),
      type: toText(policy.type),
      monthlyAmount: typeof policy.monthlyAmount === 'number' ? policy.monthlyAmount : 0,
      startDate: policy.startDate,
      endDate: policy.endDate,
      expirationDate: policy.expirationDate || policy.endDate,
      status: finalStatus,
      nosnum: policy.nosnum,
      codfil: policy.codfil,
    };
  });

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
      }
    } catch (error) {
      console.error('❌ [handleConfirmDelete] Erro:', error);
      toast({
        title: "❌ Erro ao Deletar",
        description: "Ocorreu um erro ao deletar a apólice",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTestExtraction = async (policy: PolicyWithStatus) => {
    if (!policy.nosnum || !policy.codfil) {
      toast({
        title: "Dados insuficientes",
        description: "Esta apólice não possui nosnum/codfil para buscar o PDF",
        variant: "destructive"
      });
      return;
    }

    const result = await extractFromPolicy(policy.id, policy.nosnum, policy.codfil);
    
    if (result.success) {
      // Recarregar apólices após extração bem-sucedida
      setTimeout(() => refreshPolicies(), 1000);
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

  const handleViewPolicy = (policy: PolicyWithStatus) => {
    const originalPolicy = policies.find(p => p.id === policy.id);
    setSelectedPolicy(originalPolicy || policy);
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
    
    // DESABILITADO: Download via API CorpNuvem/InfoCap
    // Agora usa apenas o arquivo PDF armazenado localmente no Supabase
    /*
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
    */
    
    // Usar arquivo PDF armazenado localmente no Supabase
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
      console.log('💾 Salvando apólice editada:', {
        id: updatedPolicy.id,
        name: updatedPolicy.name,
        monthlyAmount: updatedPolicy.monthlyAmount,
        custo_mensal: updatedPolicy.custo_mensal,
        premium: updatedPolicy.premium
      });
      
      const success = await updatePolicy(updatedPolicy.id, updatedPolicy);
      
      if (success) {
        console.log('✅ Update bem-sucedido, recarregando dados...');
        
        // Aguardar um pouco para garantir que o banco foi atualizado
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Recarregar dados do banco para garantir valores atualizados
        await refreshPolicies();
        
        console.log('✅ Dados recarregados do banco');
        
        toast({
          title: "✅ Alterações Salvas",
          description: "A apólice foi atualizada e os valores foram sincronizados",
        });
      } else {
        toast({
          title: "❌ Erro ao Salvar",
          description: "Não foi possível atualizar a apólice",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao salvar edição:', error);
      toast({
        title: "❌ Erro",
        description: "Ocorreu um erro ao salvar as alterações",
        variant: "destructive",
      });
    } finally {
      setShowEditModal(false);
      setSelectedPolicy(null);
    }
  };

  // Filtrar apólices por status baseado no ano atual
  const currentYear = new Date().getFullYear();
  
  const filteredPolicies = policiesWithStatus.filter(policy => {
    // Filtro por período (vigentes/antigas)
    if (statusFilter !== 'todas') {
      const endDate = new Date(policy.endDate);
      const endYear = endDate.getFullYear();
      
      if (statusFilter === 'vigentes') {
        // Vigentes: ano >= atual E status ativo (excluindo não renovadas e vencidas)
        const isActiveStatus = policy.status === 'vigente' || 
                              policy.status === 'ativa' || 
                              policy.status === 'vencendo';
        if (endYear < currentYear || !isActiveStatus) return false;
      }
      
      if (statusFilter === 'antigas') {
        // Antigas: ano < atual OU status inativo (não renovada, vencida)
        const isInactiveStatus = policy.status === 'nao_renovada' || 
                                policy.status === 'vencida';
        if (endYear >= currentYear && !isInactiveStatus) return false;
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
    
    return true;
  });

  // Paginação
  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPolicies = viewMode === 'list' 
    ? filteredPolicies.slice(startIndex, endIndex)
    : filteredPolicies;

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
        
        {/* Toggle de visualização + Botão Nova Apólice */}
        <div className="flex items-center gap-2">
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

      {/* Filtro de Período */}
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
            const endYear = new Date(p.endDate).getFullYear();
            const isActiveStatus = p.status === 'vigente' || 
                                  p.status === 'ativa' || 
                                  p.status === 'vencendo';
            return endYear >= currentYear && isActiveStatus;
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
            const endYear = new Date(p.endDate).getFullYear();
            const isInactiveStatus = p.status === 'nao_renovada' || p.status === 'vencida';
            return endYear < currentYear || isInactiveStatus;
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
            
            return (
              <Card key={policy.id} className="hover:shadow-lg transition-shadow overflow-hidden dark:bg-card dark:border-border">
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6 space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between items-start gap-2 sm:gap-3">
                    <CardTitle className="text-sm sm:text-base md:text-lg leading-tight break-words flex-1 min-w-0 dark:text-foreground">
                      {toText(policy.name)}
                    </CardTitle>
                    <Badge className={`${STATUS_COLORS[policy.status] || STATUS_COLORS.vigente} shrink-0 text-[10px] sm:text-xs whitespace-nowrap px-1.5 sm:px-2 py-0.5`}>
                      {formatStatusText(policy.status)}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-muted-foreground truncate">{toText(policy.insurer)}</p>
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
                        <p className="font-semibold text-xs sm:text-sm text-green-600 dark:text-green-400 whitespace-nowrap">
                          {moedaBR(policy.monthlyAmount)}
                        </p>
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
                          new Date(policy.expirationDate || policy.endDate) < new Date() 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-gray-900 dark:text-foreground'
                        }`}>
                          {new Date(policy.expirationDate || policy.endDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1 sm:gap-1.5 pt-2 sm:pt-3 border-t dark:border-border justify-end">
                    {policy.nosnum && policy.codfil && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestExtraction(policy)}
                        className="h-7 w-7 sm:h-9 sm:w-9 p-0 hover:bg-green-50 dark:hover:bg-green-950/30 hover:text-green-600 dark:hover:text-green-400"
                        title="Testar extração de PDF"
                        disabled={isPdfProcessing}
                      >
                        <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewPolicy(policy)}
                      className="h-7 w-7 sm:h-9 sm:w-9 p-0 hover:bg-primary/10 dark:hover:bg-primary/20"
                      title="Visualizar apólice"
                    >
                      <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadPolicy(policy)}
                      className="h-7 w-7 sm:h-9 sm:w-9 p-0 hover:bg-primary/10 dark:hover:bg-primary/20"
                      title="Baixar apólice"
                    >
                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPolicy(policy)}
                      className="h-7 w-7 sm:h-9 sm:w-9 p-0 hover:bg-primary/10 dark:hover:bg-primary/20"
                      title="Editar apólice"
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(e, policy)}
                      className="h-7 w-7 sm:h-9 sm:w-9 p-0 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                      title="Deletar apólice"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
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
                    <TableCell className="font-medium">{toText(policy.name)}</TableCell>
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
                        new Date(policy.expirationDate || policy.endDate) < new Date() 
                          ? 'text-red-600 font-medium' 
                          : ''
                      }>
                        {new Date(policy.expirationDate || policy.endDate).toLocaleDateString('pt-BR')}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPolicy(policy)}
                          className="h-8 w-8 p-0"
                          title="Baixar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
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
    </div>
  );
}
