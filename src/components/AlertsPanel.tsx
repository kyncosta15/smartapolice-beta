import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, DollarSign, FileText, Clock, CheckCircle2 } from 'lucide-react';

export const AlertsPanel = () => {
  const alerts = [
    {
      id: 1,
      type: 'expiring',
      title: 'Apólice vencendo em 15 dias',
      description: 'Seguro Patrimonial Sede - BS-2024-005671',
      priority: 'high',
      date: '2025-01-05',
      action: 'Renovar'
    },
    {
      id: 2,
      type: 'cost',
      title: 'Custo elevado detectado',
      description: 'Plano de Saúde Executivo - Valor 40% acima da média',
      priority: 'medium',
      date: '2024-12-18',
      action: 'Renegociar'
    },
    {
      id: 3,
      type: 'duplicate',
      title: 'Possível cobertura duplicada',
      description: 'Seguro Auto e RC - Análise de sobreposição necessária',
      priority: 'low',
      date: '2024-12-15',
      action: 'Analisar'
    },
    {
      id: 4,
      type: 'review',
      title: 'Apólice em análise há 30 dias',
      description: 'Seguro Responsabilidade Civil - AL-2024-003421',
      priority: 'high',
      date: '2024-11-20',
      action: 'Acompanhar'
    },
    {
      id: 5,
      type: 'underused',
      title: 'Apólice subutilizada',
      description: 'Seguro Equipamentos - Sem sinistros há 24 meses',
      priority: 'low',
      date: '2024-12-10',
      action: 'Revisar'
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'expiring':
        return <Calendar className="h-5 w-5 text-orange-600" />;
      case 'cost':
        return <DollarSign className="h-5 w-5 text-red-600" />;
      case 'duplicate':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'review':
        return <Clock className="h-5 w-5 text-purple-600" />;
      case 'underused':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Média</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Baixa</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const types = {
      expiring: 'Vencimento',
      cost: 'Custo Elevado',
      duplicate: 'Cobertura Duplicada',
      review: 'Em Análise',
      underused: 'Subutilizada'
    };
    return types[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Resumo de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-700">2</div>
                <div className="text-sm text-red-600">Alta Prioridade</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-700">1</div>
                <div className="text-sm text-orange-600">Média Prioridade</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-700">2</div>
                <div className="text-sm text-blue-600">Baixa Prioridade</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-700">12</div>
                <div className="text-sm text-green-600">Resolvidos (30d)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alertas */}
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Alertas Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 border rounded-lg bg-white/50 hover:bg-white/70 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                        {getPriorityBadge(alert.priority)}
                        <Badge variant="outline" className="bg-gray-50">
                          {getAlertTypeLabel(alert.type)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{alert.description}</p>
                      <div className="text-sm text-gray-500">
                        Criado em: {new Date(alert.date).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      {alert.action}
                    </Button>
                    <Button size="sm" variant="outline">
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Alertas */}
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Configurações de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Alertas de Vencimento</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">30 dias antes do vencimento</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">15 dias antes do vencimento</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">7 dias antes do vencimento</span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Alertas de Custo</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Custo 30% acima da média</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Variação mensal {'>'} 20%</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Apólices subutilizadas</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
