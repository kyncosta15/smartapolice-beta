
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, DollarSign, FileText, Building, Clock, Trash2, User, Shield, Car, MapPin, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DocumentValidator } from '@/utils/documentValidator';

interface PolicyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: any;
  onDelete: (policyId: string) => void;
}

export const PolicyDetailsModal = ({ isOpen, onClose, policy, onDelete }: PolicyDetailsModalProps) => {
  const { toast } = useToast();

  if (!policy) return null;

  const handleDelete = () => {
    onDelete(policy.id);
    toast({
      title: "Apólice Removida",
      description: `${policy.name} foi removida com sucesso`,
      variant: "default"
    });
    onClose();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 bg-emerald-600 rounded-full mr-2"></div>
            Ativa
          </Badge>
        );
      case 'expiring':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 bg-amber-600 rounded-full mr-2 animate-pulse"></div>
            Vencendo
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
            Vencida
          </Badge>
        );
      case 'under_review':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
            Em Análise
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="font-sf-pro px-3 py-1.5 shadow-sm">Desconhecido</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      auto: 'Seguro Auto',
      vida: 'Seguro de Vida',
      saude: 'Seguro Saúde',
      empresarial: 'Empresarial',
      patrimonial: 'Patrimonial',
      acidentes_pessoais: 'Acidentes Pessoais'
    };
    return types[type] || type;
  };

  // Função para obter informações do documento do N8N - CORRIGIDA
  const getDocumentInfo = () => {
    console.log('Policy data for document detection:', {
      documento: policy.documento,
      documento_tipo: policy.documento_tipo,
      insuredName: policy.insuredName,
      policy: policy
    });

    // Priorizar dados vindos do N8N
    if (policy.documento && policy.documento_tipo) {
      const documentType = policy.documento_tipo;
      const personType = policy.documento_tipo === 'CPF' ? 'PF' : 'PJ';
      
      // Formatar o número do documento
      let formatted = policy.documento;
      if (policy.documento_tipo === 'CPF' && policy.documento.length >= 11) {
        const cleanDoc = policy.documento.replace(/\D/g, '');
        if (cleanDoc.length === 11) {
          formatted = cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
      } else if (policy.documento_tipo === 'CNPJ' && policy.documento.length >= 14) {
        const cleanDoc = policy.documento.replace(/\D/g, '');
        if (cleanDoc.length === 14) {
          formatted = cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
      }
      
      return {
        type: documentType,
        personType: personType,
        formatted: formatted,
        rawValue: policy.documento,
        nomeCompleto: policy.insuredName // Nome completo do segurado
      };
    }
    
    // Fallback para detecção automática
    if (policy.insuredDocument) {
      return DocumentValidator.detectDocument(policy.insuredDocument);
    }
    
    if (policy.insuredCpfCnpj) {
      return DocumentValidator.detectDocument(policy.insuredCpfCnpj);
    }
    
    return null;
  };

  const documentInfo = getDocumentInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-2xl font-sf-pro">
        <DialogHeader className="border-b border-gray-200 pb-6 px-8 pt-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-3xl font-bold text-gray-900 mb-4 font-sf-pro leading-tight">
                {policy.name}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-3">
                {getStatusBadge(policy.status)}
                <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-semibold font-sf-pro px-3 py-1.5 shadow-sm">
                  {getTypeLabel(policy.type)}
                </Badge>
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDelete}
              className="font-sf-pro font-medium hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg px-4 py-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações Gerais */}
            <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
              <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-blue-200 pb-4">
                <CardTitle className="flex items-center text-xl font-bold text-blue-900 font-sf-pro">
                  <FileText className="h-6 w-6 mr-3 text-blue-600" />
                  Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                  <label className="text-sm font-medium text-blue-700 font-sf-pro block mb-1">Nome da Apólice</label>
                  <p className="text-xl font-bold text-gray-900 font-sf-pro">{policy.name}</p>
                </div>

                {policy.insuredName && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <label className="text-sm font-medium text-blue-700 font-sf-pro flex items-center gap-2 mb-1">
                      <User className="h-4 w-4" />
                      Nome Completo do Segurado
                    </label>
                    <p className="text-lg font-semibold text-gray-900 font-sf-pro">{policy.insuredName}</p>
                  </div>
                )}

                {documentInfo && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <label className="text-sm font-medium text-blue-700 font-sf-pro block mb-1">
                      {documentInfo.type}
                    </label>
                    <p className="font-mono text-lg font-bold text-gray-900 font-sf-pro">
                      {documentInfo.formatted}
                    </p>
                    <p className="text-xs text-blue-600 mt-2 font-sf-pro font-medium">
                      {documentInfo.personType === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </p>
                  </div>
                )}

                {policy.uf && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <label className="text-sm font-medium text-blue-700 font-sf-pro flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4" />
                      Estado (UF)
                    </label>
                    <p className="text-xl font-bold text-gray-900 font-sf-pro">{policy.uf}</p>
                  </div>
                )}

                <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                  <label className="text-sm font-medium text-blue-700 font-sf-pro block mb-1">Número da Apólice</label>
                  <p className="font-mono text-base font-semibold text-gray-900 font-sf-pro">{policy.policyNumber}</p>
                </div>
              </CardContent>
            </Card>

            {/* Informações da Seguradora */}
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
          </div>

          {/* Segunda linha de cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações do Veículo - APENAS para seguros Auto */}
            {policy.type === 'auto' && (policy.vehicleModel || policy.deductible) && (
              <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden">
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
            )}

            {/* Informações Financeiras */}
            <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 overflow-hidden">
              <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-amber-200 pb-4">
                <CardTitle className="flex items-center text-xl font-bold text-amber-900 font-sf-pro">
                  <DollarSign className="h-6 w-6 mr-3 text-amber-600" />
                  Informações Financeiras
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6 shadow-md">
                  <label className="text-sm font-medium text-white/90 font-sf-pro block mb-2">Prêmio Anual</label>
                  <p className="text-3xl font-bold text-white font-sf-pro">
                    R$ {policy.premium?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
                  <label className="text-sm font-medium text-amber-700 font-sf-pro block mb-1">Prêmio Mensal</label>
                  <p className="text-2xl font-bold text-gray-900 font-sf-pro">
                    R$ {(policy.premium / 12)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {policy.paymentForm && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
                    <label className="text-sm font-medium text-amber-700 font-sf-pro flex items-center gap-2 mb-1">
                      <CreditCard className="h-4 w-4" />
                      Forma de Pagamento
                    </label>
                    <p className="text-base font-medium text-gray-900 font-sf-pro">{policy.paymentForm}</p>
                  </div>
                )}

                {policy.installments && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100">
                    <label className="text-sm font-medium text-amber-700 font-sf-pro block mb-1">Parcelas</label>
                    <p className="text-lg font-bold text-gray-900 font-sf-pro">{policy.installments}x</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Terceira linha de cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Informações de Vigência */}
            <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 overflow-hidden">
              <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-indigo-200 pb-4">
                <CardTitle className="flex items-center text-xl font-bold text-indigo-900 font-sf-pro">
                  <Calendar className="h-6 w-6 mr-3 text-indigo-600" />
                  Vigência & Histórico
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                    <label className="text-sm font-medium text-indigo-700 font-sf-pro block mb-1">Data de Início</label>
                    <p className="text-base font-bold text-gray-900 font-sf-pro">{new Date(policy.startDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                    <label className="text-sm font-medium text-indigo-700 font-sf-pro block mb-1">Data de Fim</label>
                    <p className="text-base font-bold text-gray-900 font-sf-pro">{new Date(policy.endDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {policy.extractedAt && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                    <label className="text-sm font-medium text-indigo-700 font-sf-pro flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4" />
                      Extraído em
                    </label>
                    <p className="text-sm font-medium text-gray-900 font-sf-pro">
                      {new Date(policy.extractedAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(policy.extractedAt).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                )}

                {policy.fileName && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                    <label className="text-sm font-medium text-indigo-700 font-sf-pro block mb-1">Arquivo Original</label>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg border font-sf-pro font-medium text-gray-700 break-all">{policy.fileName}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card do Responsável */}
            <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
              <CardHeader className="bg-white/80 backdrop-blur-sm border-b border-slate-200 pb-4">
                <CardTitle className="flex items-center text-xl font-bold text-slate-900 font-sf-pro">
                  <Shield className="h-6 w-6 mr-3 text-slate-600" />
                  Responsável
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="h-10 w-10 text-white" />
                </div>
                <p className="text-xl font-bold text-slate-900 font-sf-pro">
                  {policy.responsavel_nome || 'Não definido'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
