
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { renderValue } from '@/utils/renderValue';

interface ValidityInfoCardProps {
  policy: any;
}

export const ValidityInfoCard = ({ policy }: ValidityInfoCardProps) => {
  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      // Handle DD/MM/YYYY format
      if (typeof date === 'string' && date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3) {
          return date; // Already in DD/MM/YYYY format
        }
      }
      return new Date(date).toLocaleDateString('pt-BR');
    } catch {
      return renderValue(date);
    }
  };

  const formatDateTime = (date: any) => {
    if (!date) return '-';
    try {
      const dateObj = new Date(date);
      return `${dateObj.toLocaleDateString('pt-BR')} às ${dateObj.toLocaleTimeString('pt-BR')}`;
    } catch {
      return renderValue(date);
    }
  };

  // Check multiple possible field names for start date
  const startDate = policy?.startDate || policy?.inicio_vigencia || policy?.inicio || 
                    policy?.inicioVigencia || policy?.data_inicio || policy?.inivig;
  
  // Check multiple possible field names for end date
  const endDate = policy?.endDate || policy?.fim_vigencia || policy?.fim || 
                  policy?.fimVigencia || policy?.data_fim || policy?.fimvig;

  const fileName = renderValue(policy?.fileName || policy?.file?.name || policy?.arquivo);

  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 overflow-hidden h-fit">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-indigo-200 py-3">
        <CardTitle className="flex items-center text-xl font-bold text-indigo-900 font-sf-pro">
          <Calendar className="h-6 w-6 mr-3 text-indigo-600" />
          Vigência & Histórico
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
            <label className="text-sm font-medium text-indigo-700 font-sf-pro block mb-1">
              Data de Início
            </label>
            <p className="text-base font-bold text-gray-900 font-sf-pro">
              {formatDate(startDate)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
            <label className="text-sm font-medium text-indigo-700 font-sf-pro block mb-1">
              Data de Fim
            </label>
            <p className="text-base font-bold text-gray-900 font-sf-pro">
              {formatDate(endDate)}
            </p>
          </div>
        </div>

        {policy?.extractedAt && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
            <label className="text-sm font-medium text-indigo-700 font-sf-pro flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4" />
              Extraído em
            </label>
            <p className="text-sm font-medium text-gray-900 font-sf-pro">
              {formatDateTime(policy.extractedAt)}
            </p>
          </div>
        )}

        {fileName && fileName !== '-' && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
            <label className="text-sm font-medium text-indigo-700 font-sf-pro block mb-1">
              Arquivo Original
            </label>
            <p className="text-sm bg-gray-50 p-3 rounded-lg border font-sf-pro font-medium text-gray-700 break-all">
              {fileName}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
