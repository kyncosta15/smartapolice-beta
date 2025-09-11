import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { 
  Search, 
  Bell, 
  Download,
  Plus,
  Filter,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SmartApoliceNavbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  apolicesCount: number;
}

export function SmartApoliceNavbar({ 
  searchTerm, 
  onSearchChange, 
  apolicesCount 
}: SmartApoliceNavbarProps) {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState({
    placa: '',
    cpf: '',
    cnpj: '',
    seguradora: '',
    status: 'all'
  });

  const handleQuickSearch = (value: string) => {
    onSearchChange(value);
  };

  const handleAdvancedFilter = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      placa: '',
      cpf: '',
      cnpj: '',
      seguradora: '',
      status: 'all'
    });
    onSearchChange('');
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all').length;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Menu Toggle & Search */}
        <div className="flex items-center space-x-4 flex-1">
          <SidebarTrigger className="lg:hidden" />
          
          <div className="flex items-center space-x-2 flex-1 max-w-2xl">
            {/* Quick Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por Placa, CPF, CNPJ, Apólice..."
                value={searchTerm}
                onChange={(e) => handleQuickSearch(e.target.value)}
                className="pl-10 pr-4"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickSearch('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Advanced Filter Toggle */}
            <Button
              variant={showAdvancedSearch ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="shrink-0"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Right Section - Actions & Notifications */}
        <div className="flex items-center space-x-4">
          {/* Quick Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Criar Novo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Plus className="h-4 w-4 mr-2" />
                Importar Apólice
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className="h-4 w-4 mr-2" />
                Cadastro Manual
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Importar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {apolicesCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
              >
                {apolicesCount > 99 ? '99+' : apolicesCount}
              </Badge>
            )}
          </Button>

          {/* Export Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Exportar Dados</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Relatório PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Planilha Excel
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Dados CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placa
              </label>
              <Input
                placeholder="ABC1D23"
                value={filters.placa}
                onChange={(e) => handleAdvancedFilter('placa', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <Input
                placeholder="000.000.000-00"
                value={filters.cpf}
                onChange={(e) => handleAdvancedFilter('cpf', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ
              </label>
              <Input
                placeholder="00.000.000/0000-00"
                value={filters.cnpj}
                onChange={(e) => handleAdvancedFilter('cnpj', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seguradora
              </label>
              <Input
                placeholder="Nome da seguradora"
                value={filters.seguradora}
                onChange={(e) => handleAdvancedFilter('seguradora', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={filters.status}
                onChange={(e) => handleAdvancedFilter('status', e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="ativa">Ativa</option>
                <option value="cancelada">Cancelada</option>
                <option value="pendente">Pendente</option>
                <option value="vencida">Vencida</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpar Filtros
            </Button>
            <Button size="sm">
              Aplicar Filtros
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}