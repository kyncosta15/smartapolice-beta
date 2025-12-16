
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Mail, Lock, User, Building, Phone, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { useClienteLookup } from '@/hooks/useClienteLookup';

export const AuthPage = () => {
  const { login, register, isLoading } = useAuth();
  const { toast } = useToast();
  const { result: lookupResult, searchByDocument, reset: resetLookup } = useClienteLookup();
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    document: '',
    company: '',
    phone: '',
    role: 'cliente' as UserRole,
    classification: 'Corretora' as 'Corretora' | 'Gestão RH'
  });

  const [personType, setPersonType] = useState<'pf' | 'pj'>('pf');
  
  // Auto-preencher nome quando encontrar cliente
  useEffect(() => {
    if (lookupResult.found && lookupResult.name && !registerData.name) {
      setRegisterData(prev => ({ ...prev, name: lookupResult.name || '' }));
    }
  }, [lookupResult.found, lookupResult.name]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    const result = await login(loginData.email, loginData.password);
    
    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro no login",
        variant: "destructive"
      });
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple rapid submissions
    if (isSubmitting) return;

    // Verificar se o documento já está cadastrado
    if (lookupResult.alreadyRegistered) {
      toast({
        title: "Documento já cadastrado",
        description: "Este CPF/CNPJ já possui uma conta no sistema.",
        variant: "destructive"
      });
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Erro",
        description: "Senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (!registerData.email || !registerData.password || !registerData.name || !registerData.document) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validar quantidade de dígitos CPF/CNPJ
    const expectedLength = personType === 'pf' ? 11 : 14;
    const cleanDocument = registerData.document.replace(/\D/g, '');
    
    if (cleanDocument.length !== expectedLength) {
      toast({
        title: "Erro",
        description: personType === 'pf' 
          ? "CPF deve ter 11 dígitos" 
          : "CNPJ deve ter 14 dígitos",
        variant: "destructive"
      });
      return;
    }

    // Verificar se não são todos dígitos iguais
    if (/^(\d)\1+$/.test(cleanDocument)) {
      toast({
        title: "Erro",
        description: personType === 'pf' ? "CPF inválido" : "CNPJ inválido",
        variant: "destructive"
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await register({
        ...registerData,
        classification: registerData.classification
      });
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso! Verifique seu email para confirmar.",
        });
        // Reset form
        setRegisterData({
          email: '',
          password: '',
          confirmPassword: '',
          name: '',
          document: '',
          company: '',
          phone: '',
          role: 'cliente' as UserRole,
          classification: 'Corretora' as 'Corretora' | 'Gestão RH'
        });
        setPersonType('pf');
      } else {
        toast({
          title: "Erro na criação da conta",
          description: result.error || "Erro ao criar conta",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="login" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-transparent p-0 border-0 border-b border-border rounded-none shadow-none gap-0">
          <TabsTrigger
            value="login"
            className="w-full rounded-none bg-transparent shadow-none px-0 py-3 border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:border-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground hover:bg-transparent font-medium text-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
          >
            Entrar
          </TabsTrigger>
          <TabsTrigger
            value="register"
            className="w-full rounded-none bg-transparent shadow-none px-0 py-3 border-0 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:border-b-2 data-[state=active]:border-0 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground hover:text-foreground hover:bg-transparent font-medium text-sm focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
          >
            Criar Conta
          </TabsTrigger>
        </TabsList>

        {/* Login Tab */}
        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 h-11 bg-background"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-sm font-medium text-foreground">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Sua senha"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10 h-11 bg-background"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="size-4 mr-2" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </TabsContent>

        {/* Register Tab */}
        <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-6">
                  {/* Person Type Selection */}
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-foreground">Tipo de Pessoa</Label>
                    <RadioGroup
                      value={personType}
                      onValueChange={(value: 'pf' | 'pj') => setPersonType(value)}
                      className="flex space-x-8"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="pf" id="pf" className="border-border" />
                        <Label htmlFor="pf" className="font-normal text-base text-foreground cursor-pointer">Pessoa Física</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="pj" id="pj" className="border-border" />
                        <Label htmlFor="pj" className="font-normal text-base text-foreground cursor-pointer">Pessoa Jurídica</Label>
                      </div>
                    </RadioGroup>
                  </div>

                    <div className="space-y-3">
                      <Label htmlFor="register-document" className="text-sm font-semibold text-foreground">{personType === 'pf' ? 'CPF' : 'CNPJ'} *</Label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                        <Input
                          id="register-document"
                          type="text"
                          placeholder={personType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                          value={registerData.document}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            const maxLength = personType === 'pf' ? 11 : 14;
                            if (value.length <= maxLength) {
                              // Aplicar máscara
                              let formatted = value;
                              if (personType === 'pf') {
                                // Máscara CPF: 000.000.000-00
                                formatted = value
                                  .replace(/(\d{3})(\d)/, '$1.$2')
                                  .replace(/(\d{3})(\d)/, '$1.$2')
                                  .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                              } else {
                                // Máscara CNPJ: 00.000.000/0000-00
                                formatted = value
                                  .replace(/(\d{2})(\d)/, '$1.$2')
                                  .replace(/(\d{3})(\d)/, '$1.$2')
                                  .replace(/(\d{3})(\d)/, '$1/$2')
                                  .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
                              }
                              setRegisterData(prev => ({ ...prev, document: formatted }));
                              
                              // Buscar cliente quando completar o documento
                              if (value.length === maxLength) {
                                searchByDocument(formatted, personType);
                              } else {
                                resetLookup();
                              }
                            }
                          }}
                          className="pl-12 pr-12 h-12 text-base bg-background border-border"
                          required
                        />
                        {/* Indicador de busca/status */}
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {lookupResult.loading && (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          )}
                          {!lookupResult.loading && lookupResult.alreadyRegistered && (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          {!lookupResult.loading && !lookupResult.alreadyRegistered && lookupResult.found && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {!lookupResult.loading && !lookupResult.alreadyRegistered && registerData.document.replace(/\D/g, '').length === (personType === 'pf' ? 11 : 14) && !lookupResult.found && (
                            <XCircle className="h-5 w-5 text-orange-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {personType === 'pf' ? '11 dígitos' : '14 dígitos'}
                        </p>
                        {!lookupResult.loading && registerData.document.replace(/\D/g, '').length === (personType === 'pf' ? 11 : 14) && (
                          <p className={`text-xs font-medium ${
                            lookupResult.alreadyRegistered 
                              ? 'text-red-600' 
                              : lookupResult.found 
                                ? 'text-green-600' 
                                : 'text-orange-600'
                          }`}>
                            {lookupResult.alreadyRegistered 
                              ? '✗ Já cadastrado no sistema' 
                              : lookupResult.found 
                                ? '✓ Encontrado no INFOCAP' 
                                : '⚠ Não encontrado'}
                          </p>
                        )}
                      </div>
                    </div>

                   <div className="space-y-3">
                      <Label htmlFor="register-name" className="text-sm font-semibold text-foreground">{personType === 'pf' ? 'Nome' : 'Razão Social'} *</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                        <Input
                          id="register-name"
                          type="text"
                          placeholder={personType === 'pf' ? 'Seu nome' : 'Nome da empresa'}
                          value={registerData.name}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                          className="pl-12 h-12 text-base bg-background border-border"
                          required
                        />
                      </div>
                    </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="register-role" className="text-sm font-semibold text-foreground">Tipo de Conta *</Label>
                      <Select
                        value={registerData.role}
                        onValueChange={(value: UserRole) => setRegisterData(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger className="h-12 text-base bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="cliente">Cliente</SelectItem>
                          <SelectItem value="rh">RH</SelectItem>
                          <SelectItem value="administrador">Administrador</SelectItem>
                          <SelectItem value="corretora_admin">Corretora Admin</SelectItem>
                          <SelectItem value="gestor_rh">Gestor RH</SelectItem>
                          <SelectItem value="financeiro">Financeiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="register-classification" className="text-sm font-semibold text-foreground">Classificação *</Label>
                      <Select
                        value={registerData.classification}
                        onValueChange={(value: 'Corretora' | 'Gestão RH') => setRegisterData(prev => ({ ...prev, classification: value }))}
                      >
                        <SelectTrigger className="h-12 text-base bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          <SelectItem value="Corretora">Corretora</SelectItem>
                          <SelectItem value="Gestão RH">Gestão RH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="register-email" className="text-sm font-semibold text-foreground">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-12 h-12 text-base bg-background border-border"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="register-password" className="text-sm font-semibold text-foreground">Senha *</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Min. 6 caracteres"
                          value={registerData.password}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                          className="pl-12 h-12 text-base bg-background border-border"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="register-confirm" className="text-sm font-semibold text-foreground">Confirmar *</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                        <Input
                          id="register-confirm"
                          type="password"
                          placeholder="Confirmar senha"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="pl-12 h-12 text-base bg-background border-border"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {personType === 'pj' && (
                    <div className="space-y-3">
                      <Label htmlFor="register-company" className="text-sm font-semibold text-foreground">Nome Fantasia</Label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                        <Input
                          id="register-company"
                          type="text"
                          placeholder="Nome fantasia da empresa"
                          value={registerData.company}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, company: e.target.value }))}
                          className="pl-12 h-12 text-base bg-background border-border"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="register-phone" className="text-sm font-semibold text-foreground">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                        className="pl-12 h-12 text-base bg-background border-border"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium"
                    disabled={isLoading || isSubmitting}
                  >
                    {(isLoading || isSubmitting) ? (
                      <>
                        <Spinner className="size-4 mr-2" />
                        Criando...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};
