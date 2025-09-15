import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SmartApóliceLogo } from '@/components/SmartApoliceLogo';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: Array<{
    id: string;
    title: string;
    icon: React.ComponentType<any>;
  }>;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function MobileDrawer({ 
  isOpen, 
  onClose, 
  navigation, 
  activeSection, 
  onSectionChange 
}: MobileDrawerProps) {
  
  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC to close and focus trap
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  const handleNavigation = (sectionId: string) => {
    onSectionChange(sectionId);
    onClose(); // Close drawer after selection
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-all duration-300 ease-out",
          isOpen 
            ? "bg-black/40 opacity-100" 
            : "bg-black/0 opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={cn(
          "fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-white z-50 shadow-2xl transition-all duration-300 ease-out",
          isOpen 
            ? "translate-x-0 opacity-100" 
            : "-translate-x-full opacity-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <SmartApóliceLogo size="sm" showText={true} />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fechar menu"
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navigation.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              aria-current={activeSection === item.id ? 'page' : undefined}
              style={{ 
                animationDelay: isOpen ? `${index * 50}ms` : '0ms' 
              }}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm w-full text-left",
                "text-gray-700 hover:bg-slate-50 transition-all duration-200 hover:scale-[1.02]",
                "transform translate-x-0 opacity-100",
                isOpen ? "animate-fade-in" : "",
                activeSection === item.id && [
                  "bg-slate-100 border-l-2 border-blue-600 text-blue-700 shadow-sm"
                ]
              )}
            >
              <item.icon className={cn(
                "size-4 transition-colors",
                activeSection === item.id 
                  ? "text-blue-600" 
                  : "text-gray-400 group-hover:text-gray-600"
              )} />
              <span className="truncate font-medium">{item.title}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}