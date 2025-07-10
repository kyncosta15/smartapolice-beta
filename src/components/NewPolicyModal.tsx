
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Building, User, X } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface NewPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: {
    name: string;
    insurer: string;
    value: number;
    dueDate: string;
    insertDate: string;
    type?: string;
    status?: string;
  } | null;
}

export function NewPolicyModal({ isOpen, onClose, policy }: NewPolicyModalProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Nova Apólice
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-6">
          {/* Nome da Apólice */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {policy.name}
            </h3>
            {policy.status && (
              <div className="flex justify-center">
                {getStatusBadge(policy.status)}
              </div>
            )}
          </div>

          {/* Informações principais */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Building className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Seguradora</p>
                <p className="font-medium text-gray-900">{policy.insurer}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Valor</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(policy.value)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-500">Data de Inserção</p>
                <p className="font-medium text-gray-900">
                  {formatDate(policy.insertDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-500">Vencimento</p>
                <p className="font-medium text-gray-900">
                  {formatDate(policy.dueDate)}
                </p>
              </div>
            </div>

            {policy.type && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Tipo</p>
                  <p className="font-medium text-gray-900">{policy.type}</p>
                </div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={onClose}>
              Ver Detalhes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
