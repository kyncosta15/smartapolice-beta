import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Link, 
  Plus, 
  Copy, 
  Eye, 
  Edit, 
  ExternalLink,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useSmartBeneficiosData, ColaboradorLink, ColaboradorSubmissao } from '@/hooks/useSmartBeneficiosData';

interface GeradorLinksColaboradorProps {
  colaboradorLinks: ColaboradorLink[];
  submissoes: ColaboradorSubmissao[];
  isLoading: boolean;
}

const CAMPOS_DISPONIVEIS = [
  { id: 'nome', label: 'Nome Completo', tipo: 'text', obrigatorio: true },
  { id: 'cpf', label: 'CPF', tipo: 'text', obrigatorio: true },
  { id: 'documento_pessoal', label: 'Documento Pessoal (RG, CPF, CNH)', tipo: 'file', obrigatorio: true },
  { id: 'comprovante_residencia', label: 'Comprovante de Residência', tipo: 'file', obrigatorio: true }
];

export const GeradorLinksColaborador = ({ colaboradorLinks, submissoes, isLoading }: GeradorLinksColaboradorProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    campos_solicitados: [] as string[],
    expira_em: ''
  });

  const { createColaboradorLink } = useSmartBeneficiosData();

  const handleCreateLink = async () => {
    if (!formData.titulo || formData.campos_solicitados.length === 0) {
      toast.error('Preencha o título e selecione ao menos um campo');
      return;
    }

    const camposSelecionados = CAMPOS_DISPONIVEIS.filter(campo => 
      formData.campos_solicitados.includes(campo.id)
    );

    const resultado = await createColaboradorLink({
      titulo: formData.titulo,
      descricao: formData.descricao || undefined,
      campos_solicitados: camposSelecionados,
      expira_em: formData.expira_em || undefined
    });

    if (resultado.error) {
      toast.error('Erro ao criar link: ' + resultado.error);
    } else {
      toast.success('Link criado com sucesso!');
      setShowCreateModal(false);
      setFormData({
        titulo: '',
        descricao: '',
        campos_solicitados: [],
        expira_em: ''
      });
    }
  };

  const copyLinkToClipboard = (token: string) => {
    const link = `${window.location.origin}/colaborador/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  const getStatusBadge = (link: ColaboradorLink) => {
    const now = new Date();
    const expiraEm = link.expira_em ? new Date(link.expira_em) : null;

    if (!link.ativo) {
      return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>;
    }
    
    if (expiraEm && expiraEm < now) {
      return <Badge className="bg-red-100 text-red-800">Expirado</Badge>;
    }

    return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
  };

  const getSubmissoesCount = (linkId: string) => {
    return submissoes.filter(s => s.link_id === linkId).length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p>Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Gerador de Links para Colaboradores
            </CardTitle>
            
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Link
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Link para Colaboradores</DialogTitle>
                  <DialogDescription>
                    Configure um formulário personalizado para que colaboradores preencham suas informações
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="titulo">Título do Formulário *</Label>
                    <Input
                      id="titulo"
                      placeholder="Ex: Cadastro de Dados Pessoais"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      placeholder="Instrução para os colaboradores..."
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="expira_em">Data de Expiração (opcional)</Label>
                    <Input
                      id="expira_em"
                      type="datetime-local"
                      value={formData.expira_em}
                      onChange={(e) => setFormData({ ...formData, expira_em: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Campos do Formulário *</Label>
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                      {CAMPOS_DISPONIVEIS.map((campo) => (
                        <div key={campo.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={campo.id}
                            checked={formData.campos_solicitados.includes(campo.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({
                                  ...formData,
                                  campos_solicitados: [...formData.campos_solicitados, campo.id]
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  campos_solicitados: formData.campos_solicitados.filter(c => c !== campo.id)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={campo.id} className="flex items-center gap-2">
                            {campo.label}
                            {campo.obrigatorio && <span className="text-red-500">*</span>}
                            <Badge variant="outline" className="text-xs">
                              {campo.tipo}
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateLink}>
                      Criar Link
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {colaboradorLinks.length === 0 ? (
            <div className="text-center py-8">
              <Link className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum link criado ainda</h3>
              <p className="text-muted-foreground mb-4">
                Crie links personalizados para que colaboradores preencham informações
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {colaboradorLinks.map((link) => (
                <Card key={link.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-lg">{link.titulo}</h4>
                          {getStatusBadge(link)}
                        </div>

                        {link.descricao && (
                          <p className="text-muted-foreground">{link.descricao}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span>{getSubmissoesCount(link.id)} submissões</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                            <span>
                              Criado em {new Date(link.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          {link.expira_em && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-orange-500" />
                              <span>
                                Expira em {new Date(link.expira_em).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {link.campos_solicitados.map((campo: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {campo.label}
                            </Badge>
                          ))}
                        </div>

                        <Separator />

                        <div className="bg-gray-50 p-3 rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            <ExternalLink className="h-4 w-4" />
                            <span className="font-medium text-sm">Link do Formulário:</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="bg-white px-2 py-1 rounded text-sm flex-1 overflow-hidden">
                              {`${window.location.origin}/colaborador/${link.link_token}`}
                            </code>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyLinkToClipboard(link.link_token)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/colaborador/${link.link_token}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card com submissões recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Submissões Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissoes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-muted-foreground">Nenhuma submissão ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissoes.slice(0, 10).map((submissao) => (
                <div key={submissao.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {submissao.dados_preenchidos?.nome || 'Nome não informado'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(submissao.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Badge 
                    className={
                      submissao.status === 'recebida' ? 'bg-blue-100 text-blue-800' :
                      submissao.status === 'processada' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {submissao.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};