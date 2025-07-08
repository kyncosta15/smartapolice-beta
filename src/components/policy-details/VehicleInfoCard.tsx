import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car } from 'lucide-react';

interface VehicleInfoCardProps {
  policy: any;
}

export const VehicleInfoCard = ({ policy }: VehicleInfoCardProps) => {
  if (policy.type !== 'auto' || (!policy.vehicleModel && !policy.deductible)) {
    return null;
  }

  return (
    <Card className="flex flex-col h-full border-0 shadow-lg rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-purple-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-purple-900 font-sf-pro">
          <Car className="h-6 w-6 mr-3 text-purple-600" />
          Informações do Veículo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {policy.vehicleModel && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
            <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">Modelo do Veículo</label>
            <p className="text-xl font-bold text-gray-900 font-sf-pro">{policy.vehicleModel}</p>
          </div>
        )}

        {policy.deductible && policy.deductible > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
            <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">Franquia</label>
            <p className="text-xl font-bold text-gray-900 font-sf-pro">
              R$ {policy.deductible.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
