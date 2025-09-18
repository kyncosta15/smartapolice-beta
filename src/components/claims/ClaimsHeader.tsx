import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Search, Plus } from 'lucide-react';
import { ClaimsView } from '@/types/claims';

interface ClaimsHeaderProps {
  currentView: ClaimsView;
  onViewChange: (view: ClaimsView) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  onNewTicket: () => void;
}

export function ClaimsHeader({
  currentView,
  onViewChange,
  searchTerm,
  onSearchChange,
  onNewTicket
}: ClaimsHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestão de Sinistros e Assistências
          </h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie todos os sinistros e assistências
          </p>
        </div>
        
        <Button onClick={onNewTicket} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Segmented Control for View Toggle */}
        <ToggleGroup
          type="single"
          value={currentView}
          onValueChange={(value) => value && onViewChange(value as ClaimsView)}
          className="bg-muted rounded-lg p-1"
        >
          <ToggleGroupItem 
            value="sinistros" 
            className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            Sinistros
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="assistencias"
            className="data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            Assistências
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Search Field */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por placa, chassi, proprietário ou modelo..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
}