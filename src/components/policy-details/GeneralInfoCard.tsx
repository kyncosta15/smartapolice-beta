
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, MapPin } from 'lucide-react';
import { DocumentValidator } from '@/utils/documentValidator';

interface GeneralInfoCardProps {
  policy: any;
}

export const GeneralInfoCard = ({ policy }: GeneralInfoCardProps) => {
  // Função para obter informações do documento do N8N
  const getDocumentInfo = () => {
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
        nomeCompleto: policy.insuredName
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
  );
};
