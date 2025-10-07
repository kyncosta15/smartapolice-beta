import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileCheck, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
  activeSection?: 'overview' | 'requests';
}

export function AdminLayout({ children, activeSection }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { profile } = useUserProfile();

  // Redirecionar se não for admin
  if (!profile?.is_admin) {
    navigate('/dashboard');
    return null;
  }

  const menuItems = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      path: '/admin',
    },
    {
      id: 'requests',
      label: 'Solicitações',
      icon: FileCheck,
      path: '/admin/solicitacoes',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-xl font-semibold">Painel de Administração</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 shrink-0">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      isActive && 'bg-secondary font-medium'
                    )}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
