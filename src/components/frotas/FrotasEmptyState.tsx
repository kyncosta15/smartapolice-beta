import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Upload, Plus, FileSpreadsheet } from 'lucide-react';

interface FrotasEmptyStateProps {
  onUploadClick?: () => void;
  onCreateClick?: () => void;
}

export function FrotasEmptyState({ onUploadClick, onCreateClick }: FrotasEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Car className="w-12 h-12 text-slate-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Nenhum veículo cadastrado
        </h3>
        
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Sua frota está vazia. Comece adicionando veículos manualmente ou fazendo upload de uma planilha.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onCreateClick && (
            <Button 
              onClick={onCreateClick}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Veículo
            </Button>
          )}
          
          {onUploadClick && (
            <Button 
              variant="outline" 
              onClick={onUploadClick}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload de Planilha
            </Button>
          )}
        </div>
        
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
            <FileSpreadsheet className="w-5 h-5" />
            <span className="font-medium">Dica</span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Você pode fazer upload de planilhas Excel/CSV para importar múltiplos veículos de uma vez
          </p>
        </div>
      </div>
    </div>
  );
}