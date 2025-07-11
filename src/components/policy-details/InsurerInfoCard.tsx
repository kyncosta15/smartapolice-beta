
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Star, Calendar, FileText, Shield } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface InsurerInfoCardProps {
  insurer: string;
  policyNumber: string;
  premium: number;
  startDate: string;
  endDate: string;
  paymentFrequency: string;
  type: string;
  readOnly?: boolean;
}

export const InsurerInfoCard = ({ 
  insurer, 
  policyNumber, 
  premium, 
  startDate, 
  endDate, 
  paymentFrequency,
  type,
  readOnly = false 
}: InsurerInfoCardProps) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informado';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getInsuranceTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'auto':
        return 'Seguro Auto';
      case 'vida':
        return 'Seguro de Vida';
      case 'saude':
        return 'Seguro Saúde';
      case 'residencial':
        return 'Seguro Residencial';
      case 'empresarial':
        return 'Seguro Empresarial';
      default:
        return type || 'Seguro';
    }
  };

  return (
    <Card className="flex flex-col h-full border-0 shadow-lg rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-blue-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-blue-900 font-sf-pro">
          <Building2 className="h-6 w-6 mr-3 text-blue-600" />
          Seguradora
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Nome da Seguradora */}
        <div className="flex items-start gap-3">
          <Star className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">Nome da Seguradora</p>
            <p className="text-base font-semibold text-gray-800 font-sf-pro">{insurer}</p>
          </div>
        </div>

        {/* Número da Apólice */}
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">Número da Apólice</p>
            <p className="text-base font-semibold text-gray-800 font-sf-pro font-mono">{policyNumber}</p>
          </div>
        </div>

        {/* Tipo de Seguro */}
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">Tipo de Seguro</p>
            <p className="text-base font-semibold text-gray-800 font-sf-pro">{getInsuranceTypeLabel(type)}</p>
          </div>
        </div>

        {/* Prêmio Total */}
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-green-500 mt-1 flex-shrink-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold">R$</span>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">Prêmio Total</p>
            <p className="text-lg font-bold text-green-600 font-sf-pro">{formatCurrency(premium)}</p>
          </div>
        </div>

        {/* Vigência */}
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">Vigência</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-700 font-sf-pro">
                <span className="font-semibold">Início:</span> {formatDate(startDate)}
              </p>
              <p className="text-sm text-gray-700 font-sf-pro">
                <span className="font-semibold">Fim:</span> {formatDate(endDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Forma de Pagamento */}
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-orange-500 mt-1 flex-shrink-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold">$</span>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">Forma de Pagamento</p>
            <p className="text-base font-semibold text-gray-800 font-sf-pro capitalize">{paymentFrequency}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
