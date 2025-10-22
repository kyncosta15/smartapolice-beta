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
          "fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ease-out",
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
          "fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-background border-r border-border/50 z-50 shadow-xl transition-all duration-300 ease-out",
          isOpen 
            ? "translate-x-0" 
            : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30 bg-gradient-to-b from-sidebar-background to-sidebar-accent/10 dark:from-background dark:to-muted/5">
          <SmartApóliceLogo size="sm" showText={true} />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fechar menu"
            className="p-2 hover:bg-accent/50 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <X className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              aria-current={activeSection === item.id ? 'page' : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm w-full text-left",
                "transition-all duration-200 ease-out font-medium relative overflow-hidden",
                "text-muted-foreground hover:bg-accent/50",
                "hover:text-[#161616]",
                "hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] hover:translate-x-0.5",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1",
                activeSection === item.id && [
                  "bg-gradient-to-r from-primary/15 to-primary/5 text-[#161616] shadow-sm border border-primary/10",
                  "hover:from-primary/20 hover:to-primary/8 hover:text-[#161616]",
                  "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-primary before:to-primary/80 before:rounded-r-full"
                ]
              )}
            >
              <item.icon className={cn(
                "size-4 transition-all duration-200 flex-shrink-0",
                activeSection === item.id 
                  ? "text-[#161616] drop-shadow-sm" 
                  : "text-muted-foreground group-hover:text-[#161616] group-hover:scale-110"
              )} />
              <span className="truncate">{item.title}</span>
              {activeSection === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}