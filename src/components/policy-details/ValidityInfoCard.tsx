import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';

interface ValidityInfoCardProps {
  policy: any;
}

export const ValidityInfoCard = ({ policy }: ValidityInfoCardProps) => {
  return (
    <Card className="flex flex-col h-full border-0 shadow-lg rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-indigo-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-indigo-900 font-sf-pro">
          <Calendar className="h-6 w-6 mr-3 text-indigo-600" />
          Vigência & Histórico
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
            <label className="text-sm font-medium text-indigo-700 font-sf-pro block mb-1">Data de Início</label>
            <p className="text-base font-bold text-gray-900 font-sf-pro">
              {new Date(policy.startDate).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
            <label className="text-sm font-medium text-indigo-700 font-sf-pro block mb-1">Data de Fim</label>
            <p className="text-base font-bold text-gray-900 font-sf-pro">
              {new Date(policy.endDate).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        {policy.extractedAt && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
            <label className="text-sm font-medium text-indigo-700 font-sf-pro flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4" />
              Extraído em
            </label>
            <p className="text-sm font-medium text-gray-900 font-sf-pro">
              {new Date(policy.extractedAt).toLocaleDateString('pt-BR')} às{' '}
              {new Date(policy.extractedAt).toLocaleTimeString('pt-BR')}
            </p>
          </div>
        )}

        {policy.fileName && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
            <label className="text-sm font-medium text-indigo-700 font-sf-pro block mb-1">Arquivo Original</label>
            <p className="text-sm bg-gray-50 p-3 rounded-lg border font-sf-pro font-medium text-gray-700 break-all">
              {policy.fileName}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
