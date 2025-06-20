
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

interface Policy {
  id: string;
  name: string;
  type: string;
  insurer: string;
  policyNumber: string;
  category: string;
  premium: number;
  coverage: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'expiring' | 'expired' | 'under_review';
  entity: string;
}

interface PolicyTableProps {
  searchTerm: string;
  filterType: string;
  onPolicySelect: (policy: Policy) => void;
}

export const PolicyTable = ({ searchTerm, filterType, onPolicySelect }: PolicyTableProps) => {
  const [policies] = useState<Policy[]>([
    {
      id: '1',
      name: 'Seguro Frota Executiva',
      type: 'auto',
      insurer: 'Porto Seguro',
      policyNumber: 'PS-2024-001847',
      category: 'Frota',
      premium: 12450.00,
      coverage: 'Compreensiva',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      status: 'active',
      entity: 'Matriz - São Paulo'
    },
    {
      id: '2',
      name: 'Seguro de Vida Colaboradores',
      type: 'vida',
      insurer: 'SulAmérica',
      policyNumber: 'SA-2024-009832',
      category: 'Pessoal',
      premium: 8750.00,
      coverage: 'Morte/Invalidez',
      startDate: '2024-03-01',
      endDate: '2025-03-01',
      status: 'active',
      entity: 'Grupo Empresarial'
    },
    {
      id: '3',
      name: 'Seguro Patrimonial Sede',
      type: 'patrimonial',
      insurer: 'Bradesco Seguros',
      policyNumber: 'BS-2024-005671',
      category: 'Imóvel',
      premium: 15200.00,
      coverage: 'Incêndio/Roubo',
      startDate: '2024-02-10',
      endDate: '2025-02-10',
      status: 'expiring',
      entity: 'Filial - Rio de Janeiro'
    },
    {
      id: '4',
      name: 'Seguro Responsabilidade Civil',
      type: 'empresarial',
      insurer: 'Allianz',
      policyNumber: 'AL-2024-003421',
      category: 'Operacional',
      premium: 9800.00,
      coverage: 'RC Geral',
      startDate: '2024-04-01',
      endDate: '2025-04-01',
      status: 'under_review',
      entity: 'Matriz - São Paulo'
    },
    {
      id: '5',
      name: 'Plano de Saúde Executivo',
      type: 'saude',
      insurer: 'Amil',
      policyNumber: 'AM-2024-007845',
      category: 'Pessoal',
      premium: 22100.00,
      coverage: 'Nacional',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'expiring',
      entity: 'Diretoria'
    }
  ]);

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.insurer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || policy.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ativa
        </Badge>;
      case 'expiring':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
          <Calendar className="h-3 w-3 mr-1" />
          Vencendo
        </Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Vencida
        </Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Eye className="h-3 w-3 mr-1" />
          Em Análise
        </Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      auto: 'Seguro Auto',
      vida: 'Seguro de Vida',
      saude: 'Seguro Saúde',
      empresarial: 'Empresarial',
      patrimonial: 'Patrimonial'
    };
    return types[type] || type;
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gestão de Apólices</span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {filteredPolicies.length} apólices encontradas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-white/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apólice</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Seguradora</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Prêmio Mensal</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.map((policy) => (
                <TableRow key={policy.id} className="hover:bg-white/70">
                  <TableCell>
                    <div>
                      <div className="font-medium">{policy.name}</div>
                      <div className="text-sm text-gray-500">{policy.entity}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50">
                      {getTypeLabel(policy.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{policy.insurer}</TableCell>
                  <TableCell className="font-mono text-sm">{policy.policyNumber}</TableCell>
                  <TableCell className="font-medium">
                    R$ {(policy.premium / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{new Date(policy.endDate).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{getStatusBadge(policy.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onPolicySelect(policy)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
