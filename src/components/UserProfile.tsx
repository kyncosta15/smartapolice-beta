import React, { useState, useRef, useEffect } from 'react';
import { Camera, User, Save, Trash2, Upload, MapPin, Building2, Phone } from 'lucide-react';
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
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Carregar dados do perfil da API
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
        setProfileData({
          phone: data.phone || '',
          document: data.document || '',
          birth_date: data.birth_date || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          company_name: data.company_name || '',
        });
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

  const handleSaveProfileData = async () => {
    if (!user?.id) return;

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          phone: profileData.phone || null,
          document: profileData.document || null,
          birth_date: profileData.birth_date || null,
          address: profileData.address || null,
          city: profileData.city || null,
          state: profileData.state || null,
          zip_code: profileData.zip_code || null,
          company_name: profileData.company_name || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Dados salvos",
        description: "Seus dados cadastrais foram atualizados com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar seus dados.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
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
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Dados Cadastrais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={profileData.phone || ''}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Label htmlFor="document">CPF/CNPJ</Label>
              <Input
                id="document"
                value={profileData.document || ''}
                onChange={(e) => setProfileData({ ...profileData, document: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={profileData.birth_date || ''}
                onChange={(e) => setProfileData({ ...profileData, birth_date: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="company_name">Nome da Empresa</Label>
              <Input
                id="company_name"
                value={profileData.company_name || ''}
                onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
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
              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={profileData.city || ''}
                onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                placeholder="Cidade"
              />
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Select
                value={profileData.state || ''}
                onValueChange={(value) => setProfileData({ ...profileData, state: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                value={profileData.zip_code || ''}
                onChange={(e) => setProfileData({ ...profileData, zip_code: e.target.value })}
                placeholder="00000-000"
              />
            </div>
          </div>

          <Button
            onClick={handleSaveProfileData}
            disabled={isSavingProfile}
            className="w-full flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSavingProfile ? 'Salvando...' : 'Salvar Dados Cadastrais'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}