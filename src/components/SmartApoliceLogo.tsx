
import { DocumentValidator } from '@/utils/documentValidator';
import smartapolice3DShield from '@/assets/smartapolice-logo-new.png';

interface SmartApóliceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  documentNumber?: string;
}

export function SmartApóliceLogo({ size = 'md', showText = true, className = '', documentNumber }: SmartApóliceLogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 sm:h-10 sm:w-10',
    md: 'h-10 w-10 sm:h-12 sm:w-12', 
    lg: 'h-12 w-12 sm:h-16 sm:w-16'
  };

  const textSizeClasses = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl'
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
    <div className={`flex items-center justify-center space-x-3 ${className}`}>
      {/* Escudo 3D */}
      <img src={smartapolice3DShield} alt="SmartApólice Shield" className={`${sizeClasses[size]} object-contain`} />
      
      {showText && (
        <div className="flex items-center gap-2">
          <h1 className={`${textSizeClasses[size]} font-semibold text-gray-900 dark:text-white`}>
            Smart<span className="text-blue-600 dark:text-blue-400">Apólice</span>
          </h1>
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded tracking-wider">
            BETA
          </span>
          {personTypeLabel && (
            <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">
              {personTypeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
