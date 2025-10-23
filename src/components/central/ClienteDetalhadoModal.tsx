import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  AlertCircle, 
  Download,
  Calendar,
  Briefcase,
  AlertTriangle
} from 'lucide-react';

interface ClienteDetalhadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dados: any;
  loading: boolean;
}

export function ClienteDetalhadoModal({ 
  open, 
  onOpenChange, 
  dados, 
  loading 
}: ClienteDetalhadoModalProps) {
  
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando detalhes do cliente...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!dados) return null;

  const { cliente, contatos, enderecos, documentos, sinistros, renovacoes, negocios } = dados;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalhes do Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nome</p>
                  <p className="font-semibold">{cliente?.nome || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Código</p>
                  <p className="font-semibold">{cliente?.codigo || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CPF/CNPJ</p>
                  <p className="font-semibold">{cliente?.cpf_cnpj || cliente?.cpf || cliente?.cnpj || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data de Nascimento</p>
                  <p className="font-semibold">{cliente?.datanas || cliente?.data_nascimento || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Sexo</p>
                  <p className="font-semibold">
                    {cliente?.sexo === 'M' ? 'Masculino' : cliente?.sexo === 'F' ? 'Feminino' : cliente?.sexo || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Estado Civil</p>
                  <p className="font-semibold">{cliente?.estado_civil || cliente?.cod_estado_civil || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={(cliente?.ativo === 'T' || cliente?.status === 'Ativo') ? 'default' : 'secondary'}>
                    {cliente?.ativo === 'T' ? 'Ativo' : cliente?.ativo === 'F' ? 'Inativo' : cliente?.status || '-'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contatos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Mail className="h-5 w-5" />
                Contatos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Emails */}
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mails
                </p>
                {contatos?.emails && contatos.emails.length > 0 ? (
                  <div className="space-y-1">
                    {contatos.emails.map((email: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Badge variant={email.padrao === 'T' ? 'default' : 'outline'}>
                          {email.padrao === 'T' ? 'Principal' : 'Secundário'}
                        </Badge>
                        <span>{email.email || email}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum e-mail cadastrado</p>
                )}
              </div>

              <Separator />

              {/* Telefones */}
              <div>
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefones
                </p>
                {contatos?.telefones && contatos.telefones.length > 0 ? (
                  <div className="space-y-1">
                    {contatos.telefones.map((tel: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <Badge variant={tel.padrao === 'T' ? 'default' : 'outline'}>
                          {tel.tipo || (tel.padrao === 'T' ? 'Principal' : 'Secundário')}
                        </Badge>
                        <span>
                          {tel.ddd && tel.numero ? `(${tel.ddd}) ${tel.numero}` : tel.numero || tel}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum telefone cadastrado</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          {enderecos && enderecos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <MapPin className="h-5 w-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enderecos.map((end: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    {idx > 0 && <Separator className="my-4" />}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tipo</p>
                        <Badge variant={end.padrao === 'T' ? 'default' : 'outline'}>
                          {end.tipo === 'R' ? 'Residencial' : end.tipo === 'C' ? 'Comercial' : end.tipo || 'Principal'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">CEP</p>
                        <p className="font-semibold">{end.cep || '-'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-muted-foreground">Logradouro</p>
                        <p className="font-semibold">
                          {end.logradouro || '-'}
                          {end.numero && `, ${end.numero}`}
                          {end.complemento && ` - ${end.complemento}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bairro</p>
                        <p className="font-semibold">{end.bairro || '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cidade/Estado</p>
                        <p className="font-semibold">
                          {end.cidade || '-'} - {end.estado || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <AlertCircle className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {cliente?.observacoes && (
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground mb-2">Observações do Cliente</p>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm whitespace-pre-line">{cliente.observacoes}</p>
                    </div>
                  </div>
                )}
                {!cliente?.observacoes && (
                  <div className="md:col-span-2 text-center py-4">
                    <p className="text-sm text-muted-foreground">Nenhuma observação registrada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <FileText className="h-5 w-5" />
                Documentos
              </CardTitle>
              <CardDescription>
                Anexos e documentos do cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentos && documentos.length > 0 ? (
                <div className="space-y-2">
                  {documentos.map((doc: any, idx: number) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-semibold">{doc.nome || `Documento ${idx + 1}`}</p>
                          {doc.tipo && (
                            <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                          )}
                        </div>
                      </div>
                      {doc.url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum documento disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações Adicionais em Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sinistros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Sinistros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {sinistros?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total de sinistros</p>
              </CardContent>
            </Card>

            {/* Renovações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Renovações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {renovacoes?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Renovações registradas</p>
              </CardContent>
            </Card>

            {/* Negócios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-green-600" />
                  Negócios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {negocios?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Negócios em andamento</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
