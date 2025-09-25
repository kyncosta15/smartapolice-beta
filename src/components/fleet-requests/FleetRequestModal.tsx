import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react';
import { DragDropUpload } from '@/components/ui/drag-drop-upload';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useFleetRequests } from '@/hooks/useFleetRequests';
import { useAuth } from '@/contexts/AuthContext';
import { FLEET_REQUEST_TIPOS } from '@/types/fleet-requests';
import type { FleetRequestFormData } from '@/types/fleet-requests';

const formSchema = z.object({
  tipo: z.enum([
    'inclusao_veiculo',
    'exclusao_veiculo', 
    'tirar_do_seguro',
    'colocar_no_seguro',
    'atualizacao_dados',
    'mudanca_responsavel',
    'documentacao'
  ]),
  placa: z.string().optional(),
  chassi: z.string().optional(),
  renavam: z.string().optional(),
  motivo: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres'),
  seguradora: z.string().optional(),
  numero_apolice: z.string().optional(),
  vigencia_inicio: z.string().optional(),
  vigencia_fim: z.string().optional(),
  cobertura: z.string().optional(),
  responsavel_nome: z.string().optional(),
  responsavel_telefone: z.string().optional(),
  responsavel_email: z.string().email('Email inválido').optional().or(z.literal('')),
}).refine((data) => {
  return data.placa || data.chassi;
}, {
  message: 'Informe ao menos placa ou chassi',
  path: ['placa'],
});

interface FleetRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FleetRequestModal({ open, onOpenChange }: FleetRequestModalProps) {
  const { user } = useAuth();
  const { submitRequest, submitting } = useFleetRequests();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: 'inclusao_veiculo',
      motivo: '',
    },
  });

  const watchedTipo = form.watch('tipo');
  const needsInsurance = ['tirar_do_seguro', 'colocar_no_seguro'].includes(watchedTipo);

  // Função removida - agora é gerenciada pelo DragDropUpload

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const formData: FleetRequestFormData = {
        tipo: values.tipo,
        placa: values.placa,
        chassi: values.chassi,
        renavam: values.renavam,
        motivo: values.motivo,
        anexos: files,
      };

      if (needsInsurance) {
        formData.seguro = {
          seguradora: values.seguradora,
          numero_apolice: values.numero_apolice,
          vigencia_inicio: values.vigencia_inicio,
          vigencia_fim: values.vigencia_fim,
          cobertura: values.cobertura,
        };
      }

      if (values.responsavel_nome) {
        formData.responsavel = {
          nome: values.responsavel_nome,
          telefone: values.responsavel_telefone,
          email: values.responsavel_email,
        };
      }

      await submitRequest(formData);
      
      // Reset form
      form.reset();
      setFiles([]);
      onOpenChange(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Solicitar alteração de frota
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tipo da Solicitação */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Tipo da solicitação *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FLEET_REQUEST_TIPOS.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Identificação do Veículo */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-xs">
                      Informe ao menos placa ou chassi
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="placa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Placa</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ABC1D23" 
                              {...field}
                              className="uppercase"
                              maxLength={7}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="chassi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chassi</FormLabel>
                          <FormControl>
                            <Input placeholder="17 dígitos" {...field} maxLength={17} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="renavam"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renavam</FormLabel>
                          <FormControl>
                            <Input placeholder="11 dígitos" {...field} maxLength={11} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados do Seguro */}
            {needsInsurance && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Dados do Seguro</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="seguradora"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Seguradora *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Porto Seguro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numero_apolice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número da apólice *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 123456789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vigencia_inicio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Início da vigência</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vigencia_fim"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fim da vigência</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="cobertura"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cobertura</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descreva brevemente a cobertura"
                                className="resize-none"
                                rows={2}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados do Responsável */}
            {watchedTipo === 'mudanca_responsavel' && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Novo Responsável</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="responsavel_nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do responsável" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="responsavel_telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="responsavel_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Motivo/Justificativa */}
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Motivo/Justificativa *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva detalhadamente o motivo da solicitação..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload de Anexos */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Documentos Anexos</h3>
                    <Badge variant="outline" className="text-xs">
                      Anexe documentos relevantes à sua solicitação (opcional)
                    </Badge>
                  </div>

                  <DragDropUpload
                    onFilesChange={(uploadedFiles) => {
                      // Extrair apenas os arquivos originais para manter compatibilidade
                      const originalFiles = uploadedFiles
                        .filter(f => f.uploaded)
                        .map(f => f.file);
                      setFiles(originalFiles);
                    }}
                    maxFiles={10}
                    maxSize={10 * 1024 * 1024}
                    bucketName="fleet-documents"
                    acceptedTypes={['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                    disabled={submitting}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contato do Solicitante */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Contato do Solicitante</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Nome:</span> {user?.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {user?.email || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Telefone:</span> {user?.phone || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Empresa:</span> {user?.company || 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar solicitação
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}