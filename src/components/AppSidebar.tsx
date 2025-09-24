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
    <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 border-r border-gray-200 bg-white z-30 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b border-gray-100">
        <SmartApóliceLogo size="sm" showText={true} />
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1.5">
        {navigation.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.id)}
            aria-current={activeSection === item.id ? 'page' : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm w-full text-left",
              "transition-all duration-200 ease-out font-medium",
              "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              "hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]",
              activeSection === item.id && [
                "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20",
                "hover:bg-primary/15 hover:text-primary"
              ]
            )}
          >
            <item.icon className={cn(
              "size-4 transition-all duration-200",
              activeSection === item.id 
                ? "text-primary" 
                : "text-muted-foreground group-hover:text-foreground"
            )} />
            <span className="truncate">{item.title}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Section - Back Button */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/system-selection')}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-slate-50 transition-colors rounded-lg"
          aria-label="Voltar para seleção de sistemas"
          title="Voltar para seleção de sistemas"
        >
          <ArrowLeft className="size-4" />
          <span className="truncate font-medium">Voltar aos sistemas</span>
        </Button>
      </div>
    </aside>
  );
}