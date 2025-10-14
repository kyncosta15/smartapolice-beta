import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogRCorp } from '@/components/ui-v2/dialog-rcorp';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FipeSpreadsheetProcessor, ProcessResult } from '@/services/fipeSpreadsheetProcessor';
import { useTenant } from '@/contexts/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FipeSpreadsheetUploadProps {
  onSuccess?: () => void;
}

export function FipeSpreadsheetUpload({ onSuccess }: FipeSpreadsheetUploadProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const { toast } = useToast();
  const { activeEmpresaId } = useTenant();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo Excel (.xlsx ou .xls)',
          variant: 'destructive'
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!file || !activeEmpresaId) return;

    setIsProcessing(true);
    try {
      const processResult = await FipeSpreadsheetProcessor.processFile(file, activeEmpresaId);
      setResult(processResult);

      if (processResult.success > 0) {
        toast({
          title: 'Processamento concluído',
          description: `${processResult.success} veículo(s) atualizado(s) com sucesso`
        });
        
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Erro ao processar planilha:', error);
      toast({
        title: 'Erro ao processar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Importar Códigos FIPE
      </Button>

      <DialogRCorp
        open={open}
        onOpenChange={handleClose}
        title="Importar Códigos FIPE da Planilha"
        size="lg"
      >
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Faça upload de uma planilha Excel contendo:<br />
              • <strong>Coluna B:</strong> Placa do veículo<br />
              • <strong>Coluna C:</strong> Código FIPE
            </AlertDescription>
          </Alert>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="fipe-upload"
            />
            <label htmlFor="fipe-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {file ? file.name : 'Clique para selecionar a planilha'}
                </p>
                {file && (
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                )}
              </div>
            </label>
          </div>

          {file && !result && (
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Processando...' : 'Processar Planilha'}
            </Button>
          )}

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Sucesso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">{result.success}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      Não Encontrados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-yellow-600">{result.notFound}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Erros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                  </CardContent>
                </Card>
              </div>

              {result.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Detalhes dos Erros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {result.errors.map((error, index) => (
                          <div
                            key={index}
                            className="text-sm p-2 bg-gray-50 rounded border"
                          >
                            <span className="font-medium">{error.placa}:</span>{' '}
                            <span className="text-gray-600">{error.error}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Processar Outro Arquivo
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogRCorp>
    </>
  );
}
