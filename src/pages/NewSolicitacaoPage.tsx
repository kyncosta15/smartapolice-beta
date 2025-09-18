import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Users,
  Heart,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  fullName: string;
}

interface Dependent {
  id: string;
  full_name: string;
  relationship: string;
  birth_date?: string;
}

interface FormData {
  // Step 0 - Identification
  cpf: string;
  fullName: string;
  phone: string;
  lgpdConsent: boolean;
  
  // Step 1 - Request Type
  kind: 'inclusao' | 'exclusao' | null;
  
  // Step 2 - People Selection
  selectedPeople: {
    titular: boolean;
    dependents: string[];
  };
  
  // Step 3 - Documents
  files: File[];
  notes: string;
}

interface SessionData {
  sessionId: string;
  requestId: string;
  token: string;
  expiresAt: string;
  employee: Employee;
  dependents: Dependent[];
}

const NewSolicitacaoPage: React.FC = () => {
  const [step, setStep] = useState(0); // 0=identification, 1=kind, 2=people, 3=docs, 4=review
  const [formData, setFormData] = useState<FormData>({
    cpf: '',
    fullName: '',
    phone: '',
    lgpdConsent: false,
    kind: null,
    selectedPeople: { titular: false, dependents: [] },
    files: [],
    notes: ''
  });
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [protocolCode, setProtocolCode] = useState<string | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('sb:draft');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(prev => ({ ...prev, ...draft.formData }));
        if (draft.sessionData) {
          setSessionData(draft.sessionData);
          setStep(draft.step || 1);
        }
      } catch (e) {
        console.error('Error parsing saved draft:', e);
      }
    }
  }, []);

  // Save draft to localStorage when data changes
  useEffect(() => {
    if (sessionData && step > 0) {
      const draft = {
        formData,
        sessionData,
        step,
        timestamp: Date.now()
      };
      localStorage.setItem('sb:draft', JSON.stringify(draft));
    }
  }, [formData, sessionData, step]);

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  const validateCPF = (cpf: string): boolean => {
    // Aceitar qualquer CPF - validação desabilitada
    return true;
  };

  const handleStartSession = async () => {
    if (!formData.cpf || !formData.fullName || !formData.lgpdConsent) {
      setError('Preencha todos os campos obrigatórios e aceite os termos LGPD');
      return;
    }

    if (!validateCPF(formData.cpf)) {
      setError('CPF inválido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('public-start', {
        body: {
          cpf: formData.cpf,
          fullName: formData.fullName,
          phone: formData.phone
        }
      });

      if (error) throw error;

      if (data.ok) {
        setSessionData(data.data);
        setStep(1);
        toast.success('Identificação realizada com sucesso!');
      } else {
        throw new Error(data.error?.message || 'Erro ao iniciar sessão');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      setError(error instanceof Error ? error.message : 'Erro ao iniciar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!sessionData) return;

    // Check token expiration
    if (new Date(sessionData.expiresAt) <= new Date()) {
      setError('Sessão expirada. Por favor, reinicie o processo.');
      setSessionData(null);
      setStep(0);
      return;
    }

    const payload = {
      kind: formData.kind,
      items: getRequestItems(),
      metadata: {
        sessionId: sessionData.sessionId,
        notes: formData.notes
      }
    };

    try {
      const { data, error } = await supabase.functions.invoke('public-save', {
        body: {
          sessionId: sessionData.sessionId,
          requestId: sessionData.requestId,
          token: sessionData.token,
          payload
        }
      });

      if (error) throw error;
      if (!data.ok) {
        if (data.error?.code === 'INVALID_TOKEN') {
          setError('Sessão expirada. Por favor, reinicie o processo.');
          setSessionData(null);
          setStep(0);
          return;
        }
        throw new Error(data.error?.message);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const getRequestItems = () => {
    const items = [];
    
    if (formData.selectedPeople.titular) {
      items.push({
        target: 'titular',
        action: formData.kind === 'inclusao' ? 'incluir' : 'excluir'
      });
    }
    
    formData.selectedPeople.dependents.forEach(depId => {
      items.push({
        target: 'dependente',
        action: formData.kind === 'inclusao' ? 'incluir' : 'excluir',
        dependentId: depId
      });
    });
    
    return items;
  };

  const handleNext = async () => {
    await saveDraft();
    setStep(prev => Math.min(prev + 1, 4)); // Cap at step 4
  };

  const handleSubmit = async () => {
    if (!sessionData) return;

    // Check token expiration
    if (new Date(sessionData.expiresAt) <= new Date()) {
      setError('Sessão expirada. Por favor, reinicie o processo.');
      setSessionData(null);
      setStep(0);
      return;
    }

    // Validate that we have at least one item selected
    const items = getRequestItems();
    if (items.length === 0) {
      setError('Selecione pelo menos uma pessoa para incluir ou excluir dos benefícios.');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await saveDraft();

      const { data, error } = await supabase.functions.invoke('public-submit', {
        body: {
          sessionId: sessionData.sessionId,
          requestId: sessionData.requestId,
          token: sessionData.token
        }
      });

      if (error) throw error;

      if (data.ok) {
        setProtocolCode(data.data.protocol_code);
        localStorage.removeItem('sb:draft');
        toast.success('Solicitação enviada com sucesso!');
      } else {
        if (data.error?.code === 'INVALID_TOKEN') {
          setError('Sessão expirada. Por favor, reinicie o processo.');
          setSessionData(null);
          setStep(0);
          return;
        }
        throw new Error(data.error?.message || 'Erro ao enviar solicitação');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setError(error instanceof Error ? error.message : 'Erro ao enviar solicitação');
    } finally {
      setIsLoading(false);
    }
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
      case 0: return formData.cpf && formData.fullName && formData.lgpdConsent;
      case 1: return formData.kind !== null;
      case 2: return formData.selectedPeople.titular || formData.selectedPeople.dependents.length > 0;
      case 3: return true; // Optional step
      case 4: return formData.selectedPeople.titular || formData.selectedPeople.dependents.length > 0; // Must have items to submit
      default: return false;
    }
  };

  if (protocolCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-green-800">Solicitação Enviada!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="text-sm text-green-700 mb-2">Seu protocolo:</div>
              <div className="text-2xl font-bold text-green-800 font-mono">{protocolCode}</div>
            </div>
            <Alert>
              <AlertDescription className="text-green-700">
                Sua solicitação foi recebida e será analisada pelo RH. Guarde este protocolo para acompanhar o andamento.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Solicitação de Benefícios</h1>
          <p className="text-gray-600">SmartBenefícios - Portal do Colaborador</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Passo {Math.min(step + 1, 5)} de 5</span>
            <span>{Math.min(Math.round(((step + 1) / 5) * 100), 100)}%</span>
          </div>
          <Progress value={Math.min(((step + 1) / 5) * 100, 100)} className="h-2" />
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 0 && 'Identificação'}
              {step === 1 && 'Tipo de Solicitação'}
              {step === 2 && 'Quem será Afetado?'}
              {step === 3 && 'Documentos Comprobatórios'}
              {step === 4 && 'Revisão e Envio'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Step 0 - Identification */}
            {step === 0 && (
              <>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={handleCpfChange}
                      maxLength={14}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      placeholder="Digite seu nome completo"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="lgpd"
                      checked={formData.lgpdConsent}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, lgpdConsent: checked as boolean }))
                      }
                      disabled={isLoading}
                    />
                    <div className="text-sm leading-relaxed">
                      <label htmlFor="lgpd" className="cursor-pointer">
                        Autorizo o tratamento dos meus dados pessoais conforme a{' '}
                        <span className="text-blue-600 underline">Lei Geral de Proteção de Dados (LGPD)</span>{' '}
                        para fins de processamento desta solicitação. *
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 1 - Request Type */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.kind === 'inclusao' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, kind: 'inclusao' }))}
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="w-6 h-6 text-green-600" />
                      <div>
                        <div className="font-semibold">Inclusão</div>
                        <div className="text-sm text-gray-600">Adicionar beneficiários</div>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.kind === 'exclusao' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, kind: 'exclusao' }))}
                  >
                    <div className="flex items-center space-x-3">
                      <User className="w-6 h-6 text-red-600" />
                      <div>
                        <div className="font-semibold">Exclusão</div>
                        <div className="text-sm text-gray-600">Remover beneficiários</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 - People Selection */}
            {step === 2 && sessionData && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {/* Titular */}
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      formData.selectedPeople.titular ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      selectedPeople: { ...prev.selectedPeople, titular: !prev.selectedPeople.titular }
                    }))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">{sessionData.employee.fullName}</div>
                          <Badge variant="outline">Titular</Badge>
                        </div>
                      </div>
                      {formData.selectedPeople.titular && (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </div>

                  {/* Dependents */}
                  {sessionData.dependents.map(dep => (
                    <div 
                      key={dep.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        formData.selectedPeople.dependents.includes(dep.id) ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => toggleDependent(dep.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Heart className="w-5 h-5 text-purple-600" />
                          <div>
                            <div className="font-medium">{dep.full_name}</div>
                            <Badge variant="outline">{dep.relationship}</Badge>
                          </div>
                        </div>
                        {formData.selectedPeople.dependents.includes(dep.id) && (
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 - Documents */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-lg font-medium text-gray-700 mb-2">
                    Documentos Comprobatórios
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    Faça upload dos documentos necessários (PDF, JPG, PNG, HEIC - máx. 10MB cada)
                  </div>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Adicionar Documentos
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Adicione observações ou informações adicionais..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 4 - Review */}
            {step === 4 && sessionData && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Resumo da Solicitação</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Solicitante:</span> {sessionData.employee.fullName}</div>
                    <div><span className="font-medium">Tipo:</span> {formData.kind === 'inclusao' ? 'Inclusão' : 'Exclusão'}</div>
                    <div>
                      <span className="font-medium">Pessoas afetadas:</span>
                      <ul className="mt-1 space-y-1">
                        {formData.selectedPeople.titular && <li>• {sessionData.employee.fullName} (Titular)</li>}
                        {formData.selectedPeople.dependents.map(depId => {
                          const dep = sessionData.dependents.find(d => d.id === depId);
                          return dep ? <li key={dep.id}>• {dep.full_name} ({dep.relationship})</li> : null;
                        })}
                      </ul>
                    </div>
                    {formData.notes && (
                      <div><span className="font-medium">Observações:</span> {formData.notes}</div>
                    )}
                  </div>
                </div>
                
                <Alert>
                  <AlertDescription>
                    Ao confirmar o envio, sua solicitação será encaminhada ao RH e você receberá um protocolo para acompanhamento.
                  </AlertDescription>
                </Alert>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setStep(prev => prev - 1)}
            disabled={step === 0 || isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          {step < 4 ? (
            <Button
              onClick={step === 0 ? handleStartSession : handleNext}
              disabled={!isStepValid() || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {step === 0 ? 'Iniciando...' : 'Salvando...'}
                </div>
              ) : (
                <>
                  {step === 0 ? 'Iniciar Solicitação' : 'Continuar'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid() || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </div>
              ) : (
                'Enviar Solicitação'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewSolicitacaoPage;