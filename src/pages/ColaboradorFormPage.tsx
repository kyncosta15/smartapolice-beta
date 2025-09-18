import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  User, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowLeft,
  Send,
  Copy,
  MessageCircle,
  Upload,
  FileText,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SecureFormValidator } from '@/components/SecureFormValidator';

interface LinkData {
  id: string;
  titulo: string;
  descricao?: string;
  campos_solicitados: any[];
  expira_em?: string;
  ativo: boolean;
  empresa_id: string;
}

const ColaboradorFormPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    documento_pessoal: null as File | null,
    comprovante_residencia: null as File | null
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isSecurityValidated, setIsSecurityValidated] = useState(false);

  useEffect(() => {
    if (token) {
      fetchLinkData();
    }
  }, [token]);

  const fetchLinkData = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('colaborador_links')
        .select('*')
        .eq('link_token', token)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Link não encontrado. Verifique se o link está correto.');
        } else {
          setError('Erro ao carregar o formulário.');
        }
        return;
      }

      // Verificar se o link está ativo
      if (!data.ativo) {
        setError('Este link foi desabilitado.');
        return;
      }

      // Verificar se o link expirou
      if (data.expira_em && new Date(data.expira_em) < new Date()) {
        setError('Este link expirou.');
        return;
      }

      setLinkData(data as LinkData);

    } catch (err) {
      console.error('Erro ao buscar dados do link:', err);
      setError('Erro interno. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.cpf.trim()) {
      toast.error('Por favor, preencha nome e CPF');
      return;
    }

    if (!formData.documento_pessoal || !formData.comprovante_residencia) {
      toast.error('Por favor, anexe todos os documentos obrigatórios');
      return;
    }

    if (!sessionToken) {
      toast.error('Token de segurança inválido. Recarregue a página.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload documents first
      const documentUploads = [];
      
      if (formData.documento_pessoal) {
        const { data: docUpload, error: docError } = await supabase.storage
          .from('smartbeneficios')
          .upload(`colaboradores/${linkData?.id}/documento_pessoal_${Date.now()}.${formData.documento_pessoal.name.split('.').pop()}`, formData.documento_pessoal);
        
        if (docError) throw docError;
        documentUploads.push({ tipo: 'documento_pessoal', path: docUpload.path });
      }

      if (formData.comprovante_residencia) {
        const { data: compUpload, error: compError } = await supabase.storage
          .from('smartbeneficios')
          .upload(`colaboradores/${linkData?.id}/comprovante_residencia_${Date.now()}.${formData.comprovante_residencia.name.split('.').pop()}`, formData.comprovante_residencia);
        
        if (compError) throw compError;
        documentUploads.push({ tipo: 'comprovante_residencia', path: compUpload.path });
      }

      // Submit with token validation
      const { data, error } = await supabase.functions.invoke('public-submit', {
        body: {
          token: sessionToken,
          link_id: linkData?.id,
          dados_preenchidos: {
            ...formData,
            documento_pessoal: undefined,
            comprovante_residencia: undefined,
            documentos_anexados: documentUploads
          },
          status: 'recebida',
          ip_origem: 'web',
          user_agent: navigator.userAgent
        }
      });

      if (error) throw error;

      setProtocoloGerado(data.numero_protocolo);
      setIsSubmitted(true);
      toast.success('Protocolo gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar dados:', error);
      toast.error('Erro ao gerar protocolo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecurityValidation = (isValid: boolean, token?: string) => {
    setIsSecurityValidated(isValid);
    if (token) {
      setSessionToken(token);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Clock className="h-12 w-12 mx-auto text-blue-500 mb-4 animate-spin" />
            <p className="text-lg">Carregando formulário...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ops! Algo deu errado</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!linkData) {
    return null;
  }

  return (
    <SecureFormValidator 
      linkId={linkData?.id} 
      onValidationComplete={handleSecurityValidation}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-6">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">SmartBenefícios</h1>
              <p className="text-sm text-muted-foreground">Formulário de Colaborador</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600 font-medium">Formulário Seguro</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Cadastro de Colaborador
                </CardTitle>
                <p className="text-muted-foreground">
                  Preencha seus dados e anexe os documentos obrigatórios para gerar um protocolo de atendimento
                </p>
              </CardHeader>
              
              <CardContent>
                {/* Verificar se foi enviado com sucesso */}
                {isSubmitted && protocoloGerado ? (
                  <div className="text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-green-700 mb-2">
                        Protocolo Gerado!
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Suas informações foram recebidas com sucesso.
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        Seu número de protocolo é:
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-mono font-bold text-green-600">
                          {protocoloGerado}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(protocoloGerado);
                            toast.success('Protocolo copiado!');
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                      <h4 className="font-medium text-blue-800 mb-2">O que acontece agora?</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Suas informações foram encaminhadas para o RH</li>
                        <li>• Em breve você será contatado com mais informações</li>
                        <li>• Use este protocolo para consultar o status</li>
                      </ul>
                    </div>

                    <Button 
                      onClick={() => {
                        setIsSubmitted(false);
                        setProtocoloGerado(null);
                        setFormData({ 
                          nome: '', 
                          cpf: '',
                          documento_pessoal: null,
                          comprovante_residencia: null
                        });
                      }}
                      variant="outline"
                    >
                      Fazer Nova Solicitação
                    </Button>

                    <Button 
                      onClick={() => {
                        const chatUrl = `/chat/${protocoloGerado}`;
                        window.location.href = chatUrl;
                      }}
                      className="ml-2"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Iniciar Chat
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo *</Label>
                      <Input
                        type="text"
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Digite seu nome completo"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        type="text"
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>

                    {/* Seção de Documentos */}
                    <div className="border-t pt-4 space-y-4">
                      <h3 className="text-lg font-medium text-primary flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Documentos Obrigatórios
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="documento_pessoal">Documento Pessoal (RG, CPF, CNH) *</Label>
                          <Input
                            type="file"
                            id="documento_pessoal"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              documento_pessoal: e.target.files?.[0] || null 
                            })}
                            required
                            className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                          />
                          <p className="text-xs text-muted-foreground">
                            Formatos aceitos: PDF, JPG, PNG (máx. 5MB)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="comprovante_residencia">Comprovante de Residência *</Label>
                          <Input
                            type="file"
                            id="comprovante_residencia"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              comprovante_residencia: e.target.files?.[0] || null 
                            })}
                            required
                            className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90"
                          />
                          <p className="text-xs text-muted-foreground">
                            Conta de luz, água, telefone (máx. 90 dias)
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting || !isSecurityValidated}
                      >
                        {isSubmitting ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Enviando Documentos...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Gerar Protocolo
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Informações de segurança */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">Suas informações estão seguras</p>
                      <p className="text-gray-600 mt-1">
                        Este formulário utiliza conexão criptografada, validação de tokens de segurança
                        e seus dados são tratados com total confidencialidade de acordo com a LGPD.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SecureFormValidator>
  );
};

export default ColaboradorFormPage;