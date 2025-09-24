
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Mail, Lock, User, Building, Phone, Loader2 } from 'lucide-react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const AuthPage = () => {
  const { login, register, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    company: '',
    phone: '',
    role: 'cliente' as UserRole,
    classification: 'Corretora' as 'Corretora' | 'Gestão RH'
  });

  const [personType, setPersonType] = useState<'pf' | 'pj'>('pf');

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
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Erro",
        description: "Senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (!registerData.email || !registerData.password || !registerData.name) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
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
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SmartApólice
              </h1>
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded tracking-wider">
                BETA
              </span>
            </div>
          </div>
          <p className="text-gray-600">Gestão Inteligente de Apólices</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-6">
            <CardTitle className="text-center text-xl">Acesse sua conta</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Tabs defaultValue="login" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Criar Conta</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-12 h-12 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Sua senha"
                        value={loginData.password}
                        onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-12 h-12 text-base"
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
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
                    <Label className="text-sm font-medium">Tipo de Pessoa</Label>
                    <RadioGroup
                      value={personType}
                      onValueChange={(value: 'pf' | 'pj') => setPersonType(value)}
                      className="flex space-x-8"
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="pf" id="pf" />
                        <Label htmlFor="pf" className="font-normal text-base">Pessoa Física</Label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="pj" id="pj" />
                        <Label htmlFor="pj" className="font-normal text-base">Pessoa Jurídica</Label>
                      </div>
                    </RadioGroup>
                  </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="register-name" className="text-sm font-medium">{personType === 'pf' ? 'Nome' : 'Razão Social'} *</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          id="register-name"
                          type="text"
                          placeholder={personType === 'pf' ? 'Seu nome' : 'Nome da empresa'}
                          value={registerData.name}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                          className="pl-12 h-12 text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="register-role" className="text-sm font-medium">Tipo de Conta *</Label>
                      <Select
                        value={registerData.role}
                        onValueChange={(value: UserRole) => setRegisterData(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cliente">Cliente</SelectItem>
                          <SelectItem value="administrador">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="register-classification" className="text-sm font-medium">Classificação *</Label>
                    <Select
                      value={registerData.classification}
                      onValueChange={(value: 'Corretora' | 'Gestão RH') => setRegisterData(prev => ({ ...prev, classification: value }))}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Corretora">Corretora</SelectItem>
                        <SelectItem value="Gestão RH">Gestão RH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="register-email" className="text-sm font-medium">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-12 h-12 text-base"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="register-password" className="text-sm font-medium">Senha *</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Min. 6 caracteres"
                          value={registerData.password}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                          className="pl-12 h-12 text-base"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="register-confirm" className="text-sm font-medium">Confirmar *</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          id="register-confirm"
                          type="password"
                          placeholder="Confirmar senha"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="pl-12 h-12 text-base"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {personType === 'pj' && (
                    <div className="space-y-3">
                      <Label htmlFor="register-company" className="text-sm font-medium">Nome Fantasia</Label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          id="register-company"
                          type="text"
                          placeholder="Nome fantasia da empresa"
                          value={registerData.company}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, company: e.target.value }))}
                          className="pl-12 h-12 text-base"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="register-phone" className="text-sm font-medium">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        value={registerData.phone}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                        className="pl-12 h-12 text-base"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-medium"
                    disabled={isLoading || isSubmitting}
                  >
                    {(isLoading || isSubmitting) ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
