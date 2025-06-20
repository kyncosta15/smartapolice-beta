import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface PolicyTableProps {
  searchTerm: string;
  filterType: string;
  onPolicySelect: (policy: any) => void;
  extractedPolicies: any[];
}

export const PolicyTable = ({ searchTerm, filterType, onPolicySelect, extractedPolicies }: PolicyTableProps) => {
  const mockPolicies = [
    {
      id: '1',
      name: 'Seguro Auto Civic',
      type: 'auto',
      insurer: 'Porto Seguro',
      premium: 1200.00,
      status: 'active',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      policyNumber: 'PS-2024-001234'
    },
    {
      id: '2',
      name: 'Seguro Residencial',
      type: 'patrimonial',
      insurer: 'Mapfre',
      premium: 850.50,
      status: 'expiring',
      startDate: '2023-08-20',
      endDate: '2024-08-20',
      policyNumber: 'MF-2023-005678'
    },
    {
      id: '3',
      name: 'Seguro de Vida Plus',
      type: 'vida',
      insurer: 'Bradesco Seguros',
      premium: 2500.00,
      status: 'active',
      startDate: '2024-03-01',
      endDate: '2025-03-01',
      policyNumber: 'BS-2024-009012'
    },
    {
      id: '4',
      name: 'Seguro Saúde Essencial',
      type: 'saude',
      insurer: 'Amil',
      premium: 3800.00,
      status: 'under_review',
      startDate: '2024-02-10',
      endDate: '2025-02-10',
      policyNumber: 'AM-2024-003456'
    },
    {
      id: '5',
      name: 'Seguro Empresarial Top',
      type: 'empresarial',
      insurer: 'Allianz',
      premium: 5200.00,
      status: 'active',
      startDate: '2023-11-05',
      endDate: '2024-11-05',
      policyNumber: 'AL-2023-007890'
    },
    {
      id: '6',
      name: 'Seguro Auto Moto',
      type: 'auto',
      insurer: 'SulAmérica',
      premium: 950.00,
      status: 'expired',
      startDate: '2022-12-15',
      endDate: '2023-12-15',
      policyNumber: 'SA-2022-002345'
    },
    {
      id: '7',
      name: 'Seguro de Vida Individual',
      type: 'vida',
      insurer: 'Itaú Seguros',
      premium: 1800.00,
      status: 'active',
      startDate: '2024-04-01',
      endDate: '2025-04-01',
      policyNumber: 'IT-2024-006789'
    },
    {
      id: '8',
      name: 'Seguro Saúde Família',
      type: 'saude',
      insurer: 'Unimed',
      premium: 6000.00,
      status: 'active',
      startDate: '2024-01-20',
      endDate: '2025-01-20',
      policyNumber: 'UM-2024-000123'
    },
    {
      id: '9',
      name: 'Seguro Residencial Plus',
      type: 'patrimonial',
      insurer: 'Liberty Seguros',
      premium: 1100.00,
      status: 'expiring',
      startDate: '2023-09-10',
      endDate: '2024-09-10',
      policyNumber: 'LB-2023-004567'
    },
    {
      id: '10',
      name: 'Seguro Empresarial Master',
      type: 'empresarial',
      insurer: 'HDI Seguros',
      premium: 7500.00,
      status: 'active',
      startDate: '2024-03-15',
      endDate: '2025-03-15',
      policyNumber: 'HD-2024-008901'
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
        return <Badge className="bg-green-100 text-green-700">Ativa</Badge>;
      case 'expiring':
        return <Badge className="bg-orange-100 text-orange-700">Vencendo</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700">Vencida</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-700">Em Análise</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <div className="rounded-lg border bg-white/70 backdrop-blur-sm shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Apólice</TableHead>
            <TableHead>Seguradora</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Prêmio</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Vigência</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPolicies.map((policy) => (
            <TableRow key={policy.id} className="hover:bg-blue-50/50">
              <TableCell>
                <div>
                  <p className="font-medium">{policy.name}</p>
                  <p className="text-sm text-gray-500">{policy.policyNumber}</p>
                </div>
              </TableCell>
              <TableCell>{policy.insurer}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {policy.type === 'auto' ? 'Auto' : 
                   policy.type === 'vida' ? 'Vida' : 
                   policy.type === 'saude' ? 'Saúde' : 'Outros'}
                </Badge>
              </TableCell>
              <TableCell>R$ {policy.premium?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
              <TableCell>{getStatusBadge(policy.status)}</TableCell>
              <TableCell>
                <div className="text-sm">
                  <p>{new Date(policy.startDate).toLocaleDateString('pt-BR')}</p>
                  <p className="text-gray-500">até {new Date(policy.endDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPolicySelect(policy)}
                    className="hover:bg-blue-100"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
