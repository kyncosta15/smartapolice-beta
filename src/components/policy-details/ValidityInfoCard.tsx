
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { extractFieldValue } from '@/utils/extractFieldValue';

interface ValidityInfoCardProps {
  policy: any;
}

export const ValidityInfoCard = ({ policy }: ValidityInfoCardProps) => {
  // CORREÇÃO CRÍTICA: Usar extractFieldValue para todas as datas
  const startDate = extractFieldValue(policy.startDate) || 
                   extractFieldValue(policy.inicio_vigencia) ||
                   extractFieldValue(policy.inicio) ||
                   extractFieldValue(policy.vigencia?.inicio);

  const endDate = extractFieldValue(policy.endDate) || 
                 extractFieldValue(policy.fim_vigencia) ||
                 extractFieldValue(policy.fim) ||
                 extractFieldValue(policy.vigencia?.fim) ||
                 extractFieldValue(policy.expirationDate);

  const status = extractFieldValue(policy.status) || 
                extractFieldValue(policy.policyStatus) ||
                'Não informado';

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Data não informada';
    
    try {
      if (dateString.includes('-')) {
        return new Date(dateString).toLocaleDateString('pt-BR');
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  const calculateDaysRemaining = () => {
    if (!endDate) return null;
    
    try {
      const end = new Date(endDate);
      const today = new Date();
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch {
      return null;
    }
  };

  const daysRemaining = calculateDaysRemaining();

  const getStatusColor = () => {
    if (daysRemaining === null) return 'text-gray-600';
    if (daysRemaining < 30) return 'text-red-600';
    if (daysRemaining < 90) return 'text-orange-600';
    return 'text-green-600';
  };

  const getStatusText = () => {
    if (daysRemaining === null) return 'Período não calculado';
    if (daysRemaining < 0) return `Vencida há ${Math.abs(daysRemaining)} dias`;
    if (daysRemaining === 0) return 'Vence hoje';
    return `${daysRemaining} dias restantes`;
  };

  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-purple-50 to-pink-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-purple-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-purple-900 font-sf-pro">
          <Calendar className="h-6 w-6 mr-3 text-purple-600" />
          Vigência
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
          <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">Início da Vigência</label>
          <p className="text-lg font-bold text-gray-900 font-sf-pro">
            {formatDate(startDate)}
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 shadow-md">
          <label className="text-sm font-medium text-white/90 font-sf-pro block mb-2">Fim da Vigência</label>
          <p className="text-xl font-bold text-white font-sf-pro">
            {formatDate(endDate)}
          </p>
        </div>

        {daysRemaining !== null && (
          <div className="bg-purple-50 rounded-xl p-4 shadow-sm border border-purple-100">
            <label className="text-sm font-medium text-purple-700 font-sf-pro flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              Status da Vigência
            </label>
            <p className={`text-lg font-bold font-sf-pro ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
          <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">Status Geral</label>
          <p className="text-base font-semibold text-gray-900 font-sf-pro capitalize">
            {status}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
