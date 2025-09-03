import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  User, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ArrowLeft,
  Send 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LinkData {
  id: string;
  titulo: string;
  descricao?: string;
  campos_solicitados: any[];
  expira_em?: string;
  ativo: boolean;
  empresa_id: string;
}

export const ColaboradorFormPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [error, setError] = useState<string | null>(null);

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
      
      // Inicializar formulário com campos vazios
      const initialFormData: { [key: string]: any } = {};
      (data.campos_solicitados as any[]).forEach((campo: any) => {
        initialFormData[campo.id] = '';
      });
      setFormData(initialFormData);

    } catch (err) {
      console.error('Erro ao buscar dados do link:', err);
      setError('Erro interno. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkData) return;

    // Validar campos obrigatórios
    const camposObrigatorios = linkData.campos_solicitados.filter((campo: any) => campo.obrigatorio);
    const camposFaltantes = camposObrigatorios.filter((campo: any) => !formData[campo.id]);
    
    if (camposFaltantes.length > 0) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Capturar informações adicionais
      const userAgent = navigator.userAgent;
      const ipResponse = await fetch('https://api.ipify.org?format=json').catch(() => null);
      const ipData = ipResponse ? await ipResponse.json() : null;

      const { data, error } = await supabase
        .from('colaborador_submissoes')
        .insert([{
          link_id: linkData.id,
          dados_preenchidos: formData,
          ip_origem: ipData?.ip || null,
          user_agent: userAgent,
          status: 'recebida'
        }]);

      if (error) throw error;

      toast.success('Informações enviadas com sucesso!');
      
      // Limpar formulário
      setFormData({});
      
      // Mostrar mensagem de sucesso
      setError(null);
      
    } catch (err) {
      console.error('Erro ao enviar dados:', err);
      toast.error('Erro ao enviar informações. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (campo: any) => {
    const value = formData[campo.id] || '';

    switch (campo.tipo) {
      case 'textarea':
        return (
          <Textarea
            id={campo.id}
            value={value}
            onChange={(e) => setFormData({ ...formData, [campo.id]: e.target.value })}
            placeholder={`Digite ${campo.label.toLowerCase()}`}
            required={campo.obrigatorio}
            rows={3}
          />
        );
      
      case 'email':
        return (
          <Input
            type="email"
            id={campo.id}
            value={value}
            onChange={(e) => setFormData({ ...formData, [campo.id]: e.target.value })}
            placeholder={`Digite ${campo.label.toLowerCase()}`}
            required={campo.obrigatorio}
          />
        );
      
      case 'tel':
        return (
          <Input
            type="tel"
            id={campo.id}
            value={value}
            onChange={(e) => setFormData({ ...formData, [campo.id]: e.target.value })}
            placeholder="(11) 99999-9999"
            required={campo.obrigatorio}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            id={campo.id}
            value={value}
            onChange={(e) => setFormData({ ...formData, [campo.id]: e.target.value })}
            required={campo.obrigatorio}
          />
        );
      
      default:
        return (
          <Input
            type="text"
            id={campo.id}
            value={value}
            onChange={(e) => setFormData({ ...formData, [campo.id]: e.target.value })}
            placeholder={`Digite ${campo.label.toLowerCase()}`}
            required={campo.obrigatorio}
          />
        );
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
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {linkData.titulo}
              </CardTitle>
              {linkData.descricao && (
                <p className="text-muted-foreground">{linkData.descricao}</p>
              )}
              
              {linkData.expira_em && (
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">
                    Expira em: {new Date(linkData.expira_em).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {linkData.campos_solicitados.map((campo: any) => (
                  <div key={campo.id} className="space-y-2">
                    <Label htmlFor={campo.id} className="flex items-center gap-2">
                      {campo.label}
                      {campo.obrigatorio && (
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          Obrigatório
                        </Badge>
                      )}
                    </Label>
                    {renderField(campo)}
                  </div>
                ))}

                <div className="pt-4 border-t">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Informações
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Informações de segurança */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Suas informações estão seguras</p>
                    <p className="text-gray-600 mt-1">
                      Este formulário utiliza conexão criptografada e suas dados são tratados
                      com total confidencialidade de acordo com a LGPD.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};