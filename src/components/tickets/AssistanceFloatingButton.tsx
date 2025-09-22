import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wrench, Phone, Clock, Truck, Zap, Wrench as WrenchIcon, Key } from 'lucide-react';
import { NewTicketModal } from './NewTicketModal';

export function AssistanceFloatingButton() {
  const [showOptions, setShowOptions] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedSubtipo, setSelectedSubtipo] = useState<string>('');

  const assistanceOptions = [
    {
      subtipo: 'guincho',
      icon: Truck,
      label: 'Guincho',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      subtipo: 'vidro',
      icon: Zap,
      label: 'Vidro',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      subtipo: 'mecanica',
      icon: WrenchIcon,
      label: 'Mecânica',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      subtipo: 'chaveiro',
      icon: Key,
      label: 'Chaveiro',
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  const handleAssistanceClick = (subtipo: string) => {
    setSelectedSubtipo(subtipo);
    setShowNewTicketModal(true);
    setShowOptions(false);
  };

  const handlePhoneClick = () => {
    // Aqui você pode adicionar o número de telefone da assistência 24h
    window.open('tel:08007771234', '_self');
  };

  return (
    <>
      {/* Botão Principal */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Opções de Assistência */}
        {showOptions && (
          <Card className="absolute bottom-16 right-0 p-4 mb-2 min-w-64 shadow-lg">
            <div className="space-y-3">
              <div className="text-center">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Assistência 24h
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Selecione o tipo de assistência
                </p>
              </div>

              {/* Botão de Ligação */}
              <Button
                onClick={handlePhoneClick}
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
              >
                <Phone className="h-4 w-4" />
                Ligar: 0800 777 1234
              </Button>

              <div className="border-t pt-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Ou abra um ticket:
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  {assistanceOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <Button
                        key={option.subtipo}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssistanceClick(option.subtipo)}
                        className="gap-2 flex-col h-auto py-2"
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="text-xs">{option.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Botão Flutuante Principal */}
        <Button
          onClick={() => setShowOptions(!showOptions)}
          className={`
            h-14 w-14 rounded-full shadow-lg transition-all duration-200
            ${showOptions 
              ? 'bg-red-600 hover:bg-red-700 rotate-45' 
              : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
          size="lg"
        >
          {showOptions ? (
            <span className="text-2xl font-light">×</span>
          ) : (
            <div className="flex flex-col items-center">
              <Wrench className="h-5 w-5" />
              <Clock className="h-3 w-3 -mt-1" />
            </div>
          )}
        </Button>

        {/* Label do botão */}
        {!showOptions && (
          <div className="absolute -left-32 top-1/2 transform -translate-y-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Assistência 24h
          </div>
        )}
      </div>

      {/* Modal de Novo Ticket */}
      <NewTicketModal
        open={showNewTicketModal}
        onOpenChange={(open) => {
          setShowNewTicketModal(open);
          if (!open) {
            setSelectedSubtipo('');
          }
        }}
        initialTipo="assistencia"
      />
    </>
  );
}