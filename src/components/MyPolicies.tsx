

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  const itemsPerPage = 10;
  const { policies, updatePolicy, deletePolicy, refreshPolicies } = usePersistedPolicies();
  const { toast } = useToast();
  
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

    try {
      const response = await fetch(originalPolicy.pdfPath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${policy.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download iniciado",
        description: `Baixando ${policy.name}`,
      });
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo",
        variant: "destructive",
      });
    }
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
    <div className="space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Minhas Apólices</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="text-sm">
            {policiesWithStatus.length} apólice{policiesWithStatus.length !== 1 ? 's' : ''}
          </Badge>
          
          {/* Toggle de visualização */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setViewMode('cards');
                setCurrentPage(1);
              }}
              className="rounded-r-none h-9"
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
              className="rounded-l-none h-9"
              title="Visualizar em lista"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={() => setShowNewPolicyModal(true)}
            className="gap-2 h-9 sm:h-10 px-3 sm:px-4 whitespace-nowrap bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg active:shadow-sm active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 transition-all duration-200 rounded-md font-medium"
          >
            <Plus className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline text-sm">Nova Apólice</span>
            <span className="sm:hidden text-sm">Nova</span>
          </Button>
        </div>
      </div>

      {/* Visualização em Cards */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {currentPolicies.map((policy) => {
            const originalPolicy = policies.find(p => p.id === policy.id);
            const installmentsCount = originalPolicy?.quantidade_parcelas || 
                                    originalPolicy?.installments?.length || 
                                    12;
            
            console.log(`🎯 [MyPolicies-Render] Renderizando ${policy.name} com status: ${policy.status}`);
            
            return (
              <Card key={policy.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <CardTitle className="text-base sm:text-lg leading-tight break-words flex-1 min-w-0">
                      {toText(policy.name)}
                    </CardTitle>
                    <Badge className={`${STATUS_COLORS[policy.status] || STATUS_COLORS.vigente} shrink-0 text-xs whitespace-nowrap`}>
                      {formatStatusText(policy.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{toText(policy.insurer)}</p>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Número</p>
                        <p className="font-medium text-sm break-all leading-tight">{policy.policyNumber}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-500 mb-1">Valor Mensal</p>
                        <p className="font-semibold text-sm text-green-600 whitespace-nowrap">
                          {moedaBR(policy.monthlyAmount)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Parcelas</p>
                        <p className="font-medium text-sm">{installmentsCount}x</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Vencimento</p>
                        <p className={`font-medium text-sm whitespace-nowrap ${
                          new Date(policy.expirationDate || policy.endDate) < new Date() 
                            ? 'text-red-600' 
                            : 'text-gray-900'
                        }`}>
                          {new Date(policy.expirationDate || policy.endDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5 pt-3 border-t justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewPolicy(policy)}
                      className="h-9 w-9 p-0 hover:bg-primary/10"
                      title="Visualizar apólice"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadPolicy(policy)}
                      className="h-9 w-9 p-0 hover:bg-primary/10"
                      title="Baixar apólice"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPolicy(policy)}
                      className="h-9 w-9 p-0 hover:bg-primary/10"
                      title="Editar apólice"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(e, policy)}
                      className="h-9 w-9 p-0 hover:bg-red-50 hover:text-red-600"
                      title="Deletar apólice"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
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
                  <TableRow key={policy.id} className="hover:bg-muted/50">
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
            <AlertDialogTitle className="text-lg font-semibold text-red-600">
              ⚠️ Confirmar Deleção
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600">
              Tem certeza que deseja deletar a apólice <strong>"{policyToDelete?.name}"</strong>?
              <br /><br />
              <span className="text-red-600 font-medium">
                Esta ação não pode ser desfeita.
              </span> Todos os dados relacionados a esta apólice, incluindo parcelas e coberturas, serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              onClick={handleCancelDelete} 
              disabled={isDeleting}
              className="border-gray-300"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deletando...
                </div>
              ) : (
                "🗑️ Deletar Apólice"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
