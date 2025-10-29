

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
import { Trash2, Plus, Eye, Download, Edit, LayoutGrid, List } from 'lucide-react';
import { NewPolicyManualModal } from './NewPolicyManualModal';
import { PolicyDetailsModal } from './PolicyDetailsModal';
import { PolicyEditModal } from './PolicyEditModal';
import { PolicyWithStatus, PolicyStatus } from '@/types/policyStatus';
import { STATUS_COLORS, formatStatusText } from '@/utils/statusColors';
import { useRenewalChecker } from '@/hooks/useRenewalChecker';
import { RenewalModal } from '@/components/RenewalModal';
import { InfoModal } from '@/components/InfoModal';
import { formatCurrency } from '@/utils/currencyFormatter';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { useToast } from '@/hooks/use-toast';
import { useInfoCapSync } from '@/hooks/useInfoCapSync';
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
  const itemsPerPage = 10;
  const { policies, updatePolicy, deletePolicy, refreshPolicies, downloadPDF } = usePersistedPolicies();
  const { toast } = useToast();
  const { isSyncing: isInfoCapSyncing } = useInfoCapSync();
  
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
      status: finalStatus
    };
  });
  
  const renewalAlert = useRenewalChecker(policiesWithStatus);

  const handleRenewalDecision = async (policy: PolicyWithStatus, newStatus: PolicyStatus) => {
    console.log(`🔄 [handleRenewalDecision] Atualizando status: ${policy.id} -> ${newStatus}`);
    
    const updateSuccess = await updatePolicy(policy.id, { status: newStatus });
    
    if (updateSuccess) {
      toast({
        title: "✅ Status Atualizado",
        description: `Status da apólice alterado para: ${formatStatusText(newStatus)}`,
      });
    }

    if (newStatus === "aguardando_emissao") {
      setShowInfoModal(true);
    }

    renewalAlert?.clear();
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

  const handleViewPolicy = (policy: PolicyWithStatus) => {
    const originalPolicy = policies.find(p => p.id === policy.id);
    setSelectedPolicy(originalPolicy || policy);
    setShowDetailsModal(true);
  };

  const handleDownloadPolicy = async (policy: PolicyWithStatus) => {
    const originalPolicy = policies.find(p => p.id === policy.id);
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

  // Paginação
  const totalPages = Math.ceil(policiesWithStatus.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPolicies = viewMode === 'list' 
    ? policiesWithStatus.slice(startIndex, endIndex)
    : policiesWithStatus;

  return (
    <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-0">
      <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
        {/* Título + Badge */}
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-foreground">Minhas Apólices</h2>
          <Badge variant="secondary" className="text-xs sm:text-sm shrink-0">
            {policiesWithStatus.length}
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
                                    12;
            
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

      {renewalAlert && (
        <RenewalModal
          policy={renewalAlert.toRenew}
          onDecision={(newStatus) => handleRenewalDecision(renewalAlert.toRenew, newStatus)}
          onClose={renewalAlert.clear}
        />
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
