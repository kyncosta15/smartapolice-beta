import { DocumentValidator } from '@/utils/documentValidator';

interface SmartApóliceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  documentNumber?: string;
}

// Componente do ícone customizado baseado na imagem fornecida
const CustomIcon = ({ className }: { className?: string }) => (
  <svg 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    {/* Documento principal */}
    <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
    <path d="M14 2v4h4"/>
    
    {/* Linhas do documento */}
    <line x1="8" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
    <line x1="8" y1="14" x2="12" y2="14"/>
    
    {/* Check mark no canto inferior direito */}
    <circle cx="18" cy="18" r="3" fill="currentColor" stroke="none"/>
    <path d="M16.5 18l1 1 2-2" stroke="white" strokeWidth="1.5" fill="none"/>
  </svg>
);

export function SmartApóliceLogo({ size = 'md', showText = true, className = '', documentNumber }: SmartApóliceLogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12', 
    lg: 'h-16 w-16'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  const iconSizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const letterSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
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
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-md blur-md opacity-60 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md blur-sm opacity-80"></div>
        
        {/* Main shield container */}
        <div className={`relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-md ${sizeClasses[size]} flex items-center justify-center border border-blue-400/30 shadow-lg shadow-blue-500/20`}>
          <CustomIcon className={`${iconSizeClasses[size]} text-white z-20 relative`} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className={`${textSizeClasses[size]} font-bold text-gray-900 leading-tight relative`}>
              <span className="relative">
                Smart
                <span className="text-blue-600 relative overflow-hidden">
                  Apólice
                  <span className="absolute inset-0 -top-0 h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-[shimmer_2s_ease-in-out_infinite] skew-x-12"></span>
                </span>
              </span>
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
          {size !== 'sm' && (
            <p className="text-xs text-gray-500 leading-none">Centralize todas suas apólices em um só lugar</p>
          )}
        </div>
      )}
    </div>
  );
}
