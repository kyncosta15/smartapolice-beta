
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';

interface InsurerInfoCardProps {
  policy: any;
}

export const InsurerInfoCard = ({ policy }: InsurerInfoCardProps) => {
  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-emerald-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-emerald-900 font-sf-pro">
          <Building className="h-6 w-6 mr-3 text-emerald-600" />
          Seguradora
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
          <label className="text-sm font-medium text-emerald-700 font-sf-pro block mb-1">Empresa</label>
          <p className="text-xl font-bold text-gray-900 font-sf-pro">{policy.insurer}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
          <label className="text-sm font-medium text-emerald-700 font-sf-pro block mb-1">Cobertura</label>
          <p className="text-base font-medium text-gray-900 font-sf-pro leading-relaxed">{policy.coverage}</p>
        </div>

        {policy.entity && policy.entity !== policy.insurer && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
            <label className="text-sm font-medium text-emerald-700 font-sf-pro block mb-1">Corretora</label>
            <p className="text-base font-medium text-gray-900 font-sf-pro">{policy.entity}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
