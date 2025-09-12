import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserPlus, 
  Search, 
  Calendar,
  Building,
  Phone,
  Mail,
  Heart,
  UserCheck,
  UserX
} from 'lucide-react';
import { ParsedPolicyData } from '@/utils/policyDataParser';

interface VidasBeneficiariosProps {
  allPolicies: ParsedPolicyData[];
}

export function VidasBeneficiarios({ allPolicies }: VidasBeneficiariosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Extract beneficiaries from policies (simulate data from policies)
  const extractBeneficiaries = () => {
    const beneficiaries: any[] = [];
    
    allPolicies.forEach((policy, index) => {
      // Extract titular from policy
      const titular = {
        id: `titular-${index}`,
        nome: policy.insuredName || policy.name || 'Titular',
        tipo: 'titular',
        cpf: policy.documento || 'N/A',
        status: policy.status === 'vigente' ? 'ativo' : 'inativo',
        dataAdmissao: policy.startDate || new Date().toISOString().split('T')[0],
        plano: policy.type || 'Não informado',
        apolice: policy.policyNumber || 'N/A',
        telefone: '(11) 99999-9999',
        email: 'titular@email.com',
        dependentes: []
      };
      
      beneficiaries.push(titular);
      
      // Add some mock dependents for demonstration
      if (index < 2) {
        beneficiaries.push({
          id: `dep-${index}-1`,
          nome: `Dependente ${index + 1}`,
          tipo: 'dependente',
          cpf: '000.000.000-00',
          status: 'ativo',
          dataAdmissao: policy.startDate || new Date().toISOString().split('T')[0],
          plano: policy.type || 'Não informado',
          apolice: policy.policyNumber || 'N/A',
          telefone: '(11) 88888-8888',
          email: 'dependente@email.com',
          parentesco: 'Cônjuge',
          titular: titular.nome
        });
      }
    });
    
    return beneficiaries;
  };

  const beneficiaries = extractBeneficiaries();
  
  // Calculate metrics
  const vidasAtivas = beneficiaries.filter(b => b.status === 'ativo').length;
  const vidasInativas = beneficiaries.filter(b => b.status === 'inativo').length;
  const custoMedioVida = allPolicies.reduce((sum, p) => sum + (p.monthlyAmount || 0), 0) / Math.max(vidasAtivas, 1);
  const movimentacoesNoMes = Math.floor(Math.random() * 5) + 1; // Mock data

  // Filter beneficiaries
  const filteredBeneficiaries = beneficiaries.filter(beneficiary => {
    const matchesSearch = beneficiary.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         beneficiary.cpf.includes(searchTerm) ||
                         beneficiary.apolice.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || beneficiary.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Vidas e Beneficiários
        </h1>
        <p className="text-gray-600 mt-1 text-sm">
          Gestão de pessoas cobertas pelas apólices
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700">
                <UserCheck className="size-3" />
                Vidas Ativas
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              {vidasAtivas}
            </div>
            <div className="text-[12px] text-gray-400">
              Beneficiários ativos
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-gray-50 text-gray-700">
                <UserX className="size-3" />
                Vidas Inativas
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              {vidasInativas}
            </div>
            <div className="text-[12px] text-gray-400">
              Beneficiários inativos
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-blue-50 text-blue-700">
                <Heart className="size-3" />
                Custo/Vida
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              {formatCurrency(custoMedioVida)}
            </div>
            <div className="text-[12px] text-gray-400">
              Custo médio por vida
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-purple-50 text-purple-700">
                <Calendar className="size-3" />
                Movimentações
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              {movimentacoesNoMes}
            </div>
            <div className="text-[12px] text-gray-400">
              No mês atual
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Beneficiários
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Solicitar Inclusão
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar por nome, CPF ou apólice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl border-gray-200"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm"
            >
              <option value="all">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          {/* Beneficiaries Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-1 font-medium text-gray-600">Nome</th>
                  <th className="text-left py-3 px-1 font-medium text-gray-600">Tipo</th>
                  <th className="text-left py-3 px-1 font-medium text-gray-600">CPF</th>
                  <th className="text-left py-3 px-1 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-1 font-medium text-gray-600">Plano</th>
                  <th className="text-left py-3 px-1 font-medium text-gray-600">Admissão</th>
                  <th className="text-left py-3 px-1 font-medium text-gray-600">Contato</th>
                </tr>
              </thead>
              <tbody>
                {filteredBeneficiaries.map((beneficiary, index) => (
                  <tr 
                    key={beneficiary.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                  >
                    <td className="py-3 px-1">
                      <div>
                        <div className="font-medium text-gray-900">{beneficiary.nome}</div>
                        {beneficiary.parentesco && (
                          <div className="text-xs text-gray-500">
                            {beneficiary.parentesco} de {beneficiary.titular}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-1">
                      <Badge 
                        variant="outline" 
                        className={
                          beneficiary.tipo === 'titular' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }
                      >
                        {beneficiary.tipo === 'titular' ? 'Titular' : 'Dependente'}
                      </Badge>
                    </td>
                    <td className="py-3 px-1 font-mono text-sm">{beneficiary.cpf}</td>
                    <td className="py-3 px-1">
                      <Badge 
                        variant="outline" 
                        className={
                          beneficiary.status === 'ativo' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }
                      >
                        {beneficiary.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-1 text-sm text-gray-700">{beneficiary.plano}</td>
                    <td className="py-3 px-1 text-sm text-gray-700">
                      {formatDate(beneficiary.dataAdmissao)}
                    </td>
                    <td className="py-3 px-1">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="p-1">
                          <Phone className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Mail className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBeneficiaries.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum beneficiário encontrado
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Ajuste os filtros para encontrar beneficiários'
                  : 'Ainda não há beneficiários cadastrados'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}