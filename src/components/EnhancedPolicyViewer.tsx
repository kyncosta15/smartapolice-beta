
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Edit, Trash2, Search, Filter, Download, TrendingUp, AlertTriangle } from 'lucide-react';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { formatCurrency } from '@/utils/currencyFormatter';

interface EnhancedPolicyViewerProps {
  policies: ParsedPolicyData[];
  onPolicySelect: (policy: ParsedPolicyData) => void;
  onPolicyEdit: (policy: ParsedPolicyData) => void;
  onPolicyDelete: (policyId: string) => void;
  viewMode?: 'client' | 'admin';
}

export function EnhancedPolicyViewer({ 
  policies, 
  onPolicySelect, 
  onPolicyEdit, 
  onPolicyDelete,
  viewMode = 'client'
}: EnhancedPolicyViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterInsurer, setFilterInsurer] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClaimRate, setFilterClaimRate] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { filteredPolicies, optimizationData } = useMemo(() => {
    let filtered = policies.filter(policy => {
      const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           policy.insurer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || policy.type === filterType;
      const matchesInsurer = filterInsurer === 'all' || policy.insurer === filterInsurer;
      const matchesStatus = filterStatus === 'all' || policy.status === filterStatus;
      
      let matchesClaimRate = true;
      if (filterClaimRate !== 'all' && policy.claimRate) {
        switch (filterClaimRate) {
          case 'low':
            matchesClaimRate = policy.claimRate < 5;
            break;
          case 'medium':
            matchesClaimRate = policy.claimRate >= 5 && policy.claimRate <= 15;
            break;
          case 'high':
            matchesClaimRate = policy.claimRate > 15;
            break;
        }
      }
      
      return matchesSearch && matchesType && matchesInsurer && matchesStatus && matchesClaimRate;
    });

    // Gerar dados de otimização
    const optimization = generateOptimizationData(filtered);

    return { filteredPolicies: filtered, optimizationData: optimization };
  }, [policies, searchTerm, filterType, filterInsurer, filterStatus, filterClaimRate]);

  const uniqueInsurers = [...new Set(policies.map(p => p.insurer))];

  const handleDownload = (policy: ParsedPolicyData) => {
    if (policy.file) {
      const url = URL.createObjectURL(policy.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${policy.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      console.warn('Arquivo não disponível para download:', policy.name);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-50 text-green-600 border-green-200">Ativa</Badge>;
      case 'expiring':
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200">Vencendo</Badge>;
      case 'expired':
        return <Badge className="bg-red-50 text-red-600 border-red-200">Vencida</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getOptimizationBadge = (policy: ParsedPolicyData) => {
    const avgCost = policies.reduce((sum, p) => sum + p.monthlyAmount, 0) / policies.length;
    
    if (policy.monthlyAmount > avgCost * 1.5) {
      return <Badge className="bg-red-50 text-red-600 border-red-200">Acima</Badge>;
    }
    
    if (policy.claimRate && policy.claimRate < 5) {
      return <Badge className="bg-blue-50 text-blue-600 border-blue-200">Subutilizado</Badge>;
    }
    
    // Verificar duplicação
    const duplicates = policies.filter(p => p.type === policy.type && p.id !== policy.id);
    if (duplicates.length > 0) {
      return <Badge className="bg-yellow-50 text-yellow-600 border-yellow-200">Duplicado</Badge>;
    }
    
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Filtros e Busca</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros Avançados
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, seguradora ou número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="vida">Vida</SelectItem>
                <SelectItem value="saude">Saúde</SelectItem>
                <SelectItem value="patrimonial">Patrimonial</SelectItem>
                <SelectItem value="empresarial">Empresarial</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterInsurer} onValueChange={setFilterInsurer}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Seguradora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Seguradoras</SelectItem>
                {uniqueInsurers.map(insurer => (
                  <SelectItem key={insurer} value={insurer}>{insurer}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showAdvancedFilters && (
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="expiring">Vencendo</SelectItem>
                  <SelectItem value="expired">Vencida</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterClaimRate} onValueChange={setFilterClaimRate}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sinistralidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Faixas</SelectItem>
                  <SelectItem value="low">Baixa (&lt;5%)</SelectItem>
                  <SelectItem value="medium">Média (5-15%)</SelectItem>
                  <SelectItem value="high">Alta (&gt;15%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados de Otimização */}
      {viewMode === 'admin' && optimizationData.potentialSavings > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              💰 Oportunidades de Economia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(optimizationData.potentialSavings)}
                </p>
                <p className="text-sm text-green-600">Economia Potencial Anual</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-700">
                  {optimizationData.highCostPolicies}
                </p>
                <p className="text-sm text-orange-600">Apólices Acima da Média</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {optimizationData.underutilizedPolicies}
                </p>
                <p className="text-sm text-blue-600">Subutilizadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Apólices */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPolicies.map((policy) => (
          <Card key={policy.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                  <p className="text-sm text-gray-500">{policy.policyNumber}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(policy.status)}
                  {viewMode === 'admin' && getOptimizationBadge(policy)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Seguradora</p>
                  <p className="font-medium">{policy.insurer}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tipo</p>
                  <p className="font-medium capitalize">{policy.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Valor Mensal</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(policy.monthlyAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Cobertura</p>
                  <p className="font-medium">
                    {policy.totalCoverage ? formatCurrency(policy.totalCoverage) : 'N/A'}
                  </p>
                </div>
              </div>

              {policy.claimRate && (
                <div className="text-sm">
                  <p className="text-gray-500">Sinistralidade</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{policy.claimRate}%</p>
                    {policy.claimRate > 15 && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t">
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPolicySelect(policy)}
                    className="hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPolicyEdit(policy)}
                    className="hover:bg-green-50 hover:text-green-600"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(policy)}
                    className="hover:bg-purple-50 hover:text-purple-600"
                    disabled={!policy.file}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPolicyDelete(policy.id)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPolicies.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Nenhuma apólice encontrada com os filtros aplicados</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function generateOptimizationData(policies: ParsedPolicyData[]) {
  const avgMonthlyCost = policies.reduce((sum, p) => sum + p.monthlyAmount, 0) / policies.length;
  
  const highCostPolicies = policies.filter(p => p.monthlyAmount > avgMonthlyCost * 1.5).length;
  const underutilizedPolicies = policies.filter(p => p.claimRate && p.claimRate < 5).length;
  
  // Calcular economia potencial baseada em benchmarks
  const potentialSavings = policies.reduce((total, policy) => {
    let savings = 0;
    
    // Alto custo - 20% de economia potencial
    if (policy.monthlyAmount > avgMonthlyCost * 1.5) {
      savings += policy.monthlyAmount * 0.2 * 12;
    }
    
    // Subutilizado - 15% de economia potencial
    if (policy.claimRate && policy.claimRate < 5) {
      savings += policy.monthlyAmount * 0.15 * 12;
    }
    
    return total + savings;
  }, 0);

  return {
    potentialSavings: Math.round(potentialSavings),
    highCostPolicies,
    underutilizedPolicies
  };
}
