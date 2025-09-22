import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, Save, Upload, User, Mail, Building, Shield, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToast } from '@/hooks/use-toast';

export const UserProfile = () => {
  const { user, profile: authProfile } = useAuth();
  const { profile, loading: profileLoading, updateDisplayName, updateAvatar, removeAvatar } = useUserProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || authProfile?.full_name || user?.name || '');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Sincronizar displayName quando profile mudar
  React.useEffect(() => {
    setDisplayName(profile?.display_name || authProfile?.full_name || user?.name || '');
  }, [profile, authProfile, user]);

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
    if (!file) return;

    // Criar preview imediatamente
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload da imagem
    handleImageUpload(file);
  };

  const handleImageUpload = async (file: File) => {
    if (!user?.id) return;

    setIsUploading(true);
    
    try {
      await updateAvatar(file);
      
      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!"
      });

      // Limpar preview após sucesso
      setPreviewImage(null);

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload da imagem.",
        variant: "destructive"
      });
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await updateDisplayName(displayName);
      
      toast({
        title: "Sucesso",
        description: "Nome atualizado com sucesso!"
      });

    } catch (error: any) {
      console.error('Erro ao atualizar nome:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar o nome.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    
    try {
      await removeAvatar();
      
      toast({
        title: "Sucesso",
        description: "Foto de perfil removida com sucesso!"
      });

    } catch (error: any) {
      console.error('Erro ao remover foto:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover a foto.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const currentAvatarUrl = previewImage || profile?.photo_url || authProfile?.avatar_url || (user as any)?.avatar_url;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Meu Perfil</h2>
        <p className="text-gray-600 mt-2">Gerencie suas informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Foto de Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-gray-200">
                  <AvatarImage 
                    src={currentAvatarUrl} 
                    alt="Foto de perfil" 
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-white text-2xl">
                    {getInitials(displayName || profile?.display_name || authProfile?.full_name || user?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Enviando...' : 'Alterar Foto'}
                  </Button>
                  {(profile?.photo_url || currentAvatarUrl) && (
                    <Button
                      onClick={handleRemoveAvatar}
                      variant="outline"
                      disabled={isUploading}
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  JPG, PNG, WebP, GIF até 5MB
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={authProfile?.email || user?.email || ''}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                O email não pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <Label>Empresa</Label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                <Building className="h-4 w-4 text-gray-500" />
                <span>{authProfile?.company || (user as any)?.company || 'Não informado'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Função</Label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <Badge variant={authProfile?.role === 'administrador' ? 'default' : 'secondary'}>
                  {authProfile?.role === 'administrador' ? 'Administrador' : 
                   authProfile?.role === 'rh' ? 'RH' : 
                   authProfile?.role === 'cliente' ? 'Cliente' : 'Usuário'}
                </Badge>
              </div>
            </div>

            <Button 
              onClick={handleUpdateName}
              disabled={isLoading || !displayName.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};