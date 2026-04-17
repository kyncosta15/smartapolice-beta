import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Helper: race a promise against a timeout to prevent hung queries from blocking auth
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// Extended user interface with our custom properties
export interface ExtendedUser extends User {
  name?: string;
  role?: string;
  company?: string;
  phone?: string;
  avatar?: string;
}

export type UserRole = 'cliente' | 'rh' | 'administrador' | 'corretora_admin' | 'gestor_rh' | 'financeiro';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'cliente' | 'rh' | 'admin' | 'administrador' | 'corretora_admin' | 'gestor_rh' | 'financeiro';
  company?: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  is_active: boolean;
  is_admin: boolean;
}

interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isLoading: boolean; // Alias for loading for compatibility
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  // Add missing methods for compatibility
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
    company?: string;
    phone?: string;
    role: UserRole;
    classification?: 'Corretora' | 'Gestão RH';
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data + profile in parallel (single source for both)
  const fetchUserAndProfile = async (userId: string) => {
    try {
      console.log('🔍 Buscando dados do usuário e perfil:', userId);

      const [userResult, profileResult] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_profiles').select('is_admin').eq('id', userId).maybeSingle(),
      ]);

      const userData = userResult.data;
      const profileRow = profileResult.data;

      if (userResult.error && userResult.error.code !== 'PGRST116') {
        console.error('Error fetching user:', userResult.error);
      }

      if (!userData) {
        return { userData: null, profile: null };
      }

      const userProfile: UserProfile = {
        id: userData.id,
        email: userData.email,
        full_name: userData.name || userData.email,
        role: (userData.role || 'cliente') as UserProfile['role'],
        company: userData.company,
        phone: userData.phone,
        is_active: userData.status === 'active',
        is_admin: profileRow?.is_admin || false,
      };

      return { userData, profile: userProfile };
    } catch (error) {
      console.error('💥 Erro ao buscar usuário/perfil:', error);
      return { userData: null, profile: null };
    }
  };

  // Backwards-compat wrappers
  const fetchProfile = async (userId: string) => (await fetchUserAndProfile(userId)).profile;
  const fetchExtendedUserData = async (userId: string) => (await fetchUserAndProfile(userId)).userData;

  const applyUserAndProfile = (
    sessionUser: User,
    userData: any,
    profileData: UserProfile | null,
  ) => {
    setProfile(profileData);
    if (userData) {
      setUser({
        ...sessionUser,
        name: userData.name,
        role: userData.role,
        company: userData.company,
        phone: userData.phone,
        avatar: userData.avatar_url || userData.avatar,
      });
    } else {
      setUser({
        ...sessionUser,
        name: profileData?.full_name || sessionUser.email?.split('@')[0] || 'Usuário',
        role: profileData?.role || 'cliente',
        company: profileData?.company || '',
        phone: profileData?.phone || '',
        avatar: profileData?.avatar_url || '',
      });
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('🔄 Atualizando perfil do usuário:', user.id);
      const { userData, profile: profileData } = await fetchUserAndProfile(user.id);
      if (profileData) setProfile(profileData);
      if (userData) {
        setUser({
          ...user,
          name: userData.name,
          role: userData.role,
          company: userData.company,
          phone: userData.phone,
          avatar: userData.avatar_url || userData.avatar,
        });
      }
    }
  };

  // Enhanced auth state management with better error handling
  useEffect(() => {
    console.log('🔐 AuthProvider: Configurando autenticação');
    let mounted = true;
    let lastFetchedUserId: string | null = null;

    const loadUser = async (sessionUser: User) => {
      if (lastFetchedUserId === sessionUser.id) return;
      lastFetchedUserId = sessionUser.id;
      const { userData, profile: profileData } = await fetchUserAndProfile(sessionUser.id);
      if (!mounted) return;
      applyUserAndProfile(sessionUser, userData, profileData);
    };

    // Safety net: ensure loading never stays stuck
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ Auth loading safety timeout reached, forcing loading=false');
        setLoading(false);
      }
    }, 5000);

    // Set up auth state listener FIRST (synchronous handler)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔄 Auth state change:', event);
        if (!mounted) return;

        setSession(session);

        if (!session) {
          lastFetchedUserId = null;
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // Defer the DB fetch to avoid blocking the auth callback
        setTimeout(() => {
          if (!mounted) return;
          loadUser(session.user).finally(() => {
            if (mounted) setLoading(false);
          });
        }, 0);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        loadUser(session.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);


  const signIn = async (email: string, password: string) => {
    console.log('🔑 Tentativa de login para:', email);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        setLoading(false);
        return { error };
      }

      console.log('✅ Login bem-sucedido:', {
        userId: data.user?.id,
        email: data.user?.email
      });

      // Background profile sync removed from login flow to prevent
      // dependency on external APIs (CorpNuvem) during sign-in.
      // Profile data is loaded lazily by components that need it.

      // Don't set loading to false here - let the auth state change handle it
      return { error: null };
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('📝 Tentativa de registro para:', email);
    setLoading(true);

    try {
      // Primeiro, criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (authError) {
        console.error('❌ Erro no registro (auth):', authError);
        return { error: authError };
      }

      if (!authData.user) {
        console.error('❌ Usuário não foi criado');
        return { error: new Error('Usuário não foi criado') };
      }

      console.log('✅ Usuário auth criado:', authData.user.id);

      // Então, criar o perfil na tabela users
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          password_hash: 'managed_by_auth', // Placeholder, pois a senha é gerenciada pelo Supabase Auth
          role: 'cliente'
        });

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError);
        return { error: profileError };
      }

      console.log('✅ Perfil criado com sucesso');
      return { error: null };
    } catch (error) {
      console.error('❌ Erro inesperado no registro:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Iniciando logout');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Erro no logout:', error);
      } else {
        console.log('✅ Logout bem-sucedido');
      }

      // Limpar estado local independentemente de erro
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('❌ Erro inesperado no logout:', error);
      // Ainda assim limpar o estado local
      setSession(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    console.log('🔄 Atualizando sessão...');
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Erro ao atualizar sessão:', error);
      } else {
        console.log('✅ Sessão atualizada com sucesso');
        setSession(data.session);
        
        if (data.session?.user) {
          const [profileData, extendedUserData] = await Promise.all([
            fetchProfile(data.session.user.id),
            fetchExtendedUserData(data.session.user.id)
          ]);
          
          if (profileData) {
            setProfile(profileData);
          }
          
          if (extendedUserData) {
            const mergedUser: ExtendedUser = {
              ...data.session.user,
              name: extendedUserData.name,
              role: extendedUserData.role,
              company: extendedUserData.company,
              phone: extendedUserData.phone,
              avatar: extendedUserData.avatar,
            };
            setUser(mergedUser);
          } else {
            setUser(data.session.user as ExtendedUser);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar sessão:', error);
    }
  };

  // Compatibility methods for existing components
  const login = async (email: string, password: string) => {
    const result = await signIn(email, password);
    return {
      success: !result.error,
      error: result.error?.message || undefined
    };
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
    document?: string;
    company?: string;
    phone?: string;
    role: UserRole;
    classification?: 'Corretora' | 'Gestão RH';
  }) => {
    console.log('📝 Tentativa de registro para:', userData.email);
    setLoading(true);

    try {
      // Primeiro, criar o usuário no Supabase Auth com metadados
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: userData.name,
            role: userData.role,
            company: userData.company || '',
            phone: userData.phone || '',
            classification: userData.classification || 'Corretora',
            document: userData.document || '' // NOVO: adicionar documento aos metadados
          }
        }
      });

      if (authError) {
        console.error('❌ Erro no registro (auth):', authError);
        
        // Handle specific rate limiting error
        if (authError.message.includes('For security purposes, you can only request this after')) {
          return { success: false, error: 'Muitas tentativas de criação de conta. Aguarde 24 segundos antes de tentar novamente.' };
        } else if (authError.message.includes('User already registered')) {
          return { success: false, error: 'Este email já está cadastrado. Tente fazer login.' };
        } else if (authError.message.includes('Password should be at least 6 characters')) {
          return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
        } else if (authError.message.includes('Database error saving new user')) {
          return { success: false, error: 'Erro ao salvar dados do usuário. Tente novamente.' };
        }
        
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        console.error('❌ Usuário não foi criado');
        return { success: false, error: 'Usuário não foi criado' };
      }

      console.log('✅ Usuário auth criado:', authData.user.id);

      // A função handle_new_user será executada automaticamente pelo trigger
      // Não precisamos mais criar manualmente na tabela users
      
      console.log('✅ Usuário registrado com sucesso');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro inesperado no registro:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    } finally {
      setLoading(false);
    }
  };

  const logout = signOut;

  const value = {
    user,
    session,
    profile,
    loading,
    isLoading: loading, // Alias for compatibility
    signIn,
    signUp,
    signOut,
    refreshSession,
    refreshProfile,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const useAuthContext = useAuth;