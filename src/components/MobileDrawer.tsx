import React, { useEffect, useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SmartApóliceLogo } from '@/components/SmartApoliceLogo';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  isGroup?: boolean;
  children?: Array<{ id: string; title: string; icon: React.ComponentType<any> }>;
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: NavItem[];
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function MobileDrawer({
  isOpen,
  onClose,
  navigation,
  activeSection,
  onSectionChange,
}: MobileDrawerProps) {
  // Track which groups are open. Auto-open the group containing the active section.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    navigation.forEach((item) => {
      if (item.isGroup && item.children?.some((c) => c.id === activeSection)) {
        next[item.id] = true;
      }
    });
    setOpenGroups((prev) => ({ ...prev, ...next }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, isOpen]);

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
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleNavigation = (sectionId: string) => {
    onSectionChange(sectionId);
    onClose();
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  const itemBaseClasses = cn(
    'group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm w-full text-left',
    'transition-all duration-200 ease-out font-medium relative overflow-hidden',
    'text-foreground/80 hover:bg-accent hover:text-foreground',
    'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1'
  );

  const activeClasses = [
    'bg-gradient-to-r from-primary/20 to-primary/5 text-foreground shadow-sm border border-primary/20',
    'hover:from-primary/25 hover:to-primary/10',
    'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-gradient-to-b before:from-primary before:to-primary/80 before:rounded-r-full',
  ];

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ease-out',
          isOpen ? 'bg-black/40 opacity-100' : 'bg-black/0 opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
        className={cn(
          'fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-background border-r border-border/50 z-50 shadow-xl transition-all duration-300 ease-out overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30 bg-gradient-to-b from-sidebar-background to-sidebar-accent/10 dark:from-background dark:to-muted/5 sticky top-0 z-10">
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

        <nav className="p-4 space-y-1.5">
          {navigation.map((item) => {
            if (item.isGroup && item.children) {
              const isOpenGroup = !!openGroups[item.id];
              const hasActiveChild = item.children.some((c) => c.id === activeSection);
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(item.id)}
                    aria-expanded={isOpenGroup}
                    className={cn(itemBaseClasses, hasActiveChild && activeClasses)}
                  >
                    <item.icon
                      className={cn(
                        'size-4 transition-all duration-200 flex-shrink-0',
                        hasActiveChild ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    />
                    <span className="truncate flex-1">{item.title}</span>
                    <ChevronDown
                      className={cn(
                        'ml-auto size-4 text-muted-foreground transition-transform duration-200',
                        isOpenGroup && 'rotate-180'
                      )}
                    />
                  </button>
                  {isOpenGroup && (
                    <div className="ml-3 pl-3 border-l border-border/50 space-y-1">
                      {item.children.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleNavigation(sub.id)}
                          aria-current={activeSection === sub.id ? 'page' : undefined}
                          className={cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm w-full text-left',
                            'transition-all duration-200 ease-out',
                            'text-foreground/70 hover:bg-accent hover:text-foreground',
                            activeSection === sub.id &&
                              'bg-primary/15 text-foreground font-medium'
                          )}
                        >
                          <sub.icon
                            className={cn(
                              'size-3.5 flex-shrink-0',
                              activeSection === sub.id
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            )}
                          />
                          <span className="truncate">{sub.title}</span>
                          {activeSection === sub.id && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                aria-current={activeSection === item.id ? 'page' : undefined}
                className={cn(itemBaseClasses, activeSection === item.id && activeClasses)}
              >
                <item.icon
                  className={cn(
                    'size-4 transition-all duration-200 flex-shrink-0',
                    activeSection === item.id
                      ? 'text-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span className="truncate">{item.title}</span>
                {activeSection === item.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
