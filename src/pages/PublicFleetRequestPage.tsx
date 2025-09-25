import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle, AlertTriangle, Clock, Car, Building2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DragDropUpload } from '@/components/ui/drag-drop-upload';
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

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FLEET_REQUEST_TIPOS } from '@/types/fleet-requests';

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
  solicitante_nome: z.string().min(2, 'Nome é obrigatório'),
  solicitante_email: z.string().email('Email inválido'),
  solicitante_telefone: z.string().optional(),
  solicitante_setor: z.string().min(2, 'Setor é obrigatório'),
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

export default function PublicFleetRequestPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [protocolCode, setProtocolCode] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string; size: number }>>([]);
  const [empresaId, setEmpresaId] = useState<string>('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: 'inclusao_veiculo',
      motivo: '',
      solicitante_nome: '',
      solicitante_email: '',
      solicitante_setor: '',
    },
  });

  const watchedTipo = form.watch('tipo');
  const needsInsurance = ['tirar_do_seguro', 'colocar_no_seguro'].includes(watchedTipo);

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    validateToken();
  }, [token, navigate]);

  const validateToken = async () => {
    try {
      const { data, error } = await supabase
        .from('public_fleet_tokens')
        .select('*')
        .eq('token', token)
        .gte('expires_at', new Date().toISOString())
        .is('used_at', null)
        .single();

      if (error || !data) {
        setTokenValid(false);
        return;
      }

      // Buscar nome da empresa separadamente
      const { data: empresa } = await supabase
        .from('empresas')
        .select('nome, id')
        .eq('id', data.empresa_id)
        .single();

      setTokenValid(true);
      setCompanyName(empresa?.nome || '');
      setEmpresaId(empresa?.id || '');
    } catch (error) {
      setTokenValid(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) return;

    try {
      setSubmitting(true);

      // Chamar edge function para processar solicitação pública
      const { data, error } = await supabase.functions.invoke('public-fleet-request', {
        body: {
          token,
          formData: values,
          anexos: uploadedFiles,
        }
      });

      if (error) throw error;

      setProtocolCode(data.protocolCode);
      setSubmitted(true);
      
      toast({
        title: 'Solicitação enviada com sucesso!',
        description: `Protocolo: ${data.protocolCode}`,
      });
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      toast({
        title: 'Erro ao enviar solicitação',
        description: error.message || 'Não foi possível enviar a solicitação',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-center text-gray-600 mt-4">Validando link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Link Inválido ou Expirado
              </h3>
              <p className="text-gray-500 mb-4">
                O link que você acessou não é válido ou já expirou.
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Solicitação Enviada com Sucesso!
              </h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <p className="text-green-800 mb-2">
                  <strong>Protocolo:</strong> {protocolCode}
                </p>
                <p className="text-green-700 text-sm">
                  Guarde este número para acompanhar sua solicitação
                </p>
              </div>
              
              <div className="space-y-3 text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Sua solicitação será analisada em breve</span>
                </div>
                <p className="text-sm">
                  Você receberá uma resposta por email quando houver uma atualização
                </p>
              </div>

              <div className="mt-8">
                <Button onClick={() => window.close()} variant="outline">
                  Fechar Página
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Car className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Solicitação de Alteração de Frota</h1>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Building2 className="h-4 w-4" />
            <span>{companyName}</span>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Dados do Solicitante */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Dados do Solicitante</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="solicitante_nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="solicitante_setor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setor/Departamento *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Vendas, RH, Financeiro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="solicitante_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="seu.email@empresa.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="solicitante_telefone"
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
                  </div>
                </div>

                {/* Tipo da Solicitação */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Dados da Solicitação</h3>
                  
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo da solicitação *</FormLabel>
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
                </div>

                {/* Identificação do Veículo */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">Identificação do Veículo</h3>
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

                {/* Dados do Seguro - Condicional */}
                {needsInsurance && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Dados do Seguro</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="seguradora"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Seguradora</FormLabel>
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
                            <FormLabel>Número da apólice</FormLabel>
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
                    </div>
                  </div>
                )}

                {/* Novo Responsável - Condicional */}
                {watchedTipo === 'mudanca_responsavel' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Novo Responsável</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="responsavel_nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome completo</FormLabel>
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
                  </div>
                )}

                {/* Motivo */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="motivo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivo/Justificativa *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva detalhadamente o motivo da solicitação..."
                            className="resize-none min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Upload de Documentos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Documentos Anexos</h3>
                  <p className="text-sm text-muted-foreground">
                    Anexe documentos relevantes à sua solicitação (opcional)
                  </p>
                  
                  <DragDropUpload
                    onFilesChange={(files) => {
                      const fileList = files.filter(f => f.uploaded && f.url).map(f => ({
                        name: f.file.name,
                        url: f.url!,
                        size: f.file.size
                      }));
                      setUploadedFiles(fileList);
                    }}
                    maxFiles={5}
                    maxSize={10 * 1024 * 1024}
                    bucketName="fleet-documents"
                    acceptedTypes={['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                    publicMode={true}
                    publicPath="public-requests"
                  />
                </div>

                {/* Botão de Envio */}
                <div className="flex justify-center pt-6">
                  <Button type="submit" disabled={submitting} size="lg">
                    {submitting ? 'Enviando...' : 'Enviar Solicitação'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}