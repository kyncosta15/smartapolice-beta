import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  User, 
  Car, 
  Shield, 
  DollarSign, 
  Calendar,
  Edit,
  Download,
  ArrowLeft
} from 'lucide-react';

interface SmartApoliceDetalhesProps {
  selectedPolicy: any;
  onPolicyUpdate: (policy: any) => void;
  onSectionChange: (section: string) => void;
}

export function SmartApoliceDetalhes({
  selectedPolicy,
  onPolicyUpdate,
  onSectionChange
}: SmartApoliceDetalhesProps) {

  if (!selectedPolicy) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => onSectionChange('buscar')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar à Busca
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes da Apólice</h1>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma apólice selecionada
            </h3>
            <p className="text-gray-600 mb-4">
              Selecione uma apólice na aba Buscar para visualizar os detalhes
            </p>
            <Button onClick={() => onSectionChange('buscar')}>
              Ir para Busca
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ATIVA': { variant: 'default' as const, color: 'text-green-700 bg-green-100' },
      'CANCELADA': { variant: 'destructive' as const, color: 'text-red-700 bg-red-100' },
      'PENDENTE': { variant: 'secondary' as const, color: 'text-yellow-700 bg-yellow-100' },
      'VENCIDA': { variant: 'outline' as const, color: 'text-gray-700 bg-gray-100' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDENTE'];
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => onSectionChange('buscar')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalhes da Apólice</h1>
            <p className="text-gray-600">
              {selectedPolicy.apolice?.numero} - {selectedPolicy.veiculo?.placa}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cliente Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Tipo de Pessoa</label>
              <p className="text-gray-900">
                {selectedPolicy.cliente?.tipo_pessoa === 'FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">
                {selectedPolicy.cliente?.tipo_pessoa === 'FISICA' ? 'Nome' : 'Razão Social'}
              </label>
              <p className="text-gray-900">{selectedPolicy.cliente?.nome_razao || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">
                {selectedPolicy.cliente?.tipo_pessoa === 'FISICA' ? 'CPF' : 'CNPJ'}
              </label>
              <p className="text-gray-900 font-mono">
                {selectedPolicy.cliente?.cpf || selectedPolicy.cliente?.cnpj || 'N/A'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Telefone</label>
              <p className="text-gray-900">{selectedPolicy.cliente?.telefone_principal || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{selectedPolicy.cliente?.email || 'N/A'}</p>
            </div>

            {selectedPolicy.cliente?.endereco && (
              <div>
                <label className="text-sm font-medium text-gray-500">Endereço</label>
                <p className="text-gray-900">
                  {selectedPolicy.cliente.endereco.logradouro}, {selectedPolicy.cliente.endereco.numero}
                  <br />
                  {selectedPolicy.cliente.endereco.bairro} - {selectedPolicy.cliente.endereco.cidade}/{selectedPolicy.cliente.endereco.uf}
                  <br />
                  CEP: {selectedPolicy.cliente.endereco.cep}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="h-5 w-5 mr-2" />
              Informações do Veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Placa</label>
              <p className="text-gray-900 font-mono font-semibold text-lg">
                {selectedPolicy.veiculo?.placa || 'N/A'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Marca/Modelo</label>
              <p className="text-gray-900">
                {selectedPolicy.veiculo?.marca} {selectedPolicy.veiculo?.modelo}
                {selectedPolicy.veiculo?.versao && ` - ${selectedPolicy.veiculo.versao}`}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Ano Modelo</label>
                <p className="text-gray-900">{selectedPolicy.veiculo?.ano_modelo || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Ano Fabricação</label>
                <p className="text-gray-900">{selectedPolicy.veiculo?.ano_fabricacao || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Categoria</label>
              <p className="text-gray-900">{selectedPolicy.veiculo?.categoria || 'N/A'}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Chassi</label>
                <p className="text-gray-900 font-mono text-sm">
                  {selectedPolicy.veiculo?.chassi || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">RENAVAM</label>
                <p className="text-gray-900 font-mono">
                  {selectedPolicy.veiculo?.renavam || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Combustível</label>
                <p className="text-gray-900">{selectedPolicy.veiculo?.combustivel || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Cor</label>
                <p className="text-gray-900">{selectedPolicy.veiculo?.cor || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Policy Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Informações da Apólice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Seguradora</label>
              <p className="text-gray-900 font-semibold">{selectedPolicy.apolice?.seguradora || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Número da Apólice</label>
              <p className="text-gray-900 font-mono">{selectedPolicy.apolice?.numero || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Ramo</label>
              <p className="text-gray-900">{selectedPolicy.apolice?.ramo || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                {getStatusBadge(selectedPolicy.apolice?.status || 'PENDENTE')}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Início Vigência</label>
                <p className="text-gray-900">
                  {formatDate(selectedPolicy.apolice?.vigencia_inicio)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Fim Vigência</label>
                <p className="text-gray-900">
                  {formatDate(selectedPolicy.apolice?.vigencia_fim)}
                </p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Classe Bônus</label>
              <p className="text-gray-900">{selectedPolicy.apolice?.classe_bonus || 'N/A'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Forma de Pagamento</label>
              <p className="text-gray-900">{selectedPolicy.apolice?.forma_pagamento || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Informações Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Prêmio Total</label>
              <p className="text-gray-900 font-semibold text-lg">
                {formatCurrency(selectedPolicy.apolice?.premio_total || 0)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Valor da Parcela</label>
                <p className="text-gray-900">
                  {formatCurrency(selectedPolicy.apolice?.premio_parcela || 0)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Qtd. Parcelas</label>
                <p className="text-gray-900">{selectedPolicy.apolice?.qtd_parcelas || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Franquia</label>
              <p className="text-gray-900">
                {formatCurrency(selectedPolicy.apolice?.franquia || 0)}
              </p>
            </div>

            {/* Coverage List */}
            {selectedPolicy.apolice?.coberturas && (
              <div>
                <label className="text-sm font-medium text-gray-500">Coberturas</label>
                <div className="mt-2 space-y-2">
                  {selectedPolicy.apolice.coberturas.map((cobertura: any, index: number) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <span className="text-gray-900">{cobertura.descricao}</span>
                      {cobertura.lmi && (
                        <span className="text-gray-600 font-mono">
                          LMI: {formatCurrency(cobertura.lmi)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Observações */}
      {selectedPolicy.apolice?.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900">{selectedPolicy.apolice.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}