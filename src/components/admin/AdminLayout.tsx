import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Crown, LogOut, CheckCircle } from 'lucide-react';
import { SmartApóliceLogo } from '@/components/SmartApoliceLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminLayoutProps {
  children: ReactNode;
  activeSection?: 'overview' | 'approvals';
}

export function AdminLayout({ children, activeSection }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const { logout } = useAuth();

  const initials = profile?.display_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AR';

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar Simples */}
      <aside className="w-80 border-r bg-card flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b">
          <SmartApóliceLogo size="md" showText={true} />
        </div>

        {/* Navigation */}
        <div className="p-6 flex-1 space-y-2">
          <Button
            onClick={() => navigate('/admin')}
            variant={activeSection === 'overview' ? 'default' : 'ghost'}
            className="w-full justify-start gap-3 font-medium text-base py-6 rounded-xl"
          >
            <Crown className="h-5 w-5" />
            Dashboard
          </Button>
          <Button
            onClick={() => navigate('/admin/aprovacoes')}
            variant={activeSection === 'approvals' ? 'default' : 'ghost'}
            className="w-full justify-start gap-3 font-medium text-base py-6 rounded-xl"
          >
            <CheckCircle className="h-5 w-5" />
            Aprovações
          </Button>
        </div>

        {/* Footer com Logout */}
        <div className="p-6 border-t">
          <Button
            onClick={logout}
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-3 h-auto py-2 px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">{profile?.display_name || 'Admin'}</span>
                    <span className="text-xs text-muted-foreground">RCaldas</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
