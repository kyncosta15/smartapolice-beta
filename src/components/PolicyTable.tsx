
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { PolicyEditModal } from './PolicyEditModal';
import { renderValueAsString } from '@/utils/renderValue';
import { toDisplay } from '@/lib/policies';

interface PolicyTableProps {
  searchTerm: string;
  filterType: string;
  onPolicySelect: (policy: any) => void;
  extractedPolicies: any[];
  onPolicyUpdate: (updatedPolicy: any) => void;
  onPolicyDelete: (policyId: string) => void;
}

export const PolicyTable = ({ 
  searchTerm, 
  filterType, 
  onPolicySelect, 
  extractedPolicies,
  onPolicyUpdate,
  onPolicyDelete
}: PolicyTableProps) => {
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const mockPolicies = [
    {
      id: '1',
      name: 'Seguro Auto Civic',
      type: 'auto',
      insurer: 'Porto Seguro',
      premium: 14400,
      monthlyAmount: 1200,
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      policyNumber: 'PS-2024-001234',
      category: 'Veicular',
      entity: 'Pessoa Física',
      coverage: ['Cobertura Compreensiva', 'Responsabilidade Civil'],
      paymentForm: 'Mensal',
      installments: 12,
      deductible: 2500,
      limits: 'R$ 150.000 por sinistro'
    },
    {
      id: '2',
      name: 'Seguro Residencial Plus',
      type: 'patrimonial',
      insurer: 'Mapfre',
      premium: 10206,
      monthlyAmount: 850.50,
      status: 'expiring',
      startDate: '2023-08-20',
      endDate: '2024-08-20',
      policyNumber: 'MF-2023-005678',
      category: 'Imóvel',
      entity: 'Pessoa Física',
      coverage: ['Incêndio', 'Roubo', 'Danos Elétricos'],
      paymentForm: 'Mensal',
      installments: 12,
      deductible: 1500,
      limits: 'R$ 200.000 por sinistro'
    }
  ];

  const allPolicies = [...mockPolicies, ...extractedPolicies];

  const filteredPolicies = allPolicies.filter(policy => {
    const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.insurer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || policy.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50">Ativa</Badge>;
      case 'expiring':
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50">Vencendo</Badge>;
      case 'expired':
        return <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">Vencida</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50">Em Análise</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const handleEdit = (policy: any) => {
    setEditingPolicy(policy);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedPolicy: any) => {
    onPolicyUpdate(updatedPolicy);
    setIsEditModalOpen(false);
    setEditingPolicy(null);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Apólices Cadastradas</h3>
          <p className="text-sm text-gray-500 mt-1">Gerencie todas as suas apólices</p>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-100">
                <TableHead className="font-semibold text-gray-700">Apólice</TableHead>
                <TableHead className="font-semibold text-gray-700">Seguradora</TableHead>
                <TableHead className="font-semibold text-gray-700">Tipo</TableHead>
                <TableHead className="font-semibold text-gray-700">Valor Mensal</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Vigência</TableHead>
                <TableHead className="font-semibold text-gray-700 text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.map((policy) => (
                <TableRow key={policy.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <div>
                       <p className="font-medium text-gray-900">{toDisplay(policy.name)}</p>
                       <p className="text-sm text-gray-500">{toDisplay(policy.policyNumber)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-700">{toDisplay(policy.insurer)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                      {policy.type === 'auto' ? 'Auto' : 
                       policy.type === 'vida' ? 'Vida' : 
                       policy.type === 'saude' ? 'Saúde' : 
                       policy.type === 'empresarial' ? 'Empresarial' :
                       policy.type === 'patrimonial' ? 'Patrimonial' : 'Outros'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-gray-900">
                      R$ {policy.monthlyAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(policy.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-gray-900">{new Date(policy.startDate).toLocaleDateString('pt-BR')}</p>
                      <p className="text-gray-500">até {new Date(policy.endDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPolicySelect(policy)}
                        className="hover:bg-blue-50 hover:text-blue-600 h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(policy)}
                        className="hover:bg-green-50 hover:text-green-600 h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPolicyDelete(policy.id)}
                        className="hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
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
      </div>

      <PolicyEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        policy={editingPolicy}
        onSave={handleSaveEdit}
      />
    </>
  );
};
