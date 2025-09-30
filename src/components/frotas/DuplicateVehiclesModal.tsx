import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DuplicateVehicle {
  placa: string;
  marca?: string;
  modelo?: string;
  existingData?: any;
  newData?: any;
}

interface DuplicateVehiclesModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicates: DuplicateVehicle[];
  onConfirm: (shouldOverwrite: boolean) => void;
  isProcessing?: boolean;
}

export function DuplicateVehiclesModal({
  isOpen,
  onClose,
  duplicates,
  onConfirm,
  isProcessing = false,
}: DuplicateVehiclesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Veículos Duplicados Detectados</DialogTitle>
          </div>
          <DialogDescription>
            Encontramos {duplicates.length} {duplicates.length === 1 ? 'veículo' : 'veículos'} com{' '}
            {duplicates.length === 1 ? 'placa que já existe' : 'placas que já existem'} no banco de dados.
            Como deseja proceder?
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {duplicates.map((duplicate, index) => (
              <div
                key={index}
                className="p-4 border border-amber-200 rounded-lg bg-amber-50/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-white">
                        {duplicate.placa}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">
                        {duplicate.existingData?.marca || 'Marca não informada'}{' '}
                        {duplicate.existingData?.modelo || 'Modelo não informado'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-700 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      Dados Existentes no Banco
                    </div>
                    <div className="pl-4 space-y-0.5 text-gray-600">
                      <div>Marca: {duplicate.existingData?.marca || '-'}</div>
                      <div>Modelo: {duplicate.existingData?.modelo || '-'}</div>
                      <div>Categoria: {duplicate.existingData?.categoria || '-'}</div>
                      <div>Ano: {duplicate.existingData?.ano_modelo || '-'}</div>
                      <div>Status: {duplicate.existingData?.status_seguro || '-'}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="font-semibold text-gray-700 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      Dados da Nova Planilha
                    </div>
                    <div className="pl-4 space-y-0.5 text-gray-600">
                      <div>Marca: {duplicate.newData?.marca || '-'}</div>
                      <div>Modelo: {duplicate.newData?.modelo || '-'}</div>
                      <div>Categoria: {duplicate.newData?.categoria || '-'}</div>
                      <div>Ano: {duplicate.newData?.ano_modelo || '-'}</div>
                      <div>Status: {duplicate.newData?.status_seguro || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onConfirm(false);
              onClose();
            }}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Manter Dados Existentes
          </Button>
          <Button
            variant="default"
            onClick={() => {
              onConfirm(true);
              onClose();
            }}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Sobrescrever com Nova Planilha
          </Button>
        </DialogFooter>

        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          <strong>Nota:</strong> Se escolher "Manter Dados Existentes", os veículos duplicados serão
          ignorados no upload. Se escolher "Sobrescrever", os dados atuais serão substituídos pelos
          dados da nova planilha.
        </div>
      </DialogContent>
    </Dialog>
  );
}
