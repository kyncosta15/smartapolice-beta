
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Hash } from 'lucide-react';
import { extractFieldValue } from '@/utils/extractFieldValue';

interface GeneralInfoCardProps {
  policy: any;
}

export const GeneralInfoCard = ({ policy }: GeneralInfoCardProps) => {
  // CORREÇÃO CRÍTICA: Usar extractFieldValue para todos os campos que podem ser objetos
  const policyName = extractFieldValue(policy.name) || 
                    extractFieldValue(policy.nome_apolice) || 
                    extractFieldValue(policy.segurado?.nome) ||
                    extractFieldValue(policy.insuredName) || 
                    'Apólice sem nome';

  const policyNumber = extractFieldValue(policy.policyNumber) || 
                      extractFieldValue(policy.numero_apolice) || 
                      extractFieldValue(policy.policy_number) ||
                      'Não informado';

  const policyType = extractFieldValue(policy.type) || 
                    extractFieldValue(policy.tipo_seguro) || 
                    extractFieldValue(policy.categoria) ||
                    'Não especificado';

  const extractedDate = extractFieldValue(policy.extractedAt) || 
                       extractFieldValue(policy.created_at) ||
                       extractFieldValue(policy.extraido_em) ||
                       new Date().toLocaleDateString('pt-BR');

  const formatDate = (dateString: string) => {
    try {
      if (dateString.includes('-')) {
        return new Date(dateString).toLocaleDateString('pt-BR');
      }
      return dateString;
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-blue-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-blue-900 font-sf-pro">
          <FileText className="h-6 w-6 mr-3 text-blue-600" />
          Informações Gerais
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
          <label className="text-sm font-medium text-blue-700 font-sf-pro block mb-1">Nome da Apólice</label>
          <p className="text-lg font-bold text-gray-900 font-sf-pro leading-tight">
            {policyName}
          </p>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 shadow-md">
          <label className="text-sm font-medium text-white/90 font-sf-pro flex items-center gap-2 mb-2">
            <Hash className="h-4 w-4" />
            Número da Apólice
          </label>
          <p className="text-xl font-bold text-white font-sf-pro">
            {policyNumber}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
          <label className="text-sm font-medium text-blue-700 font-sf-pro block mb-1">Tipo de Seguro</label>
          <p className="text-base font-semibold text-gray-900 font-sf-pro capitalize">
            {policyType}
          </p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
          <label className="text-sm font-medium text-blue-700 font-sf-pro flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4" />
            Extraído em
          </label>
          <p className="text-sm font-medium text-blue-600 font-sf-pro">
            {formatDate(extractedDate)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
