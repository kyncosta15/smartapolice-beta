
import { DocumentValidator } from '@/utils/documentValidator';
import shieldIcon from '@/assets/shield-icon.png';

interface SmartApóliceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  documentNumber?: string;
}

export function SmartApóliceLogo({ size = 'md', showText = true, className = '', documentNumber }: SmartApóliceLogoProps) {
  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
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
      {/* Imagem do escudo */}
      <img src={shieldIcon} alt="SmartApólice Shield" className="h-20 w-20 object-contain" />
      
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
