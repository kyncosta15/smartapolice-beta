
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, MapPin } from 'lucide-react';
import { extractFieldValue } from '@/utils/extractFieldValue';

interface VehicleInfoCardProps {
  policy: any;
}

export const VehicleInfoCard = ({ policy }: VehicleInfoCardProps) => {
  // CORREÇÃO CRÍTICA: Usar extractFieldValue para todos os campos do veículo
  const vehicleModel = extractFieldValue(policy.vehicleModel) || 
                      extractFieldValue(policy.modelo_veiculo) ||
                      extractFieldValue(policy.veiculo?.modelo) ||
                      extractFieldValue(policy.vehicleDetails?.model);

  const vehicleBrand = extractFieldValue(policy.vehicleBrand) ||
                      extractFieldValue(policy.marca_veiculo) ||
                      extractFieldValue(policy.veiculo?.marca) ||
                      extractFieldValue(policy.vehicleDetails?.brand);

  const vehicleYear = extractFieldValue(policy.vehicleYear) ||
                     extractFieldValue(policy.ano_veiculo) ||
                     extractFieldValue(policy.veiculo?.ano) ||
                     extractFieldValue(policy.vehicleDetails?.year);

  const vehiclePlate = extractFieldValue(policy.vehiclePlate) ||
                      extractFieldValue(policy.placa_veiculo) ||
                      extractFieldValue(policy.veiculo?.placa) ||
                      extractFieldValue(policy.vehicleDetails?.plate);

  const uf = extractFieldValue(policy.uf) ||
            extractFieldValue(policy.estado) ||
            extractFieldValue(policy.veiculo?.uf);

  // Se não temos informações básicas do veículo, não renderizar o card
  if (!vehicleModel && !vehicleBrand) {
    return null;
  }

  const fullVehicleName = [vehicleBrand, vehicleModel, vehicleYear]
    .filter(Boolean)
    .join(' ') || 'Veículo não especificado';

  return (
    <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-orange-50 to-red-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-orange-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-orange-900 font-sf-pro">
          <Car className="h-6 w-6 mr-3 text-orange-600" />
          Informações do Veículo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 shadow-md">
          <label className="text-sm font-medium text-white/90 font-sf-pro block mb-2">Veículo</label>
          <p className="text-2xl font-bold text-white font-sf-pro leading-tight">
            {fullVehicleName}
          </p>
        </div>

        {vehiclePlate && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
            <label className="text-sm font-medium text-orange-700 font-sf-pro block mb-1">Placa</label>
            <p className="text-lg font-bold text-gray-900 font-sf-pro font-mono">
              {vehiclePlate}
            </p>
          </div>
        )}

        {uf && (
          <div className="bg-orange-50 rounded-xl p-4 shadow-sm border border-orange-100">
            <label className="text-sm font-medium text-orange-700 font-sf-pro flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4" />
              Estado
            </label>
            <p className="text-base font-semibold text-gray-900 font-sf-pro uppercase">
              {uf}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
