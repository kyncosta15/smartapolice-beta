
import { DocumentValidator } from '@/utils/documentValidator';
import { Shield } from 'lucide-react';

interface SmartApóliceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  documentNumber?: string;
}

export function SmartApóliceLogo({ size = 'md', showText = true, className = '', documentNumber }: SmartApóliceLogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  const letterSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  };

  // Detectar tipo de pessoa baseado no documento
  const getPersonTypeLabel = () => {
    if (!documentNumber) return '';
    
    const docInfo = DocumentValidator.detectDocument(documentNumber);
    if (!docInfo) return '';
    
    return docInfo.personType === 'PF' ? '(Pessoa Física)' : '(Pessoa Jurídica)';
  };

  const personTypeLabel = getPersonTypeLabel();

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Círculo azul com ícone Shield */}
      <div className={`${sizeClasses[size]} bg-blue-600 rounded-full flex items-center justify-center`}>
        <Shield className={`${letterSizeClasses[size]} text-white`} />
      </div>
      
      {showText && (
        <div className="flex items-center gap-2">
          <h1 className={`${textSizeClasses[size]} font-semibold text-gray-900`}>
            Smart<span className="text-blue-600">Apólice</span>
          </h1>
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded tracking-wider">
            BETA
          </span>
          {personTypeLabel && (
            <span className="text-xs font-normal text-gray-500 ml-2">
              {personTypeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
