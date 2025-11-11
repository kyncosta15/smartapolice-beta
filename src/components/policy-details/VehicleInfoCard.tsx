
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car } from 'lucide-react';
import { renderValue, renderCurrency } from '@/utils/renderValue';

interface VehicleInfoCardProps {
  policy: any;
}

export const VehicleInfoCard = ({ policy }: VehicleInfoCardProps) => {
  const normalizedType = policy?.type?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
  const isVehicleType = normalizedType === 'auto' || normalizedType === 'nautico';
  
  const vehicleModel = renderValue(policy?.vehicleModel || policy?.veiculo?.modelo || policy?.modelo_veiculo);
  const marca = renderValue(policy?.marca);
  const placa = renderValue(policy?.placa);
  const nomeEmbarcacao = renderValue(policy?.nome_embarcacao);
  const anoModelo = renderValue(policy?.ano_modelo);
  const deductible = policy?.deductible || policy?.franquia;
  
  console.log('🚗 [VehicleInfoCard] Dados do veículo:', {
    marca,
    modelo: vehicleModel,
    placa,
    nomeEmbarcacao,
    anoModelo,
    franquia: deductible,
    policyKeys: Object.keys(policy || {})
  });
  
  if (!isVehicleType || (!vehicleModel && !deductible && !marca && !placa && !nomeEmbarcacao && !anoModelo)) {
    return null;
  }

  const isNautico = normalizedType === 'nautico';

  return (
    <Card className="flex flex-col h-full border-0 shadow-lg rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-purple-200 pb-4">
        <CardTitle className="flex items-center text-xl font-bold text-purple-900 font-sf-pro">
          <Car className="h-6 w-6 mr-3 text-purple-600" />
          {isNautico ? 'Informações da Embarcação' : 'Informações do Veículo'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {marca && marca !== '-' && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
            <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">
              Marca
            </label>
            <p className="text-xl font-bold text-gray-900 font-sf-pro">
              {marca}
            </p>
          </div>
        )}

        {vehicleModel && vehicleModel !== '-' && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
            <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">
              Modelo
            </label>
            <p className="text-xl font-bold text-gray-900 font-sf-pro">
              {vehicleModel}
            </p>
          </div>
        )}

        {anoModelo && anoModelo !== '-' && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
            <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">
              Ano do Modelo
            </label>
            <p className="text-xl font-bold text-gray-900 font-sf-pro">
              {anoModelo}
            </p>
          </div>
        )}

        {placa && placa !== '-' && !isNautico && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
            <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">
              Placa
            </label>
            <p className="text-xl font-bold text-gray-900 font-sf-pro">
              {placa}
            </p>
          </div>
        )}

        {nomeEmbarcacao && nomeEmbarcacao !== '-' && isNautico && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
            <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">
              Nome da Embarcação
            </label>
            <p className="text-xl font-bold text-gray-900 font-sf-pro">
              {nomeEmbarcacao}
            </p>
          </div>
        )}

        {deductible && deductible > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
            <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">
              Franquia
            </label>
            <p className="text-xl font-bold text-gray-900 font-sf-pro">
              {renderCurrency(deductible)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
