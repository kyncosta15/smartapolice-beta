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

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
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
        className="fixed inset-0 bg-black/40 z-40 lg:hidden" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={cn(
          "fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-white z-50 shadow-2xl",
          "transform transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <SmartApóliceLogo size="sm" showText={true} />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fechar menu"
            className="p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation(item.id)}
                  className={cn(
                    "w-full justify-start h-12 text-base rounded-xl",
                    "hover:bg-gray-50 transition-colors",
                    activeSection === item.id ? [
                      "bg-blue-50 text-blue-700 border-l-2 border-blue-600",
                      "font-semibold"
                    ] : "text-gray-700"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0 mr-3" />
                  <span className="truncate">{item.title}</span>
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}