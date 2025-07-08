
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Building, User } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface NewPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: (policy: any) => void;
  policy: {
    name: string;
    insurer: string;
    value: number;
    dueDate: string;
    insertDate: string;
    type?: string;
    status?: string;
    // Adicionar campos de cobertura
    coberturas?: Array<{
      descricao: string;
      lmi?: number;
    }>;
  } | null;
}

export function NewPolicyModal({ isOpen, onClose, onViewDetails, policy }: NewPolicyModalProps) {
  if (!policy) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case 'ativa':
      case 'active':
        return <Badge className="bg-green-50 text-green-600 border-green-200">Ativa</Badge>;
      case 'vencendo':
      case 'expiring':
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200">Vencendo</Badge>;
      case 'vencida':
      case 'expired':
        return <Badge className="bg-red-50 text-red-600 border-red-200">Vencida</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewDetails = () => {
    onViewDetails(policy);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Nova Apólice
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Primeira coluna - Informações básicas */}
          <div className="space-y-6">
            {/* Nome da Apólice */}
            <div className="text-center lg:text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {policy.name}
              </h3>
              {policy.status && (
                <div className="flex justify-center lg:justify-start">
                  {getStatusBadge(policy.status)}
                </div>
              )}
            </div>

            {/* Informações principais */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Building className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">Seguradora</p>
                  <p className="font-medium text-gray-900 truncate">{policy.insurer}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">Valor</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(policy.value)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">Data de Inserção</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(policy.insertDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">Vencimento</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(policy.dueDate)}
                  </p>
                </div>
              </div>

              {policy.type && (
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-500">Tipo</p>
                    <p className="font-medium text-gray-900">{policy.type}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Segunda coluna - Coberturas */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Coberturas</h4>
              {policy.coberturas && policy.coberturas.length > 0 ? (
                <div className="space-y-3">
                  {policy.coberturas.map((cobertura, index) => (
                    <div 
                      key={index}
                      className="bg-blue-50 rounded-lg p-4 border border-blue-100"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-sm font-medium text-gray-800 leading-relaxed">
                          {cobertura.descricao}
                        </span>
                        {cobertura.lmi && (
                          <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap">
                            LMI: {formatCurrency(cobertura.lmi)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    Coberturas não informadas
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t px-6 pb-6">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Fechar
          </Button>
          <Button onClick={handleViewDetails} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
            Ver Detalhes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
