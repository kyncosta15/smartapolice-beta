
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, DollarSign, FileText, Building, Clock, Trash2, User } from 'lucide-react';
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
        return <Badge className="bg-green-100 text-green-700 font-sans">Ativa</Badge>;
      case 'expiring':
        return <Badge className="bg-orange-100 text-orange-700 font-sans">Vencendo</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700 font-sans">Vencida</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-700 font-sans">Em Análise</Badge>;
      default:
        return <Badge variant="secondary" className="font-sans">Desconhecido</Badge>;
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
  console.log('Document info calculated:', documentInfo);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto font-sans">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-16 font-sans">
            <span>Detalhes da Apólice</span>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDelete}
              className="mr-6 px-2 py-1 text-xs font-sans"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Excluir
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card className="font-sans">
            <CardHeader>
              <CardTitle className="flex items-center font-sans">
                <FileText className="h-5 w-5 mr-2" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 font-sans">Nome da Apólice</label>
                <p className="text-lg font-semibold font-sans">{policy.name}</p>
              </div>

              {/* Nome completo da pessoa segurada */}
              {policy.insuredName && (
                <div>
                  <label className="text-sm font-medium text-gray-500 font-sans">
                    Nome Completo do Segurado
                  </label>
                  <p className="flex items-center bg-gray-50 p-2 rounded border font-sans">
                    <User className="h-4 w-4 mr-2 text-blue-600" />
                    {policy.insuredName}
                  </p>
                </div>
              )}

              {/* CPF/CNPJ */}
              {documentInfo && (
                <div>
                  <label className="text-sm font-medium text-gray-500 font-sans">
                    {documentInfo.type}
                  </label>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded border font-sans">
                    {documentInfo.formatted}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-sans">
                    Tipo: {documentInfo.personType === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500 font-sans">Tipo</label>
                <p className="font-sans">{getTypeLabel(policy.type)}</p>
              </div>

              {/* Estado (UF) - movido para informações gerais */}
              {policy.uf && (
                <div>
                  <label className="text-sm font-medium text-gray-500 font-sans">Estado (UF)</label>
                  <p className="text-lg font-semibold font-sans">{policy.uf}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500 font-sans">Status</label>
                <div className="mt-1">
                  {getStatusBadge(policy.status)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 font-sans">Número da Apólice</label>
                <p className="font-mono text-sm font-sans">{policy.policyNumber}</p>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Seguradora */}
          <Card className="font-sans">
            <CardHeader>
              <CardTitle className="flex items-center font-sans">
                <Building className="h-5 w-5 mr-2" />
                Seguradora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 font-sans">Empresa</label>
                <p className="text-lg font-semibold font-sans">{policy.insurer}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 font-sans">Cobertura</label>
                <p className="font-sans">{policy.coverage}</p>
              </div>

              {policy.entity && policy.entity !== policy.insurer && (
                <div>
                  <label className="text-sm font-medium text-gray-500 font-sans">Corretora</label>
                  <p className="font-sans">{policy.entity}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações do Veículo - APENAS para seguros Auto */}
          {policy.type === 'auto' && (policy.vehicleModel || policy.deductible) && (
            <Card className="font-sans">
              <CardHeader>
                <CardTitle className="flex items-center font-sans">
                  <FileText className="h-5 w-5 mr-2" />
                  Informações do Veículo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {policy.vehicleModel && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 font-sans">Modelo do Veículo</label>
                    <p className="text-lg font-semibold font-sans">{policy.vehicleModel}</p>
                  </div>
                )}

                {policy.deductible && policy.deductible > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 font-sans">Franquia</label>
                    <p className="text-lg font-semibold font-sans">
                      R$ {policy.deductible.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações Financeiras */}
          <Card className="font-sans">
            <CardHeader>
              <CardTitle className="flex items-center font-sans">
                <DollarSign className="h-5 w-5 mr-2" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 font-sans">Prêmio Anual</label>
                <p className="text-2xl font-bold text-green-600 font-sans">
                  R$ {policy.premium?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 font-sans">Prêmio Mensal</label>
                <p className="text-lg font-semibold font-sans">
                  R$ {(policy.premium / 12)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {policy.paymentForm && (
                <div>
                  <label className="text-sm font-medium text-gray-500 font-sans">Forma de Pagamento</label>
                  <p className="font-sans">{policy.paymentForm}</p>
                </div>
              )}

              {policy.installments && (
                <div>
                  <label className="text-sm font-medium text-gray-500 font-sans">Parcelas</label>
                  <p className="font-sans">{policy.installments}x</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de Vigência */}
          <Card className="font-sans">
            <CardHeader>
              <CardTitle className="flex items-center font-sans">
                <Calendar className="h-5 w-5 mr-2" />
                Vigência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 font-sans">Data de Início</label>
                <p className="font-sans">{new Date(policy.startDate).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 font-sans">Data de Fim</label>
                <p className="font-sans">{new Date(policy.endDate).toLocaleDateString('pt-BR')}</p>
              </div>

              {policy.extractedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 font-sans">Extraído em</label>
                  <p className="flex items-center font-sans">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(policy.extractedAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(policy.extractedAt).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              )}

              {policy.fileName && (
                <div>
                  <label className="text-sm font-medium text-gray-500 font-sans">Arquivo Original</label>
                  <p className="text-sm bg-gray-100 p-2 rounded font-sans">{policy.fileName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card do Responsável */}
          <Card className="font-sans">
            <CardHeader>
              <h1 className="text-lg font-semibold font-sans">Responsável</h1>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <User className="h-8 w-8 mx-auto text-blue-600" />
              <p className="text-sm font-medium font-sans">
                {policy.responsavel_nome || 'Não definido'}
              </p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
