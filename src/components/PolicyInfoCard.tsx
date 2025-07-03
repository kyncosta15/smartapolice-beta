
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User } from 'lucide-react';
import { DocumentValidator } from '@/utils/documentValidator';
import { ParsedPolicyData } from '@/utils/policyDataParser';

interface PolicyInfoCardProps {
  policy: ParsedPolicyData;
}

export function PolicyInfoCard({ policy }: PolicyInfoCardProps) {
  // Usar dados de documento do N8N se disponíveis, caso contrário detectar
  const getDocumentInfo = () => {
    // Priorizar dados vindos do N8N
    if (policy.documento && policy.documento_tipo) {
      const documentType = policy.documento_tipo === 'CPF' ? 'PF' : 'PJ';
      
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
        type: policy.documento_tipo,
        personType: documentType,
        formatted: formatted,
        rawValue: policy.documento,
        nomeCompleto: policy.insuredName // Nome do segurado
      };
    }
    
    // Fallback para detecção automática no número da apólice ou outros campos de texto
    const textToAnalyze = `${policy.policyNumber} ${policy.name} ${policy.insurer}`;
    const docInfo = DocumentValidator.detectDocument(textToAnalyze);
    return docInfo;
  };

  const documentInfo = getDocumentInfo();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-50 text-green-600 border-green-200">Ativa</Badge>;
      case 'expiring':
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200">Vencendo</Badge>;
      case 'expired':
        return <Badge className="bg-red-50 text-red-600 border-red-200">Vencida</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      auto: 'Auto',
      vida: 'Vida',
      saude: 'Saúde',
      patrimonial: 'Patrimonial',
      empresarial: 'Empresarial',
      acidentes_pessoais: 'Acidentes Pessoais'
    };
    return types[type] || type;
  };

  const getPersonTypeBadge = () => {
    if (!documentInfo) return null;
    
    const isPersonaFisica = documentInfo.personType === 'PF';
    return (
      <Badge 
        className={`${
          isPersonaFisica 
            ? 'bg-blue-50 text-blue-600 border-blue-200' 
            : 'bg-purple-50 text-purple-600 border-purple-200'
        }`}
      >
        <User className="h-3 w-3 mr-1" />
        {isPersonaFisica ? 'Pessoa Física' : 'Pessoa Jurídica'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Informações Gerais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Nome da Apólice</p>
          <p className="font-semibold text-gray-900">{policy.name}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Tipo</p>
          <p className="text-gray-900">{getTypeLabel(policy.type)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-2">Status</p>
          {getStatusBadge(policy.status)}
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Número da Apólice</p>
          <p className="font-mono text-gray-900">{policy.policyNumber}</p>
        </div>

        {/* Nome do Segurado */}
        {policy.insuredName && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Nome do Segurado</p>
            <p className="text-gray-900">{policy.insuredName}</p>
          </div>
        )}

        {/* Documento (CPF/CNPJ) */}
        {documentInfo && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Documento</p>
            <div className="flex flex-col gap-2">
              {getPersonTypeBadge()}
              <div className="text-xs text-gray-600">
                <span className="font-medium">{documentInfo.type}:</span> {documentInfo.formatted}
              </div>
            </div>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-500 mb-1">Seguradora</p>
          <p className="text-gray-900">{policy.insurer}</p>
        </div>
      </CardContent>
    </Card>
  );
}
