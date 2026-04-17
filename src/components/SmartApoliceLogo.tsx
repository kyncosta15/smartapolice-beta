import { DocumentValidator } from '@/utils/documentValidator';
import smartControlShield from '@/assets/smartcontrol-shield.png';

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
      {/* Escudo SmartControl */}
      <img src={smartControlShield} alt="SmartControl Shield" className={`${sizeClasses[size]} object-contain drop-shadow`} />

      {showText && (
        <div className="flex items-center gap-2">
          <h1 className={`${textSizeClasses[size]} font-semibold tracking-tight`}>
            <span className="text-foreground dark:text-white">Smart</span>
            <span className="bg-gradient-to-r from-[hsl(190,100%,50%)] via-[hsl(230,100%,55%)] to-[hsl(280,100%,55%)] bg-clip-text text-transparent">
              Control
            </span>
          </h1>
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
