import { DocumentValidator } from '@/utils/documentValidator';

interface SmartApóliceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  documentNumber?: string;
}

// Componente do ícone customizado
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
    {/* Documento com canto dobrado */}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    
    {/* Linhas do documento */}
    <line x1="9" y1="13" x2="11" y2="13"/>
    <line x1="9" y1="15" x2="11" y2="15"/>
    
    {/* Ondas WiFi */}
    <path d="M8 10c1.5-1.5 3.5-1.5 5 0"/>
    <path d="M7.5 8.5c2.5-2.5 5.5-2.5 8 0"/>
    <path d="M8.5 11.5c.5-.5 1.5-.5 2 0"/>
    
    {/* Shield com check */}
    <path d="M17.5 14.5c0 2-1.5 3.5-3 4.5-1.5-1-3-2.5-3-4.5s1.5-3 3-3 3 1 3 3z"/>
    <path d="M13.5 16.5l1 1 2-2"/>
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
