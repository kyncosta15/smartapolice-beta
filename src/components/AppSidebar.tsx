import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home,
  FileText, 
  BarChart3, 
  Users2,
  User,
  Car,
  ShieldAlert,
  Settings,
  Upload,
  Mail,
  ArrowLeft
} from "lucide-react";
import { SmartApóliceLogo } from '@/components/SmartApoliceLogo';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  onSectionChange: (section: string) => void;
  activeSection: string;
}

export function AppSidebar({ onSectionChange, activeSection }: AppSidebarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const clientNavigation = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'policies', title: 'Minhas Apólices', icon: FileText },
    { id: 'claims', title: 'Sinistros', icon: ShieldAlert },
    { id: 'frotas', title: 'Gestão de Frotas', icon: Car },
    { id: 'upload', title: 'Upload', icon: Upload },
    { id: 'contatos', title: 'Contatos', icon: Mail },
    { id: 'settings', title: 'Configurações', icon: Settings },
  ];

  const adminNavigation = [
    { id: 'dashboard', title: 'Dashboard', icon: Home },
    { id: 'policies', title: 'Minhas Apólices', icon: FileText },
    { id: 'users', title: 'Vidas e Beneficiários', icon: Users2 },
    { id: 'claims', title: 'Sinistros', icon: ShieldAlert },
    { id: 'frotas', title: 'Gestão de Frotas', icon: Car },
    { id: 'upload', title: 'Upload', icon: Upload },
    { id: 'contatos', title: 'Contatos', icon: Mail },
    { id: 'settings', title: 'Configurações', icon: Settings },
  ];

  const navigation = user?.role === 'administrador' ? adminNavigation : clientNavigation;

  const handleNavigation = (sectionId: string) => {
    onSectionChange(sectionId);
  };

  return (
    <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 bg-background border-r border-border/50 z-30 overflow-y-auto shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-border/30 bg-gradient-to-b from-background to-muted/10">
        <SmartApóliceLogo size="sm" showText={true} />
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

      {/* Bottom Section - Back Button */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/30 bg-gradient-to-t from-background to-muted/5 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/system-selection')}
          className={cn(
            "w-full flex items-center gap-3 px-3.5 py-2.5 text-sm rounded-xl",
            "text-muted-foreground hover:text-[#161616] hover:bg-accent/50",
            "transition-all duration-200 ease-out font-medium",
            "hover:scale-[1.01] active:scale-[0.99] hover:shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1"
          )}
          aria-label="Voltar para seleção de sistemas"
          title="Voltar para seleção de sistemas"
        >
          <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span className="truncate">Voltar aos sistemas</span>
        </Button>
      </div>
    </aside>
  );
}