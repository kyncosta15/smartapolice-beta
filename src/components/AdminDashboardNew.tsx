
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Building2, TrendingUp, BarChart3, PieChart, Activity, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Pie } from 'recharts';
import { formatCurrency } from '@/utils/currencyFormatter';
import { ParsedPolicyData } from '@/utils/policyDataParser';

interface AdminDashboardNewProps {
  policies: ParsedPolicyData[];
  allUsers: any[];
}

export function AdminDashboardNew({ policies, allUsers }: AdminDashboardNewProps) {
  // Calcular métricas
  const totalPolicies = policies.length;
  const uniqueClients = new Set(policies.map(p => p.insuredName || p.name)).size;
  const uniqueInsurers = new Set(policies.map(p => p.insurer)).size;
  
  // Novas apólices nos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newPoliciesLast30Days = policies.filter(p => {
    const extractedDate = new Date(p.extractedAt || p.startDate);
    return extractedDate >= thirtyDaysAgo;
  }).length;

  // Dados para gráfico de barras - Apólices por Seguradora
  const policiesByInsurer = policies.reduce((acc, policy) => {
    const insurer = policy.insurer || 'Não informado';
    acc[insurer] = (acc[insurer] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const insurerData = Object.entries(policiesByInsurer).map(([name, count]) => ({
    name,
    value: count
  }));

  // Dados para gráfico pizza - PF vs PJ
  const personTypeData = policies.reduce((acc, policy) => {
    const docType = policy.documento_tipo;
    if (docType === 'CPF') {
      acc.pf += 1;
    } else if (docType === 'CNPJ') {
      acc.pj += 1;
    }
    return acc;
  }, { pf: 0, pj: 0 });

  const personTypeChartData = [
    { name: 'Pessoa Física', value: personTypeData.pf, color: '#3B82F6' },
    { name: 'Pessoa Jurídica', value: personTypeData.pj, color: '#10B981' }
  ];

  // Dados para gráfico de linha - Crescimento de novas apólices
  const monthlyGrowth = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
    
    const monthPolicies = policies.filter(p => {
      const policyDate = new Date(p.extractedAt || p.startDate);
      return policyDate.getMonth() === date.getMonth() && 
             policyDate.getFullYear() === date.getFullYear();
    }).length;

    monthlyGrowth.push({
      month: monthName,
      policies: monthPolicies
    });
  }

  // Dados para gráfico doughnut - Clientes Ativos vs Inativos
  const activeClients = allUsers.filter(u => u.status === 'active').length;
  const inactiveClients = allUsers.filter(u => u.status === 'inactive').length;

  const clientStatusData = [
    { name: 'Ativos', value: activeClients, color: '#10B981' },
    { name: 'Inativos', value: inactiveClients, color: '#EF4444' }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="text-gray-600">Visão geral do sistema</p>
      </div>

      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Total de Apólices</CardTitle>
            <FileText className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPolicies}</div>
            <p className="text-xs opacity-80 mt-1">Apólices no sistema</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Clientes Únicos</CardTitle>
            <Users className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{uniqueClients}</div>
            <p className="text-xs opacity-80 mt-1">Clientes cadastrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Seguradoras</CardTitle>
            <Building2 className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{uniqueInsurers}</div>
            <p className="text-xs opacity-80 mt-1">Seguradoras parceiras</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Novas Apólices</CardTitle>
            <TrendingUp className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{newPoliciesLast30Days}</div>
            <p className="text-xs opacity-80 mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Apólices por Seguradora */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Apólices por Seguradora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insurerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Pizza - PF vs PJ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Pessoa Física vs Jurídica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={personTypeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {personTypeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Linha - Crescimento de Apólices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Crescimento de Apólices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="policies" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Doughnut - Clientes Ativos vs Inativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Status dos Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={clientStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {clientStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
