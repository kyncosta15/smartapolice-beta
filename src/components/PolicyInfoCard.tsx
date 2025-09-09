
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, User } from 'lucide-react';
import { DocumentValidator } from '@/utils/documentValidator';
import { ParsedPolicyData } from '@/utils/policyDataParser';
import { useIsMobile } from '@/hooks/use-mobile';
import { extractFieldValue } from '@/utils/extractFieldValue';

interface PolicyInfoCardProps {
  policy: ParsedPolicyData;
}

export function PolicyInfoCard({ policy }: PolicyInfoCardProps) {
  const isMobile = useIsMobile();

  // Função para extrair nome da seguradora de forma segura
  const getInsurerName = (insurerData: any): string => {
    console.log('🏢 Extraindo nome da seguradora:', insurerData);
    
    if (!insurerData) return 'Não informado';
    
    if (typeof insurerData === 'string') {
      try {
        // Tentar fazer parse se for uma string JSON
        const parsed = JSON.parse(insurerData);
        return parsed.empresa || parsed.name || 'Seguradora não informada';
      } catch {
        // Se não for JSON válido, retornar a string mesmo
        return insurerData;
      }
    }
    
    if (typeof insurerData === 'object') {
      return insurerData.empresa || insurerData.name || 'Seguradora não informada';
    }
    
    return String(insurerData);
  };

  // Usar dados de documento do N8N se disponíveis, caso contrário detectar
  const getDocumentInfo = () => {
    const documento = extractFieldValue(policy.documento);
    const documentoTipo = extractFieldValue(policy.documento_tipo);
    
    // Priorizar dados vindos do N8N
    if (documento && documentoTipo) {
      const documentType = documentoTipo === 'CPF' ? 'PF' : 'PJ';
      
      // Formatar o número do documento
      let formatted = documento;
      if (documentoTipo === 'CPF' && documento.length >= 11) {
        const cleanDoc = documento.replace(/\D/g, '');
        if (cleanDoc.length === 11) {
          formatted = cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
      } else if (documentoTipo === 'CNPJ' && documento.length >= 14) {
        const cleanDoc = documento.replace(/\D/g, '');
        if (cleanDoc.length === 14) {
          formatted = cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
      }
      
      return {
        type: documentoTipo,
        personType: documentType,
        formatted: formatted,
        rawValue: documento,
        nomeCompleto: extractFieldValue(policy.insuredName)
      };
    }
    
    // Fallback para detecção automática no número da apólice ou outros campos de texto
    const textToAnalyze = `${policy.policyNumber} ${policy.name} ${getInsurerName(policy.insurer)}`;
    const docInfo = DocumentValidator.detectDocument(textToAnalyze);
    return docInfo;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'vigente':
        return <Badge className="bg-green-50 text-green-600 border-green-200 hover:bg-green-50 font-sans">Ativa</Badge>;
      case 'expiring':
      case 'vencendo':
        return <Badge className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-50 font-sans">Vencendo</Badge>;
      case 'expired':
      case 'vencida':
        return <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50 font-sans">Vencida</Badge>;
      default:
        return <Badge variant="secondary" className="font-sans">Ativa</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const types = {
      auto: 'Seguro Auto',
      vida: 'Seguro de Vida',
      saude: 'Seguro Saúde',
      patrimonial: 'Seguro Patrimonial',
      empresarial: 'Seguro Empresarial',
      acidentes_pessoais: 'Acidentes Pessoais'
    };
    return types[type] || 'Seguro Auto';
  };

  const getPersonTypeBadge = () => {
    if (!documentInfo) return null;
    
    const isPersonaFisica = documentInfo.personType === 'PF';
    return (
      <Badge 
        className={`${
          isPersonaFisica 
            ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-50' 
            : 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-50'
        } ${isMobile ? 'text-xs' : 'text-sm'} font-sans`}
      >
        <User className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
        {isPersonaFisica ? 'Pessoa Física' : 'Pessoa Jurídica'}
      </Badge>
    );
  };

  const documentInfo = getDocumentInfo();
  const insurerName = getInsurerName(policy.insurer);
  const insuredNameValue = extractFieldValue(policy.insuredName);

  return (
    <Card className="h-full shadow-md border-gray-200 hover:shadow-lg transition-all duration-200 font-sans">
      <CardHeader className={`${isMobile ? 'pb-3' : 'pb-4'}`}>
        <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'} font-sans`}>
          <FileText className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600`} />
          Informações Gerais
        </CardTitle>
      </CardHeader>
      <CardContent className={`space-y-${isMobile ? '3' : '4'}`}>
        <div>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1 font-medium font-sans`}>Nome da Apólice</p>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900 break-words font-sans`}>{policy.name}</p>
        </div>

        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-4'}`}>
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1 font-medium font-sans`}>Tipo</p>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-900 font-sans`}>{getTypeLabel(policy.type)}</p>
          </div>

          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1 font-medium font-sans`}>Status</p>
            {getStatusBadge(policy.status)}
          </div>
        </div>

        <div>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1 font-medium font-sans`}>Número da Apólice</p>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} font-mono text-gray-900 break-all font-sans`}>{policy.policyNumber}</p>
        </div>

        {/* Nome do Segurado */}
        {insuredNameValue && (
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1 font-medium font-sans`}>Nome do Segurado</p>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-900 break-words font-sans`}>{insuredNameValue}</p>
          </div>
        )}

        {/* Documento (CPF/CNPJ) */}
        {documentInfo && (
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-2 font-medium font-sans`}>Documento</p>
            <div className="flex flex-col gap-2">
              {getPersonTypeBadge()}
              <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 font-sans`}>
                <span className="font-medium">{documentInfo.type}:</span> {documentInfo.formatted}
              </div>
            </div>
          </div>
        )}

        <div>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1 font-medium font-sans`}>Seguradora</p>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-900 break-words font-sans`}>{insurerName}</p>
        </div>

        <div>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1 font-medium font-sans`}>Valor Mensal</p>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-green-600 font-sans`}>
            R$ {policy.monthlyAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
          </p>
        </div>

        <div>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mb-1 font-medium font-sans`}>Cobertura</p>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-900 font-sans`}>
            {policy.coberturas && policy.coberturas.length > 0 
              ? policy.coberturas.map(c => {
                  // Usar renderização segura para evitar objetos React
                  if (typeof c === 'string') return c;
                  if (typeof c === 'object' && c.descricao) {
                    return typeof c.descricao === 'string' ? c.descricao : extractFieldValue(c.descricao);
                  }
                  return extractFieldValue(c);
                }).filter(desc => desc && desc !== 'Não informado').join(', ') || 'Cobertura Básica'
              : 'Cobertura Básica'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
