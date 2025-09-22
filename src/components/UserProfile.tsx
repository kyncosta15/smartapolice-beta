import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, Save, Upload, User, Mail, Building, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const UserProfile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.full_name || user?.name || '');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

    // Verificar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive"
      });
      return;
    }

    // Verificar tamanho do arquivo (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Criar preview
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
      // Gerar nome único para o arquivo baseado no email
      const fileExtension = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExtension}`;
      
      // Primeiro, deletar avatar anterior se existir
      try {
        const { error: deleteError } = await supabase.storage
          .from('profile-avatars')
          .remove([`${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`, `${user.id}/avatar.gif`]);
      } catch (error) {
        // Ignorar erro se não houver arquivo anterior
      }

      // Upload do novo arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: publicData } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(fileName);

      // Atualizar URL no perfil do usuário
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicData.publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Também atualizar na tabela profiles se existir
      await supabase
        .from('profiles')
        .update({ avatar_url: publicData.publicUrl })
        .eq('id', user.id);

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!"
      });

      // Refresh do perfil e usuário para mostrar a nova imagem imediatamente
      await refreshProfile();

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
    if (!user?.id || !displayName.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Atualizar na tabela users
      const { error: usersError } = await supabase
        .from('users')
        .update({ name: displayName.trim() })
        .eq('id', user.id);

      if (usersError) {
        throw usersError;
      }

      // Também atualizar na tabela profiles se existir
      await supabase
        .from('profiles')
        .update({ full_name: displayName.trim() })
        .eq('id', user.id);

      toast({
        title: "Sucesso",
        description: "Nome atualizado com sucesso!"
      });

      // Refresh do perfil e usuário para mostrar o novo nome imediatamente
      await refreshProfile();

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

  const currentAvatarUrl = previewImage || profile?.avatar_url || (user as any)?.avatar_url;

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
                    {getInitials(displayName || profile?.full_name || user?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={isUploading}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Enviando...' : 'Alterar Foto'}
                </Button>
                <p className="text-xs text-gray-500">
                  JPG, PNG, WebP até 5MB
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
                value={profile?.email || user?.email || ''}
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
                <span>{profile?.company || (user as any)?.company || 'Não informado'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Função</Label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <Badge variant={profile?.role === 'administrador' ? 'default' : 'secondary'}>
                  {profile?.role === 'administrador' ? 'Administrador' : 
                   profile?.role === 'rh' ? 'RH' : 
                   profile?.role === 'cliente' ? 'Cliente' : 'Usuário'}
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