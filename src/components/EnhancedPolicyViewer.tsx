
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, AlertTriangle, TrendingUp, Eye, Download, Trash2 } from 'lucide-react';
import { PolicyDetailsModal } from './PolicyDetailsModal';
import { formatCurrency } from '@/utils/currencyFormatter';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';

interface EnhancedPolicyViewerProps {
  policies: any[];
  onPolicyClick?: (policy: any) => void;
}

export function EnhancedPolicyViewer({ policies, onPolicyClick }: EnhancedPolicyViewerProps) {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsPolicy, setDetailsPolicy] = useState<any>(null);
  
  const { deletePolicy, downloadPDF } = usePersistedPolicies();

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

  const handleViewDetails = (policy: any) => {
    setDetailsPolicy(policy);
    setIsDetailsModalOpen(true);
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta apólice?')) {
      await deletePolicy(policyId);
    }
  };

  const handleDownloadPDF = async (policyId: string, policyName: string) => {
    await downloadPDF(policyId, policyName);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Apólices</h2>
          <p className="text-sm text-gray-600">
            {policies.length} apólice{policies.length !== 1 ? 's' : ''} encontrada{policies.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Cards Grid - Horizontal Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {policies.map((policy, index) => (
          <Card 
            key={policy.id || index} 
            className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-blue-600"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                    {policy.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1 truncate">
                    {policy.insurer}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {getStatusBadge(policy.status)}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Valor */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">Prêmio Anual</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(policy.premium)}
                  </p>
                </div>
              </div>

              {/* Vencimento */}
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-500">Vencimento</p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(policy.endDate)}
                  </p>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-0"
                  onClick={() => handleViewDetails(policy)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                
                {policy.pdfPath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadPDF(policy.id, policy.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeletePolicy(policy.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Details Modal */}
      <PolicyDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        policy={detailsPolicy}
        onDelete={handleDeletePolicy}
      />
    </div>
  );
}
