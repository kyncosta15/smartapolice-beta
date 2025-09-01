
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Tag } from 'lucide-react';
import { extractFieldValue } from '@/utils/extractFieldValue';

interface InsurerInfoCardProps {
  insurer?: any;
  type?: any;
  policy?: any;
}

export const InsurerInfoCard = ({ insurer, type, policy }: InsurerInfoCardProps) => {
  // CORREÇÃO CRÍTICA: Usar extractFieldValue para todos os campos
  const safeInsurer = extractFieldValue(insurer) || 
                     extractFieldValue(policy?.seguradora) ||
                     extractFieldValue(policy?.insurer) ||
                     extractFieldValue(policy?.empresa) ||
                     'Seguradora não informada';

  const safeType = extractFieldValue(type) || 
                  extractFieldValue(policy?.tipo_seguro) ||
                  extractFieldValue(policy?.type) ||
                  extractFieldValue(policy?.categoria) ||
                  'Tipo não especificado';

  // Extrair informações adicionais se disponíveis
  const broker = extractFieldValue(policy?.broker) ||
                extractFieldValue(policy?.corretora) ||
                extractFieldValue(policy?.entidade);

  const category = extractFieldValue(policy?.category) ||
                  extractFieldValue(policy?.categoria);

  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-emerald-900 font-sf-pro">
          <Building className="h-6 w-6 mr-3 text-emerald-600" />
          Seguradora
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 shadow-md">
          <label className="text-sm font-medium text-white/90 font-sf-pro block mb-2">Empresa</label>
          <p className="text-2xl font-bold text-white font-sf-pro">
            {safeInsurer}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
          <label className="text-sm font-medium text-emerald-700 font-sf-pro flex items-center gap-2 mb-1">
            <Tag className="h-4 w-4" />
            Tipo de Seguro
          </label>
          <p className="text-lg font-semibold text-gray-900 font-sf-pro capitalize">
            {safeType}
          </p>
        </div>

        {broker && (
          <div className="bg-emerald-50 rounded-xl p-4 shadow-sm border border-emerald-100">
            <label className="text-sm font-medium text-emerald-700 font-sf-pro block mb-1">
              Corretora
            </label>
            <p className="text-base font-medium text-gray-900 font-sf-pro">
              {broker}
            </p>
          </div>
        )}

        {category && category !== safeType && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
            <label className="text-sm font-medium text-emerald-700 font-sf-pro block mb-1">
              Categoria
            </label>
            <p className="text-base font-medium text-gray-900 font-sf-pro capitalize">
              {category}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
