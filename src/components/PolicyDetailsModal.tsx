
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
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium font-sf-pro">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>
            Ativa
          </Badge>
        );
      case 'expiring':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium font-sf-pro">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse"></div>
            Vencendo
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 font-medium font-sf-pro">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></div>
            Vencida
          </Badge>
        );
      case 'under_review':
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium font-sf-pro">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
            Em Análise
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="font-sf-pro">Desconhecido</Badge>;
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm font-sf-pro">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900 mb-2 font-sf-pro">
                {policy.name}
              </DialogTitle>
              <div className="flex items-center gap-3">
                {getStatusBadge(policy.status)}
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-medium font-sf-pro">
                  {getTypeLabel(policy.type)}
                </Badge>
              </div>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDelete}
              className="font-sf-pro hover:bg-red-600 transition-colors duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Informações Básicas */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900 font-sf-pro">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/60 rounded-lg p-3">
                <label className="text-sm font-medium text-gray-600 font-sf-pro">Nome da Apólice</label>
                <p className="text-lg font-bold text-gray-900 font-sf-pro">{policy.name}</p>
              </div>

              {/* Nome completo da pessoa segurada */}
              {policy.insuredName && (
                <div className="bg-white/60 rounded-lg p-3">
                  <label className="text-sm font-medium text-gray-600 font-sf-pro flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Nome Completo do Segurado
                  </label>
                  <p className="text-base font-semibold text-gray-900 font-sf-pro">{policy.insuredName}</p>
                </div>
              )}

              {/* CPF/CNPJ */}
              {documentInfo && (
                <div className="bg-white/60 rounded-lg p-3">
                  <label className="text-sm font-medium text-gray-600 font-sf-pro">
                    {documentInfo.type}
                  </label>
                  <p className="font-mono text-base font-semibold text-gray-900 font-sf-pro">
                    {documentInfo.formatted}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-sf-pro">
                    {documentInfo.personType === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </p>
                </div>
              )}

              {/* Estado (UF) */}
              {policy.uf && (
                <div className="bg-white/60 rounded-lg p-3">
                  <label className="text-sm font-medium text-gray-600 font-sf-pro flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Estado (UF)
                  </label>
                  <p className="text-lg font-semibold text-gray-900 font-sf-pro">{policy.uf}</p>
                </div>
              )}

              <div className="bg-white/60 rounded-lg p-3">
                <label className="text-sm font-medium text-gray-600 font-sf-pro">Número da Apólice</label>
                <p className="font-mono text-sm text-gray-900 font-sf-pro">{policy.policyNumber}</p>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Seguradora */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900 font-sf-pro">
                <Building className="h-5 w-5 mr-2 text-green-600" />
                Seguradora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/60 rounded-lg p-3">
                <label className="text-sm font-medium text-gray-600 font-sf-pro">Empresa</label>
                <p className="text-lg font-bold text-gray-900 font-sf-pro">{policy.insurer}</p>
              </div>

              <div className="bg-white/60 rounded-lg p-3">
                <label className="text-sm font-medium text-gray-600 font-sf-pro">Cobertura</label>
                <p className="text-base text-gray-900 font-sf-pro">{policy.coverage}</p>
              </div>

              {policy.entity && policy.entity !== policy.insurer && (
                <div className="bg-white/60 rounded-lg p-3">
                  <label className="text-sm font-medium text-gray-600 font-sf-pro">Corretora</label>
                  <p className="text-base text-gray-900 font-sf-pro">{policy.entity}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Veículo - APENAS para seguros Auto */}
          {policy.type === 'auto' && (policy.vehicleModel || policy.deductible) && (
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900 font-sf-pro">
                  <Car className="h-5 w-5 mr-2 text-purple-600" />
                  Informações do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {policy.vehicleModel && (
                  <div className="bg-white/60 rounded-lg p-3">
                    <label className="text-sm font-medium text-gray-600 font-sf-pro">Modelo do Veículo</label>
                    <p className="text-lg font-bold text-gray-900 font-sf-pro">{policy.vehicleModel}</p>
                  </div>
                )}

                {policy.deductible && policy.deductible > 0 && (
                  <div className="bg-white/60 rounded-lg p-3">
                    <label className="text-sm font-medium text-gray-600 font-sf-pro">Franquia</label>
                    <p className="text-lg font-bold text-gray-900 font-sf-pro">
                      R$ {policy.deductible.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações Financeiras */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900 font-sf-pro">
                <DollarSign className="h-5 w-5 mr-2 text-orange-600" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4">
                <label className="text-sm font-medium text-green-700 font-sf-pro">Prêmio Anual</label>
                <p className="text-3xl font-bold text-green-700 font-sf-pro">
                  R$ {policy.premium?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="bg-white/60 rounded-lg p-3">
                <label className="text-sm font-medium text-gray-600 font-sf-pro">Prêmio Mensal</label>
                <p className="text-xl font-bold text-gray-900 font-sf-pro">
                  R$ {(policy.premium / 12)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {policy.paymentForm && (
                <div className="bg-white/60 rounded-lg p-3">
                  <label className="text-sm font-medium text-gray-600 font-sf-pro flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Forma de Pagamento
                  </label>
                  <p className="text-base text-gray-900 font-sf-pro">{policy.paymentForm}</p>
                </div>
              )}

              {policy.installments && (
                <div className="bg-white/60 rounded-lg p-3">
                  <label className="text-sm font-medium text-gray-600 font-sf-pro">Parcelas</label>
                  <p className="text-base font-semibold text-gray-900 font-sf-pro">{policy.installments}x</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de Vigência */}
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900 font-sf-pro">
                <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                Vigência & Histórico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 rounded-lg p-3">
                  <label className="text-sm font-medium text-gray-600 font-sf-pro">Data de Início</label>
                  <p className="text-base font-semibold text-gray-900 font-sf-pro">{new Date(policy.startDate).toLocaleDateString('pt-BR')}</p>
                </div>
                
                <div className="bg-white/60 rounded-lg p-3">
                  <label className="text-sm font-medium text-gray-600 font-sf-pro">Data de Fim</label>
                  <p className="text-base font-semibold text-gray-900 font-sf-pro">{new Date(policy.endDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {policy.extractedAt && (
                <div className="bg-white/60 rounded-lg p-3">
                  <label className="text-sm font-medium text-gray-600 font-sf-pro flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Extraído em
                  </label>
                  <p className="text-sm text-gray-900 font-sf-pro">
                    {new Date(policy.extractedAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(policy.extractedAt).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              )}

              {policy.fileName && (
                <div className="bg-white/60 rounded-lg p-3">
                  <label className="text-sm font-medium text-gray-600 font-sf-pro">Arquivo Original</label>
                  <p className="text-sm bg-gray-100 p-2 rounded border font-sf-pro">{policy.fileName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card do Responsável */}
          <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-900 font-sf-pro">
                <Shield className="h-5 w-5 mr-2 text-gray-600" />
                Responsável
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-base font-semibold text-gray-900 font-sf-pro">
                {policy.responsavel_nome || 'Não definido'}
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
