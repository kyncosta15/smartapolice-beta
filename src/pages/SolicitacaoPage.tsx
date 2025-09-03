// Página pública de solicitação (sem login) - /solicitacao?token=...

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Upload,
  FileText,
  User,
  Users
} from 'lucide-react';
import { validateToken, saveDraft, submitRequest } from '@/services/requestApi';
import type { TokenValidationData, SaveDraftRequest, Dependent } from '@/types/request';
import { toast } from 'sonner';

interface FormData {
  kind: 'inclusao' | 'exclusao' | null;
  selectedPeople: {
    titular: boolean;
    dependents: string[];
  };
  files: File[];
  lgpdConsent: boolean;
  notes: string;
}

export const SolicitacaoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [step, setStep] = useState(0); // 0=validando, 1=escolha, 2=quem, 3=docs, 4=revisao
  const [tokenData, setTokenData] = useState<TokenValidationData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    kind: null,
    selectedPeople: { titular: false, dependents: [] },
    files: [],
    lgpdConsent: false,
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [protocolCode, setProtocolCode] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  // Valida token ao carregar
  useEffect(() => {
    if (!token) {
      setError('Token não fornecido');
      return;
    }

    validateTokenAndLoadData();
  }, [token]);

  // Carrega/salva rascunho do localStorage
  useEffect(() => {
    if (token && tokenData) {
      const savedDraft = localStorage.getItem(`sb:draft:${token}`);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setFormData(prev => ({ ...prev, ...draft }));
          if (draft.kind) setStep(2); // Vai direto para seleção de pessoas
        } catch (e) {
          // Ignora erro de parse
        }
      } else if (tokenData.hasActiveRequest) {
        // Carrega dados da solicitação existente
        setStep(2);
      } else {
        setStep(1); // Inicia no primeiro passo
      }
    }
  }, [token, tokenData]);

  // Salva rascunho no localStorage sempre que formData muda
  useEffect(() => {
    if (token && step > 0) {
      localStorage.setItem(`sb:draft:${token}`, JSON.stringify(formData));
    }
  }, [formData, token, step]);

  const validateTokenAndLoadData = async () => {
    if (!token) return;

    setIsLoading(true);
    const result = await validateToken({ token });
    
    if (result.ok && result.data) {
      setTokenData(result.data);
      setError(null);
    } else {
      setError(result.error?.message || 'Token inválido');
    }
    setIsLoading(false);
  };

  const saveDraftToServer = async () => {
    if (!token || !formData.kind || step < 2) return;

    const items = [];
    
    if (formData.selectedPeople.titular) {
      items.push({
        target: 'titular' as const,
        action: formData.kind === 'inclusao' ? 'incluir' as const : 'excluir' as const
      });
    }

    formData.selectedPeople.dependents.forEach(depId => {
      items.push({
        target: 'dependente' as const,
        dependentId: depId,
        action: formData.kind === 'inclusao' ? 'incluir' as const : 'excluir' as const
      });
    });

    if (items.length === 0) return;

    const result = await saveDraft({
      token,
      request: {
        kind: formData.kind,
        items,
        notes: formData.notes
      }
    });

    if (result.ok && result.data) {
      setRequestId(result.data.requestId);
    }
  };

  const handleNext = async () => {
    if (step === 2 || step === 3) {
      await saveDraftToServer();
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!token || !requestId) {
      toast.error('Erro interno. Tente novamente.');
      return;
    }

    setIsLoading(true);
    
    // Salva rascunho final
    await saveDraftToServer();
    
    // Submete solicitação
    const result = await submitRequest({ token, requestId });
    
    if (result.ok && result.data) {
      setProtocolCode(result.data.protocolCode);
      localStorage.removeItem(`sb:draft:${token}`);
      setStep(5); // Página de sucesso
    } else {
      toast.error(result.error?.message || 'Erro ao enviar solicitação');
    }
    
    setIsLoading(false);
  };

  const toggleDependent = (depId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPeople: {
        ...prev.selectedPeople,
        dependents: prev.selectedPeople.dependents.includes(depId)
          ? prev.selectedPeople.dependents.filter(id => id !== depId)
          : [...prev.selectedPeople.dependents, depId]
      }
    }));
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.kind !== null;
      case 2: return formData.selectedPeople.titular || formData.selectedPeople.dependents.length > 0;
      case 3: return true; // Documentos opcionais por enquanto
      case 4: return formData.lgpdConsent;
      default: return true;
    }
  };

  // Estado de loading inicial
  if (isLoading && step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Validando acesso...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <div className="text-sm text-muted-foreground">
              <p>Possíveis motivos:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Link expirado</li>
                <li>Link já foi utilizado</li>
                <li>Token inválido</li>
              </ul>
            </div>
            <Button asChild className="w-full">
              <Link to="/">Solicitar Novo Link</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Página de sucesso
  if (protocolCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Protocolo Gerado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="p-6 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">Número do Protocolo:</p>
              <p className="text-2xl font-mono font-bold text-green-900">{protocolCode}</p>
            </div>
            
            <div className="space-y-3 text-left">
              <h3 className="font-semibold">Próximos passos:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Guarde este número de protocolo</li>
                <li>Nossa equipe analisará sua solicitação</li>
                <li>Você será contatado sobre o andamento</li>
                <li>O prazo de análise é de até 5 dias úteis</li>
              </ul>
            </div>

            <Button 
              onClick={() => {
                navigator.clipboard.writeText(protocolCode);
                toast.success('Protocolo copiado!');
              }}
              className="w-full"
            >
              Copiar Protocolo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Solicitação de Beneficiários
          </h1>
          <p className="text-muted-foreground">
            Olá, {tokenData.employee.fullName}! Complete sua solicitação em poucos passos.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={(step / 4) * 100} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>Tipo</span>
            <span>Pessoas</span>
            <span>Documentos</span>
            <span>Revisão</span>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Passo 1: Escolha do tipo */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Tipo de Solicitação</h2>
                  <p className="text-muted-foreground mb-6">
                    Escolha o tipo de alteração que deseja fazer:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                    className={`cursor-pointer transition-colors ${formData.kind === 'inclusao' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-gray-50'}`}
                    onClick={() => setFormData(prev => ({ ...prev, kind: 'inclusao' }))}
                  >
                    <CardContent className="p-6 text-center">
                      <Users className="h-12 w-12 mx-auto mb-4 text-green-600" />
                      <h3 className="font-semibold mb-2">Inclusão</h3>
                      <p className="text-sm text-muted-foreground">
                        Adicionar você ou dependentes ao plano de benefícios
                      </p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-colors ${formData.kind === 'exclusao' ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-gray-50'}`}
                    onClick={() => setFormData(prev => ({ ...prev, kind: 'exclusao' }))}
                  >
                    <CardContent className="p-6 text-center">
                      <User className="h-12 w-12 mx-auto mb-4 text-red-600" />
                      <h3 className="font-semibold mb-2">Exclusão</h3>
                      <p className="text-sm text-muted-foreground">
                        Remover você ou dependentes do plano de benefícios
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Passo 2: Seleção de pessoas */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Quem será {formData.kind === 'inclusao' ? 'incluído' : 'excluído'}?</h2>
                  <p className="text-muted-foreground mb-6">
                    Selecione as pessoas que serão afetadas por esta solicitação:
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Titular */}
                  <Card className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        checked={formData.selectedPeople.titular}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({
                            ...prev,
                            selectedPeople: {
                              ...prev.selectedPeople,
                              titular: !!checked
                            }
                          }))
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Você (Titular)</span>
                          <Badge variant="outline">Titular</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {tokenData.employee.fullName} • CPF: {tokenData.employee.cpf}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Dependentes */}
                  {tokenData.dependents.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Dependentes:</h3>
                      <div className="space-y-3">
                        {tokenData.dependents.map((dependent) => (
                          <Card key={dependent.id} className="p-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox 
                                checked={formData.selectedPeople.dependents.includes(dependent.id)}
                                onCheckedChange={() => toggleDependent(dependent.id)}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span className="font-medium">{dependent.fullName}</span>
                                  <Badge variant="secondary">{dependent.relationship}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {dependent.cpf && `CPF: ${dependent.cpf} • `}
                                  {dependent.birthDate && `Nascimento: ${new Date(dependent.birthDate).toLocaleDateString('pt-BR')}`}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {tokenData.dependents.length === 0 && !formData.selectedPeople.titular && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Você não possui dependentes cadastrados. Selecione "Você (Titular)" ou entre em contato com o RH para cadastrar dependentes.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            {/* Passo 3: Documentos */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Documentos Comprobatórios</h2>
                  <p className="text-muted-foreground mb-6">
                    Anexe os documentos necessários para sua solicitação (opcional):
                  </p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground mb-4">
                    Clique para anexar ou arraste arquivos aqui
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: PDF, JPG, PNG, HEIC (máx. 10MB por arquivo)
                  </p>
                  <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.heic" className="mt-4" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Observações (opcional)</label>
                  <Textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Adicione informações extras sobre sua solicitação..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Passo 4: Revisão */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Revisão da Solicitação</h2>
                  <p className="text-muted-foreground mb-6">
                    Verifique os dados antes de enviar:
                  </p>
                </div>

                {/* Resumo */}
                <Card className="p-4 bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Tipo:</h3>
                      <Badge variant={formData.kind === 'inclusao' ? 'default' : 'secondary'}>
                        {formData.kind === 'inclusao' ? 'Inclusão' : 'Exclusão'}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Pessoas selecionadas:</h3>
                      <ul className="space-y-1 text-sm">
                        {formData.selectedPeople.titular && (
                          <li>• Você (Titular)</li>
                        )}
                        {formData.selectedPeople.dependents.map(depId => {
                          const dep = tokenData.dependents.find(d => d.id === depId);
                          return dep && (
                            <li key={depId}>• {dep.fullName} ({dep.relationship})</li>
                          );
                        })}
                      </ul>
                    </div>

                    {formData.notes && (
                      <div>
                        <h3 className="font-medium">Observações:</h3>
                        <p className="text-sm text-muted-foreground">{formData.notes}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* LGPD */}
                <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Checkbox 
                    checked={formData.lgpdConsent}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, lgpdConsent: !!checked }))
                    }
                  />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Consentimento LGPD</p>
                    <p className="text-muted-foreground">
                      Autorizo o tratamento dos meus dados pessoais e documentos exclusivamente 
                      para análise de inclusão/exclusão no plano, conforme LGPD. A RCaldas 
                      armazenará as evidências pelo prazo regulatório e removerá quando não mais necessárias.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navegação */}
            <div className="flex justify-between pt-6 mt-6 border-t">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(prev => prev - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
              
              <div className="ml-auto">
                {step < 4 ? (
                  <Button 
                    onClick={handleNext} 
                    disabled={!isStepValid()}
                  >
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!isStepValid() || isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </div>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Enviar Solicitação
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};