
import { Shield } from 'lucide-react';

interface SmartApóliceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function SmartApóliceLogo({ size = 'md', showText = true, className = '' }: SmartApóliceLogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg blur-sm opacity-75"></div>
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg p-1.5">
          <Shield className={`${sizeClasses[size]} text-white`} />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizeClasses[size]} font-bold text-gray-900 leading-tight`}>
            Smart<span className="text-blue-600">Apólice</span>
          </h1>
          {size !== 'sm' && (
            <p className="text-xs text-gray-500 leading-none">Central Inteligente de Apólices</p>
          )}
        </div>
      )}
    </div>
  );
}
