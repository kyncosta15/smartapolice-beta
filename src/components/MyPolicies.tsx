
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
import { Trash2 } from 'lucide-react';
import { PolicyStatus } from '@/types/policyStatus';
import { STATUS_COLORS, formatStatusText } from '@/utils/statusColors';
import { useRenewalChecker } from '@/hooks/useRenewalChecker';
import { RenewalModal } from '@/components/RenewalModal';
import { InfoModal } from '@/components/InfoModal';
import { formatCurrency } from '@/utils/currencyFormatter';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { usePolicyNormalization } from '@/hooks/usePolicyNormalization';
import { useToast } from '@/hooks/use-toast';

export function MyPolicies() {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { policies, updatePolicy, deletePolicy, refreshPolicies } = usePersistedPolicies();
  const { toast } = useToast();

  // Normalizar políticas para renderização segura
  const normalizedPolicies = usePolicyNormalization(policies);
  
  console.log('🎯 MyPolicies - Políticas normalizadas:', normalizedPolicies.length);
  
  // Converter para formato esperado pelo useRenewalChecker
  const policiesWithStatus = normalizedPolicies.map(policy => ({
    id: policy.id,
    name: policy.name,
    insurer: policy.insurer,
    policyNumber: policy.policyNumber,
    type: policy.type,
    monthlyAmount: policy.monthlyAmount,
    startDate: policy.startDate,
    endDate: policy.endDate,
    expirationDate: policy.expirationDate,
    status: policy.status as PolicyStatus
  }));
  
  const renewalAlert = useRenewalChecker(policiesWithStatus);

  const handleRenewalDecision = async (policy: any, newStatus: PolicyStatus) => {
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

  const handleDeleteClick = (e: React.MouseEvent, policy: any) => {
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

  // Renderização segura com validação
  if (!normalizedPolicies || normalizedPolicies.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Minhas Apólices</h2>
          <Badge variant="secondary">0 apólices</Badge>
        </div>
        
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhuma apólice encontrada</p>
          <p className="text-sm text-gray-400 mt-2">
            Faça upload de seus documentos para começar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Minhas Apólices</h2>
        <Badge variant="secondary">
          {normalizedPolicies.length} apólice{normalizedPolicies.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {normalizedPolicies.map((policy) => {
          console.log(`🎯 [MyPolicies-Render] Renderizando ${policy.name} com status: ${policy.status}`);
          
          return (
            <Card key={policy.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{policy.name || 'Nome não informado'}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_COLORS[policy.status as PolicyStatus] || STATUS_COLORS.vigente}>
                      {formatStatusText(policy.status as PolicyStatus)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteClick(e, policy)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Deletar apólice"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{policy.insurer || 'Seguradora não informada'}</p>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Número</p>
                    <p className="font-medium">{policy.policyNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Valor Mensal</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(policy.monthlyAmount || 0)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Parcelas</p>
                    <p className="font-medium">{policy.installmentsCount || 0}x</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Vencimento</p>
                    <p className={`font-medium ${
                      policy.expirationDate && new Date(policy.expirationDate) < new Date() 
                        ? 'text-red-600' 
                        : 'text-gray-900'
                    }`}>
                      {policy.expirationDate 
                        ? new Date(policy.expirationDate).toLocaleDateString('pt-BR')
                        : 'Não informado'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
              Tem certeza que deseja deletar a apólice <strong>"{policyToDelete?.name || 'N/A'}"</strong>?
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
