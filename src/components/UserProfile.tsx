import React, { useState, useRef, useEffect } from 'react';
import { Camera, User, Save, Trash2, Upload, MapPin, Building2, Phone, RefreshCw, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getClientesCorpNuvem } from '@/services/corpnuvem/clientes';
import { useCorpNuvemSync } from '@/hooks/useCorpNuvemSync';

interface ProfileData {
  phone?: string;
  document?: string;
  birth_date?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  company_name?: string;
}

export function UserProfile() {
  const { user } = useAuth();
  const { 
    profile, 
    memberships, 
    activeEmpresa, 
    loading, 
    updateDisplayName, 
    updateAvatar, 
    removeAvatar,
    setDefaultEmpresa
  } = useUserProfile();
  
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isSavingBirthDate, setIsSavingBirthDate] = useState(false);
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const [isLoadingFromAPI, setIsLoadingFromAPI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { syncPolicies } = useCorpNuvemSync();

  // Carregar dados do perfil da API CorpNuvem
  const loadFromCorpNuvemAPI = async () => {
    if (!user?.id) return;

    setIsLoadingFromAPI(true);
    try {
      // Buscar documento do usuário - primeiro tentar user_profiles, depois users
      let documento: string | null = null;
      
      // Tentar buscar de user_profiles primeiro
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('document')
        .eq('id', user.id)
        .maybeSingle();
      
      documento = profileData?.document;
      
      // Se não encontrou, buscar da tabela users
      if (!documento) {
        const { data: userData } = await supabase
          .from('users')
          .select('documento')
          .eq('id', user.id)
          .maybeSingle();
        
        documento = userData?.documento;
      }

      if (!documento) {
        toast({
          title: "Documento não encontrado",
          description: "É necessário ter um CPF/CNPJ cadastrado para buscar dados da API.",
          variant: "destructive",
        });
        return;
      }

      console.log('🔍 Buscando cliente na API com documento:', documento);

      // Buscar dados na API CorpNuvem
      const clienteData = await getClientesCorpNuvem({ texto: documento });
      
      console.log('📦 Dados recebidos da API:', clienteData);

      // Extrair dados do cliente (pode vir como array ou objeto)
      const cliente = Array.isArray(clienteData) ? clienteData[0] : clienteData;

      if (!cliente || Object.keys(cliente).length === 0) {
        toast({
          title: "Cliente não encontrado",
          description: "Não foram encontrados dados para este documento na API.",
          variant: "destructive",
        });
        return;
      }

      // Extrair endereço (pegar o primeiro endereço disponível)
      const endereco = cliente.enderecos?.[0] || {};
      const telefone = cliente.telefones?.[0]?.numero || '';

      // Mapear dados da API para o formato do perfil
      const dadosAPI: ProfileData = {
        phone: telefone,
        document: documento,
        birth_date: cliente.data_nascimento || '',
        address: endereco.logradouro ? `${endereco.logradouro}${endereco.numero ? ', ' + endereco.numero : ''}${endereco.complemento ? ' - ' + endereco.complemento : ''}` : '',
        city: endereco.cidade || '',
        state: endereco.estado || '',
        zip_code: endereco.cep || '',
        company_name: cliente.nome || '',
      };

      setProfileData(dadosAPI);

      // Salvar automaticamente no user_profiles
      await supabase
        .from('user_profiles')
        .update(dadosAPI)
        .eq('id', user.id);

      toast({
        title: "Dados atualizados",
        description: "Sincronizando apólices...",
      });

      // Sincronizar apólices após atualizar dados cadastrais
      console.log('🔄 Iniciando sincronização de apólices...');
      await syncPolicies(documento, true);

    } catch (error: any) {
      console.error('❌ Erro ao buscar dados da API:', error);
      
      const errorMessage = error?.message === 'Network Error' 
        ? "Erro de conexão com a API. Verifique sua internet ou tente novamente mais tarde."
        : error?.response?.data?.message || error?.message || "Não foi possível carregar os dados da API.";
      
      toast({
        title: "Erro ao sincronizar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingFromAPI(false);
    }
  };

  // Carregar dados salvos do user_profiles
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('phone, document, birth_date, address, city, state, zip_code, company_name')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar dados do perfil:', error);
        return;
      }

      if (data) {
        const loadedData = {
          phone: data.phone || '',
          document: data.document || '',
          birth_date: data.birth_date || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          company_name: data.company_name || '',
        };
        setProfileData(loadedData);
      }
    };

    loadProfileData();
  }, [user?.id]);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile?.display_name]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        // Preview could be implemented here if needed
      };
      reader.readAsDataURL(file);
      
      handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const result = await updateAvatar(file);
      
      if (result.success) {
        toast({
          title: "Avatar atualizado",
          description: "Sua foto de perfil foi atualizada com sucesso!",
        });
      } else {
        toast({
          title: "Erro ao atualizar avatar",
          description: result.error || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar avatar",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, insira um nome válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateDisplayName(displayName.trim());
      
      if (result.success) {
        toast({
          title: "Nome atualizado",
          description: "Seu nome de exibição foi atualizado com sucesso!",
        });
      } else {
        toast({
          title: "Erro ao atualizar nome",
          description: result.error || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar nome",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    try {
      const result = await removeAvatar();
      
      if (result.success) {
        toast({
          title: "Avatar removido",
          description: "Sua foto de perfil foi removida com sucesso!",
        });
      } else {
        toast({
          title: "Erro ao remover avatar",
          description: result.error || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao remover avatar",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEmpresaChange = async (empresaId: string) => {
    try {
      const result = await setDefaultEmpresa(empresaId);
      
      if (result.success) {
        toast({
          title: "Empresa padrão alterada",
          description: "Sua empresa padrão foi atualizada com sucesso!",
        });
      } else {
        toast({
          title: "Erro ao alterar empresa",
          description: result.error || "Ocorreu um erro inesperado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao alterar empresa",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleSavePhone = async () => {
    if (!user?.id) return;

    setIsSavingPhone(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ phone: profileData.phone || null })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Telefone atualizado",
        description: "Seu telefone foi atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar telefone:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o telefone.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSaveBirthDate = async () => {
    if (!user?.id) return;

    setIsSavingBirthDate(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ birth_date: profileData.birth_date || null })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Data de nascimento atualizada",
        description: "Sua data de nascimento foi atualizada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar data de nascimento:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar a data de nascimento.",
        variant: "destructive",
      });
    } finally {
      setIsSavingBirthDate(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!user?.id || !profileData.document?.trim()) {
      toast({
        title: "Documento inválido",
        description: "Por favor, insira um CPF/CNPJ válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingDocument(true);
    try {
      // Salvar na tabela users
      const { error: usersError } = await supabase
        .from('users')
        .update({ documento: profileData.document.trim() })
        .eq('id', user.id);

      if (usersError) throw usersError;

      // Salvar na tabela user_profiles
      const { error: profilesError } = await supabase
        .from('user_profiles')
        .update({ document: profileData.document.trim() })
        .eq('id', user.id);

      if (profilesError) throw profilesError;

      toast({
        title: "CPF/CNPJ atualizado",
        description: "Sincronizando apólices...",
      });

      // Sincronizar apólices da API CorpNuvem
      await syncPolicies(profileData.document.trim(), true);

    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o CPF/CNPJ.",
        variant: "destructive",
      });
    } finally {
      setIsSavingDocument(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando perfil...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Meu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src={profile?.avatar_url || profile?.photo_url} 
                  alt="Foto de perfil"
                  className="object-cover"
                />
                <AvatarFallback className="bg-slate-600 text-white text-xl font-semibold">
                  {getInitials(displayName || user?.email?.split('@')[0] || 'U')}
                </AvatarFallback>
              </Avatar>
              
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Enviando...' : 'Alterar Foto'}
              </Button>
              
              {profile?.avatar_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover
                </Button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="display-name">Nome de Exibição</Label>
              <div className="flex gap-2">
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Digite seu nome de exibição"
                />
                <Button
                  onClick={handleUpdateName}
                  disabled={isLoading || !displayName.trim() || displayName === profile?.display_name}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>

            <div>
              <Label>Email</Label>
              <Input 
                value={user?.email || ''} 
                disabled 
                className="bg-gray-50"
              />
            </div>

            {/* Company Selection */}
            {memberships.length > 0 && (
              <div>
                <Label>Empresa Ativa</Label>
                <Select
                  value={activeEmpresa || ''}
                  onValueChange={handleEmpresaChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberships.map((membership) => (
                      <SelectItem key={membership.empresa_id} value={membership.empresa_id}>
                        <div className="flex items-center gap-2">
                          <span>{membership.empresa?.nome}</span>
                          <Badge variant={membership.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                            {membership.role === 'admin' ? 'Admin' : membership.role === 'owner' ? 'Owner' : 'Membro'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Memberships */}
            {memberships.length > 1 && (
              <div>
                <Label>Suas Empresas</Label>
                <div className="space-y-2">
                  {memberships.map((membership) => (
                    <div key={membership.empresa_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{membership.empresa?.nome}</div>
                        <div className="text-sm text-gray-500">ID: {membership.empresa_id}</div>
                      </div>
                      <Badge variant={membership.role === 'admin' ? 'default' : 'secondary'}>
                        {membership.role === 'admin' ? 'Admin' : membership.role === 'owner' ? 'Owner' : 'Membro'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Profile Data Card */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Dados Cadastrais
            </CardTitle>
            <Button
              onClick={loadFromCorpNuvemAPI}
              disabled={isLoadingFromAPI}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingFromAPI ? 'animate-spin' : ''}`} />
              {isLoadingFromAPI ? 'Atualizando...' : 'Re-sincronizar'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Os dados são sincronizados automaticamente com a API no primeiro login. Use o botão acima para atualizar manualmente.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-3.5 h-3.5" />
                Telefone
              </Label>
              <div className="relative group">
                <Input
                  id="phone"
                  value={profileData.phone || ''}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="pr-10"
                />
                <Button
                  onClick={handleSavePhone}
                  disabled={isSavingPhone}
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                >
                  {isSavingPhone ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="document">CPF/CNPJ</Label>
              <div className="relative group">
                <Input
                  id="document"
                  value={profileData.document || ''}
                  onChange={(e) => setProfileData({ ...profileData, document: e.target.value })}
                  placeholder="000.000.000-00"
                  className="pr-10"
                />
                <Button
                  onClick={handleSaveDocument}
                  disabled={isSavingDocument}
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                >
                  {isSavingDocument ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="birth_date" className="text-sm text-muted-foreground">Data de Nascimento</Label>
              <div className="relative group">
                <Input
                  id="birth_date"
                  type="date"
                  value={profileData.birth_date || ''}
                  onChange={(e) => setProfileData({ ...profileData, birth_date: e.target.value })}
                  className="pr-10"
                />
                <Button
                  onClick={handleSaveBirthDate}
                  disabled={isSavingBirthDate}
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                >
                  {isSavingBirthDate ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={profileData.company_name || ''}
                disabled
                className="bg-muted"
                placeholder="Nome da sua empresa"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Endereço
            </Label>
            <Input
              id="address"
              value={profileData.address || ''}
              disabled
              className="bg-muted"
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={profileData.city || ''}
                disabled
                className="bg-muted"
                placeholder="Cidade"
              />
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={profileData.state || ''}
                disabled
                className="bg-muted"
                placeholder="UF"
              />
            </div>

            <div>
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                value={profileData.zip_code || ''}
                disabled
                className="bg-muted"
                placeholder="00000-000"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              💡 Os dados são sincronizados automaticamente da API CorpNuvem. Apenas o telefone e a data de nascimento podem ser editados manualmente. 
              Use o botão "Re-sincronizar" acima para atualizar com os dados mais recentes da API.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}