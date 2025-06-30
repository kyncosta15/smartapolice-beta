
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
        return <Badge className="bg-green-100 text-green-700">Ativa</Badge>;
      case 'expiring':
        return <Badge className="bg-orange-100 text-orange-700">Vencendo</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700">Vencida</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-700">Em Análise</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      auto: 'Seguro Auto',
      vida: 'Seguro de Vida',
      saude: 'Seguro Saúde',
      empresarial: 'Empresarial',
      patrimonial: 'Patrimonial'
    };
    return types[type] || type;
  };

  // Detectar documento a partir dos dados da apólice
  const getDocumentInfo = () => {
    // Verificar se há documento específico nos campos
    if (policy.insuredDocument) {
      return DocumentValidator.detectDocument(policy.insuredDocument);
    }
    
    if (policy.insuredCpfCnpj) {
      return DocumentValidator.detectDocument(policy.insuredCpfCnpj);
    }
    
    // Tentar detectar documento no número da apólice ou outros campos de texto
    const textToAnalyze = `${policy.policyNumber} ${policy.name} ${policy.insurer}`;
    return DocumentValidator.detectDocument(textToAnalyze);
  };

  const documentInfo = getDocumentInfo();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes da Apólice</span>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDelete}
              className="ml-4"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome da Apólice</label>
                <p className="text-lg font-semibold">{policy.name}</p>
              </div>

              {/* Nome completo logo abaixo do nome da apólice */}
              <div>
                <label className="text-sm font-medium text-gray-500">Nome completo</label>
                <p className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  {policy.insuredName || 'Não informado'}
                </p>
              </div>

              {/* CPF ou CNPJ logo abaixo do nome completo */}
              {documentInfo && (
                <div>
                  <label className="text-sm font-medium text-gray-500">CPF ou CNPJ</label>
                  <div className="flex flex-col gap-1">
                    <p className="font-mono text-sm">{documentInfo.formatted}</p>
                    <Badge 
                      className={`w-fit ${
                        documentInfo.personType === 'PF' 
                          ? 'bg-blue-50 text-blue-600 border-blue-200' 
                          : 'bg-purple-50 text-purple-600 border-purple-200'
                      }`}
                    >
                      {documentInfo.personType === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </Badge>
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-500">Tipo</label>
                <p>{getTypeLabel(policy.type)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  {getStatusBadge(policy.status)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Número da Apólice</label>
                <p className="font-mono text-sm">{policy.policyNumber}</p>
              </div>
            </CardContent>
          </Card>

          {/* Informações da Seguradora */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Seguradora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Empresa</label>
                <p className="text-lg font-semibold">{policy.insurer}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Categoria</label>
                <p>{policy.category}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Cobertura</label>
                <p>{policy.coverage}</p>
              </div>

              {policy.entity && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Entidade</label>
                  <p>{policy.entity}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Prêmio Anual</label>
                <p className="text-2xl font-bold text-green-600">
                  R$ {policy.premium?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Prêmio Mensal</label>
                <p className="text-lg font-semibold">
                  R$ {(policy.premium / 12)?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {policy.paymentForm && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Forma de Pagamento</label>
                  <p>{policy.paymentForm}</p>
                </div>
              )}

              {policy.installments && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Parcelas</label>
                  <p>{policy.installments}x</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de Vigência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Vigência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Data de Início</label>
                <p>{new Date(policy.startDate).toLocaleDateString('pt-BR')}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Data de Fim</label>
                <p>{new Date(policy.endDate).toLocaleDateString('pt-BR')}</p>
              </div>

              {policy.extractedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Extraído em</label>
                  <p className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(policy.extractedAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(policy.extractedAt).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              )}

              {policy.fileName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Arquivo Original</label>
                  <p className="text-sm bg-gray-100 p-2 rounded">{policy.fileName}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
