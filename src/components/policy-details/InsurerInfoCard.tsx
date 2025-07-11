
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Star, Shield } from 'lucide-react';

interface InsurerInfoCardProps {
  insurer: string;
  type: string;
  readOnly?: boolean;
}

export const InsurerInfoCard = ({ 
  insurer, 
  type,
  readOnly = false 
}: InsurerInfoCardProps) => {
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

        {/* Tipo de Seguro */}
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">Tipo de Seguro</p>
            <p className="text-base font-semibold text-gray-800 font-sf-pro">{getInsuranceTypeLabel(type)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
