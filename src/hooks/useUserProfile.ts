import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type UserProfile = {
  id: string;
  display_name: string;
  photo_url: string | null;
  photo_path: string | null;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('🔍 useUserProfile - User from auth:', user);
      
      if (!user) { 
        setProfile(null); 
        setLoading(false); 
        return; 
      }

      // Primeiro tentar buscar o perfil existente
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      console.log('🔍 useUserProfile - Profile data from DB:', data);
      console.log('🔍 useUserProfile - Profile fetch error:', fetchError);

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setProfile(data as UserProfile);
        console.log('✅ useUserProfile - Profile set:', data);
      } else {
        console.log('⚠️ useUserProfile - No profile found, creating one...');
        
        // Se não existe perfil, criar um
        const { data: createData, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || ''
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ useUserProfile - Error creating profile:', createError);
        } else {
          console.log('✅ useUserProfile - Profile created:', createData);
          setProfile(createData as UserProfile);
        }
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar perfil:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        load();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [load]);

  const updateDisplayName = async (display_name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    console.log('🔄 updateDisplayName - Updating display_name to:', display_name);

    const { error } = await supabase
      .from('user_profiles')
      .upsert({ 
        id: user.id, 
        display_name: display_name.trim() 
      }, { 
        onConflict: 'id' 
      });

    if (error) {
      console.error('❌ updateDisplayName - Error:', error);
      throw error;
    }
    
    console.log('✅ updateDisplayName - Success, reloading profile...');
    await load();
  };

  const updateAvatar = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    console.log('🔄 updateAvatar - Starting avatar update for user:', user.id);

    // Validação básica
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Arquivo muito grande. Máximo 5MB.');
    }
    
    if (!/image\/(png|jpe?g|webp|gif)/.test(file.type)) {
      throw new Error('Formato não suportado. Use JPG, PNG, WEBP ou GIF.');
    }

    // Gerar nome único para o arquivo
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${timestamp}-${randomId}.${ext}`;
    const path = `${user.id}/${fileName}`;

    console.log('📁 updateAvatar - Uploading to path:', path);

    try {
      // Deletar arquivo anterior se existir
      if (profile?.photo_path) {
        console.log('🗑️ updateAvatar - Removing old avatar:', profile.photo_path);
        await supabase.storage
          .from('avatars')
          .remove([profile.photo_path]);
      }

      // Upload do novo arquivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { 
          upsert: false,
          contentType: file.type 
        });

      if (uploadError) {
        console.error('❌ updateAvatar - Upload error:', uploadError);
        throw uploadError;
      }

      // Obter URL pública
      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const photo_url = publicData.publicUrl;
      console.log('🔗 updateAvatar - Photo URL:', photo_url);

      // Salvar no perfil
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({ 
          id: user.id, 
          photo_url, 
          photo_path: path 
        }, { 
          onConflict: 'id' 
        });

      if (upsertError) {
        console.error('❌ updateAvatar - Profile update error:', upsertError);
        throw upsertError;
      }

      console.log('✅ updateAvatar - Success, reloading profile...');
      await load();
      
    } catch (err: any) {
      // Se o upload falhou, tentar limpar o arquivo
      try {
        await supabase.storage.from('avatars').remove([path]);
      } catch {
        // Ignorar erro de limpeza
      }
      throw err;
    }
  };

  const removeAvatar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    if (profile?.photo_path) {
      // Deletar arquivo do storage
      await supabase.storage
        .from('avatars')
        .remove([profile.photo_path]);
    }

    // Limpar URLs do perfil
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        photo_url: null, 
        photo_path: null 
      })
      .eq('id', user.id);

    if (error) throw error;
    await load();
  };

  return { 
    profile, 
    loading, 
    error,
    updateDisplayName, 
    updateAvatar,
    removeAvatar,
    reloadProfile: load 
  };
}