import React from 'react';
import { Car } from 'lucide-react';

export function FrotasEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="mx-auto w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Car className="w-12 h-12 text-slate-400" />
        </div>
        
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Nenhum veículo cadastrado
        </h3>
        
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
          Sua frota está vazia. Comece adicionando veículos manualmente ou fazendo upload de uma planilha.
        </p>
      </div>
    </div>
  );
}