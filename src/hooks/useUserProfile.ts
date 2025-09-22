import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Event emitter para notificar mudanças de perfil
class ProfileEventEmitter {
  private listeners: (() => void)[] = [];

  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  emit() {
    this.listeners.forEach(callback => callback());
  }
}

const profileEvents = new ProfileEventEmitter();

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

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setProfile(data as UserProfile);
      } else {
        // Se não existe perfil, criar um
        const { data: createData, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || ''
          })
          .select()
          .single();

        if (!createError && createData) {
          setProfile(createData as UserProfile);
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar perfil:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    
    // Listen to profile update events
    const unsubscribeEvents = profileEvents.subscribe(() => {
      console.log('🔄 Profile event received, reloading...');
      load();
    });
    
    // Setup subscriptions
    const setupSubscriptions = async () => {
      // Listen to auth changes
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          load();
        } else {
          setProfile(null);
          setLoading(false);
        }
      });

      // Listen to real-time changes in user_profiles table
      const { data: { user } } = await supabase.auth.getUser();
      let realtimeSubscription: any = null;
      
      if (user) {
        realtimeSubscription = supabase
          .channel('user_profiles_changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_profiles',
              filter: `id=eq.${user.id}`
            },
            (payload) => {
              console.log('🔄 Profile changed in real-time:', payload);
              load(); // Reload profile when it changes
            }
          )
          .subscribe();
      }

      return { authSubscription, realtimeSubscription };
    };

    let subscriptions: any = null;
    
    setupSubscriptions().then((subs) => {
      subscriptions = subs;
    });

    return () => {
      unsubscribeEvents();
      if (subscriptions) {
        subscriptions.authSubscription?.unsubscribe();
        subscriptions.realtimeSubscription?.unsubscribe();
      }
    };
  }, [load]);

  const updateDisplayName = async (display_name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { error } = await supabase
      .from('user_profiles')
      .upsert({ 
        id: user.id, 
        display_name: display_name.trim() 
      }, { 
        onConflict: 'id' 
      });

    if (error) throw error;
    await load();
    
    // Emit event to notify other components
    profileEvents.emit();
  };

  const updateAvatar = async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

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

    try {
      // Deletar arquivo anterior se existir
      if (profile?.photo_path) {
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

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const photo_url = publicData.publicUrl;

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

      if (upsertError) throw upsertError;

      await load();
      
      // Emit event to notify other components
      profileEvents.emit();
      
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
    
    // Emit event to notify other components
    profileEvents.emit();
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