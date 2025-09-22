import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Event emitter for profile changes
class ProfileEventEmitter {
  private listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit() {
    this.listeners.forEach(listener => listener());
  }
}

const profileEvents = new ProfileEventEmitter();

export interface UserProfile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  photo_url?: string;
  photo_path?: string;
  default_empresa_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserMembership {
  user_id: string;
  empresa_id: string;
  role: string; // Allow any string from database
  created_at?: string;
  empresa?: {
    id: string;
    nome: string;
    slug?: string;
  };
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [activeEmpresa, setActiveEmpresa] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setMemberships([]);
        setActiveEmpresa(null);
        return;
      }

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // If no profile exists, create one
      if (!profileData) {
        const { data: userData } = await supabase
          .from('users')
          .select('name, company')
          .eq('id', user.id)
          .maybeSingle();

        const newProfile = {
          id: user.id,
          display_name: userData?.name || user.email?.split('@')[0] || 'Usuário',
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.warn('Could not create profile:', createError);
          setProfile(newProfile);
        } else {
          setProfile(createdProfile);
        }
      } else {
        setProfile(profileData);
      }

      // Load user memberships
      const { data: membershipData, error: membershipError } = await supabase
        .from('user_memberships')
        .select(`
          *,
          empresa:empresas(id, nome, slug)
        `)
        .eq('user_id', user.id);

      if (membershipError) {
        throw membershipError;
      }

      setMemberships(membershipData || []);

      // Set active empresa
      const profileDefault = (profileData as any)?.default_empresa_id;
      if (profileDefault) {
        setActiveEmpresa(profileDefault);
      } else if (membershipData && membershipData.length > 0) {
        setActiveEmpresa(membershipData[0].empresa_id);
      }

    } catch (err) {
      console.error('Error loading user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          load();
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setMemberships([]);
          setActiveEmpresa(null);
          setLoading(false);
        }
      }
    );

    // Set up profile events listener
    const unsubscribeEvents = profileEvents.subscribe(() => {
      load();
    });

    // Initial load
    load();

    return () => {
      subscription.unsubscribe();
      unsubscribeEvents();
    };
  }, [load]);

  const updateDisplayName = useCallback(async (display_name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .update({ display_name })
        .eq('id', user.id);

      if (error) throw error;

      profileEvents.emit();
      return { success: true };
    } catch (error) {
      console.error('Error updating display name:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update' };
    }
  }, []);

  const updateAvatar = useCallback(async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Image must be smaller than 5MB');
      }

      // Delete old avatar if exists
      if (profile?.photo_path) {
        await supabase.storage
          .from('profile-avatars')
          .remove([profile.photo_path]);
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          avatar_url: publicUrl,
          photo_url: publicUrl,
          photo_path: fileName
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      profileEvents.emit();
      return { success: true };
    } catch (error) {
      console.error('Error updating avatar:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update avatar' };
    }
  }, [profile?.photo_path]);

  const removeAvatar = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Delete file from storage
      if (profile?.photo_path) {
        await supabase.storage
          .from('profile-avatars')
          .remove([profile.photo_path]);
      }

      // Update profile
      const { error } = await supabase
        .from('user_profiles')
        .update({
          avatar_url: null,
          photo_url: null,
          photo_path: null
        })
        .eq('id', user.id);

      if (error) throw error;

      profileEvents.emit();
      return { success: true };
    } catch (error) {
      console.error('Error removing avatar:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to remove avatar' };
    }
  }, [profile?.photo_path]);

  const setDefaultEmpresa = useCallback(async (empresaId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .update({ default_empresa_id: empresaId } as any)
        .eq('id', user.id);

      if (error) throw error;

      setActiveEmpresa(empresaId);
      profileEvents.emit();
      return { success: true };
    } catch (error) {
      console.error('Error setting default empresa:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to set default empresa' };
    }
  }, []);

  const reloadProfile = useCallback(() => {
    load();
  }, [load]);

  return {
    profile,
    memberships,
    activeEmpresa,
    loading,
    error,
    updateDisplayName,
    updateAvatar,
    removeAvatar,
    setDefaultEmpresa,
    reloadProfile
  };
}