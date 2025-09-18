import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  BarChart3,
  Activity,
  Plus,
  Car,
  FileText,
  Calculator,
  Settings
} from 'lucide-react';

interface HamburgerMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'casos', label: 'Casos', icon: Activity },
  { id: 'novo', label: 'Novo Ticket', icon: Plus },
  { id: 'movimentacoes', label: 'Movimentações', icon: Car },
  { id: 'crlv', label: 'CRLV', icon: FileText },
  { id: 'relatorios', label: 'Relatórios', icon: Calculator },
  { id: 'config', label: 'Configurações', icon: Settings },
];

export function HamburgerMenu({ activeTab, onTabChange }: HamburgerMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu de Navegação</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}