
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Pencil, Save, X, Plus } from 'lucide-react';
import { renderValue, renderCurrency } from '@/utils/renderValue';
import { usePersistedPolicies } from '@/hooks/usePersistedPolicies';
import { toast } from '@/hooks/use-toast';

interface VehicleInfoCardProps {
  policy: any;
  onUpdate?: () => void;
}

export const VehicleInfoCard = ({ policy, onUpdate }: VehicleInfoCardProps) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { updatePolicy } = usePersistedPolicies();

  const normalizedType = policy?.type?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
  const isVehicleType = normalizedType === 'auto' || normalizedType === 'nautico';
  const isNautico = normalizedType === 'nautico';

  const [form, setForm] = useState({
    marca: policy?.marca || '',
    vehicleModel: policy?.vehicleModel || policy?.modelo_veiculo || '',
    ano_modelo: policy?.ano_modelo || '',
    placa: policy?.placa || '',
    nome_embarcacao: policy?.nome_embarcacao || '',
    franquia: policy?.deductible ?? policy?.franquia ?? 0,
  });

  if (!isVehicleType) return null;

  const vehicleModel = renderValue(policy?.vehicleModel || policy?.veiculo?.modelo || policy?.modelo_veiculo);
  const marca = renderValue(policy?.marca);
  const placa = renderValue(policy?.placa);
  const nomeEmbarcacao = renderValue(policy?.nome_embarcacao);
  const anoModelo = renderValue(policy?.ano_modelo);
  const deductible = policy?.deductible ?? policy?.franquia ?? 0;

  const hasVehicleData = (marca && marca !== '-') || (vehicleModel && vehicleModel !== '-') || (placa && placa !== '-') || (nomeEmbarcacao && nomeEmbarcacao !== '-');

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = {
        marca: form.marca,
        vehicleModel: form.vehicleModel,
        ano_modelo: form.ano_modelo,
        franquia: parseFloat(String(form.franquia)) || 0,
      };
      if (!isNautico) updates.placa = form.placa;
      if (isNautico) updates.nome_embarcacao = form.nome_embarcacao;

      const success = await updatePolicy(policy.id, updates);
      if (success) {
        toast({ title: '✅ Veículo atualizado', description: 'Dados do veículo salvos com sucesso.' });
        setEditing(false);
        onUpdate?.();
      }
    } catch (e) {
      toast({ title: '❌ Erro', description: 'Não foi possível salvar.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setForm({
      marca: policy?.marca || '',
      vehicleModel: policy?.vehicleModel || policy?.modelo_veiculo || '',
      ano_modelo: policy?.ano_modelo || '',
      placa: policy?.placa || '',
      nome_embarcacao: policy?.nome_embarcacao || '',
      franquia: policy?.deductible ?? policy?.franquia ?? 0,
    });
    setEditing(true);
  };

  if (editing) {
    return (
      <Card className="flex flex-col h-full border-0 shadow-lg rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden">
        <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-purple-200 pb-4">
          <CardTitle className="flex items-center justify-between text-xl font-bold text-purple-900 font-sf-pro">
            <div className="flex items-center">
              <Car className="h-6 w-6 mr-3 text-purple-600" />
              {isNautico ? 'Editar Embarcação' : 'Editar Veículo'}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div>
            <Label className="text-sm text-purple-700">Marca</Label>
            <Input value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} placeholder="Ex: Toyota" />
          </div>
          <div>
            <Label className="text-sm text-purple-700">Modelo</Label>
            <Input value={form.vehicleModel} onChange={e => setForm(f => ({ ...f, vehicleModel: e.target.value }))} placeholder="Ex: Corolla" />
          </div>
          <div>
            <Label className="text-sm text-purple-700">Ano Modelo</Label>
            <Input value={form.ano_modelo} onChange={e => setForm(f => ({ ...f, ano_modelo: e.target.value }))} placeholder="Ex: 2024" />
          </div>
          {!isNautico && (
            <div>
              <Label className="text-sm text-purple-700">Placa</Label>
              <Input value={form.placa} onChange={e => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))} placeholder="Ex: ABC1D23" maxLength={10} />
            </div>
          )}
          {isNautico && (
            <div>
              <Label className="text-sm text-purple-700">Nome da Embarcação</Label>
              <Input value={form.nome_embarcacao} onChange={e => setForm(f => ({ ...f, nome_embarcacao: e.target.value }))} placeholder="Nome da embarcação" />
            </div>
          )}
          <div>
            <Label className="text-sm text-purple-700">Franquia (R$)</Label>
            <Input type="number" value={form.franquia} onChange={e => setForm(f => ({ ...f, franquia: e.target.value }))} placeholder="0.00" min={0} step="0.01" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full border-0 shadow-lg rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden">
      <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-purple-200 pb-4">
        <CardTitle className="flex items-center justify-between text-xl font-bold text-purple-900 font-sf-pro">
          <div className="flex items-center">
            <Car className="h-6 w-6 mr-3 text-purple-600" />
            {isNautico ? 'Informações da Embarcação' : 'Informações do Veículo'}
          </div>
          <Button size="sm" variant="ghost" onClick={startEditing} className="text-purple-600 hover:text-purple-800 hover:bg-purple-100">
            {hasVehicleData ? <Pencil className="h-4 w-4" /> : <><Plus className="h-4 w-4 mr-1" /><span className="text-xs">Cadastrar</span></>}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {!hasVehicleData ? (
          <div className="text-center py-6">
            <Car className="h-12 w-12 mx-auto mb-3 text-purple-300" />
            <p className="text-sm text-gray-500 mb-3">Nenhum dado de veículo cadastrado</p>
            <Button size="sm" variant="outline" onClick={startEditing} className="border-purple-300 text-purple-600 hover:bg-purple-50">
              <Plus className="h-4 w-4 mr-1" />
              Cadastrar Veículo
            </Button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
              <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">Marca</label>
              <p className="text-xl font-bold text-gray-900 font-sf-pro">
                {marca && marca !== '-' ? marca : <span className="text-gray-400 text-base">Não informado</span>}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
              <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">Modelo</label>
              <p className="text-xl font-bold text-gray-900 font-sf-pro">
                {vehicleModel && vehicleModel !== '-' ? vehicleModel : <span className="text-gray-400 text-base">Não informado</span>}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
              <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">Ano do Modelo</label>
              <p className="text-xl font-bold text-gray-900 font-sf-pro">
                {anoModelo && anoModelo !== '-' ? anoModelo : <span className="text-gray-400 text-base">Não informado</span>}
              </p>
            </div>
            {!isNautico && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
                <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">Placa</label>
                <p className="text-xl font-bold text-gray-900 font-sf-pro">
                  {placa && placa !== '-' ? placa : <span className="text-gray-400 text-base">Não informado</span>}
                </p>
              </div>
            )}
            {isNautico && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
                <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">Nome da Embarcação</label>
                <p className="text-xl font-bold text-gray-900 font-sf-pro">
                  {nomeEmbarcacao && nomeEmbarcacao !== '-' ? nomeEmbarcacao : <span className="text-gray-400 text-base">Não informado</span>}
                </p>
              </div>
            )}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100">
              <label className="text-sm font-medium text-purple-700 font-sf-pro block mb-1">Franquia</label>
              <p className="text-xl font-bold text-gray-900 font-sf-pro">{renderCurrency(deductible)}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
