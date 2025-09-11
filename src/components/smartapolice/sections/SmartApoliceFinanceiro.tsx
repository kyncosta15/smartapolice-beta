import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SmartApoliceFinanceiroProps {
  apolices: any[];
  selectedPolicy: any;
  onPolicyUpdate: (policy: any) => void;
}

export function SmartApoliceFinanceiro({
  apolices,
  selectedPolicy,
  onPolicyUpdate
}: SmartApoliceFinanceiroProps) {

  // Mock data para demonstração
  const mockPayments = [
    {
      id: 1,
      descricao: "Parcela 1/12",
      data_vencimento: "2025-02-10",
      valor: 21575, // em centavos
      status: "PAGO",
      data_pagamento: "2025-02-08"
    },
    {
      id: 2,
      descricao: "Parcela 2/12",
      data_vencimento: "2025-03-10",
      valor: 21575,
      status: "EM_ABERTO",
      data_pagamento: null
    },
    {
      id: 3,
      descricao: "Parcela 3/12",
      data_vencimento: "2025-04-10",
      valor: 21575,
      status: "EM_ABERTO",
      data_pagamento: null
    },
    {
      id: 4,
      descricao: "Parcela 4/12",
      data_vencimento: "2024-12-10", // Atrasada
      valor: 21575,
      status: "ATRASADO",
      data_pagamento: null
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PAGO': { 
        variant: 'default' as const, 
        icon: CheckCircle,
        color: 'text-green-700 bg-green-100' 
      },
      'EM_ABERTO': { 
        variant: 'secondary' as const, 
        icon: Clock,
        color: 'text-blue-700 bg-blue-100' 
      },
      'ATRASADO': { 
        variant: 'destructive' as const, 
        icon: AlertTriangle,
        color: 'text-red-700 bg-red-100' 
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['EM_ABERTO'];
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status === 'EM_ABERTO' ? 'Em Aberto' : status === 'ATRASADO' ? 'Atrasado' : 'Pago'}
      </Badge>
    );
  };

  // Calcular totais
  const totalPago = mockPayments
    .filter(p => p.status === 'PAGO')
    .reduce((sum, p) => sum + p.valor, 0);
  
  const totalEmAberto = mockPayments
    .filter(p => p.status === 'EM_ABERTO')
    .reduce((sum, p) => sum + p.valor, 0);
  
  const totalAtrasado = mockPayments
    .filter(p => p.status === 'ATRASADO')
    .reduce((sum, p) => sum + p.valor, 0);

  const totalGeral = mockPayments.reduce((sum, p) => sum + p.valor, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
          <p className="text-gray-600 mt-1">
            Controle de pagamentos e parcelas das apólices
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Pagamento
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Parcela
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pago</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totalPago)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Em Aberto</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totalEmAberto)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Atrasado</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totalAtrasado)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Geral</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totalGeral)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Parcelas e Pagamentos
            </CardTitle>
            <Button variant="outline" size="sm">
              Exportar Relatório
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Data Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Pagamento</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPayments.map((payment) => {
                const isOverdue = payment.status === 'ATRASADO' || 
                  (payment.status === 'EM_ABERTO' && new Date(payment.data_vencimento) < new Date());
                
                return (
                  <TableRow key={payment.id} className={isOverdue ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">
                      {payment.descricao}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(payment.data_vencimento)}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.valor)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      {payment.data_pagamento ? (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          {formatDate(payment.data_pagamento)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {payment.status !== 'PAGO' && (
                          <Button variant="outline" size="sm">
                            Marcar como Pago
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total de Parcelas:</span>
              <span className="font-semibold">{mockPayments.length}</span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Parcelas Pagas:</span>
              <span className="font-semibold text-green-600">
                {mockPayments.filter(p => p.status === 'PAGO').length}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Parcelas Pendentes:</span>
              <span className="font-semibold text-blue-600">
                {mockPayments.filter(p => p.status === 'EM_ABERTO').length}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Parcelas Atrasadas:</span>
              <span className="font-semibold text-red-600">
                {mockPayments.filter(p => p.status === 'ATRASADO').length}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-4 text-lg">
              <span className="font-semibold">Valor Total:</span>
              <span className="font-bold text-xl">
                {formatCurrency(totalGeral)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Vencimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockPayments
                .filter(p => p.status === 'EM_ABERTO')
                .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
                .slice(0, 3)
                .map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{payment.descricao}</p>
                      <p className="text-sm text-gray-600">
                        Vence em {formatDate(payment.data_vencimento)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(payment.valor)}</p>
                      <Button variant="outline" size="sm" className="mt-1">
                        Pagar
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}