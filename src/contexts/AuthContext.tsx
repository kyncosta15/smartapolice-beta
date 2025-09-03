import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Extended user interface with our custom properties
export interface ExtendedUser extends User {
  name?: string;
  role?: string;
  company?: string;
  phone?: string;
  avatar?: string;
}

export type UserRole = 'gestor_rh' | 'corretora_admin' | 'cliente' | 'administrador' | 'corretora' | 'rh';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'gestor_rh' | 'corretora_admin' | 'rh' | 'admin' | 'administrador' | 'financeiro'; // Incluindo as novas e antigas para compatibilidade
  company?: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  is_active: boolean;
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
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch extended user data from our users table
  const fetchExtendedUserData = async (userId: string) => {
    try {
      console.log('🔍 Buscando dados estendidos para usuário:', userId);
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar dados do usuário:', error);
        return null;
      }

      console.log('✅ Dados do usuário encontrados:', userData);
      return userData;
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar dados do usuário:', error);
      return null;
    }
  };

  // Fetch user profile from new profiles table
  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔍 Buscando perfil do usuário:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Usar maybeSingle em vez de single para evitar erro quando não encontrar
      
      if (error && error.code !== 'PGRST116') { // PGRST116 é quando não encontra nenhum registro
        console.error('Error fetching profile:', error);
        return null;
      }
      
      if (!data) {
        console.log('⚠️ Perfil não encontrado, criando baseado nos dados do usuário...');
        // Se não encontrou profile, criar um básico baseado nos dados do usuário
        const userData = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (userData.data) {
          const newProfile = {
            id: userId,
            email: userData.data.email,
            full_name: userData.data.name,
            role: userData.data.role || 'rh',
            company: userData.data.company,
            is_active: userData.data.status === 'active'
          };
          
          // Tentar criar o profile
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .maybeSingle();
            
          if (!createError && createdProfile) {
            console.log('✅ Perfil criado com sucesso:', createdProfile);
            return createdProfile as UserProfile;
          } else {
            console.warn('⚠️ Não foi possível criar perfil, usando dados do usuário:', createError);
            return newProfile as UserProfile; // Retorna os dados mesmo sem conseguir inserir
          }
        }
        return null;
      }
      
      console.log('✅ Perfil encontrado:', data);
      return data as UserProfile;
    } catch (error) {
      console.error('💥 Erro ao buscar perfil:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  // Enhanced auth state management with better error handling
  useEffect(() => {
    console.log('🔐 AuthProvider: Configurando autenticação');
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', { 
          event, 
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email 
        });
        
        if (!mounted) return;
        
        // Update session state immediately
        setSession(session);
        
        if (session?.user) {
          console.log('✅ Usuário autenticado, processando dados...');
          
          // Defer data fetching to avoid blocking the auth state update
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              // Fetch profile data and extended user data
              const [profileData, extendedUserData] = await Promise.all([
                fetchProfile(session.user.id),
                fetchExtendedUserData(session.user.id)
              ]);
              
              if (!mounted) return;
              
              // Set profile (pode ser null se não encontrou)
              setProfile(profileData);
              
              if (extendedUserData) {
                // Merge Supabase user with our extended data
                const mergedUser: ExtendedUser = {
                  ...session.user,
                  name: extendedUserData.name,
                  role: extendedUserData.role,
                  company: extendedUserData.company,
                  phone: extendedUserData.phone,
                  avatar: extendedUserData.avatar,
                };
                setUser(mergedUser);
                console.log('✅ Dados do usuário carregados:', {
                  id: mergedUser.id,
                  email: mergedUser.email,
                  name: mergedUser.name,
                  role: mergedUser.role
                });
              } else {
                // Fallback to basic user data if extended data not found
                console.log('⚠️ Dados estendidos não encontrados, usando dados básicos');
                const fallbackUser: ExtendedUser = {
                  ...session.user,
                  name: profileData?.full_name || session.user.email?.split('@')[0] || 'Usuário',
                  role: profileData?.role || 'cliente',
                  company: profileData?.company || '',
                  phone: profileData?.phone || '',
                  avatar: profileData?.avatar_url || ''
                };
                setUser(fallbackUser);
              }
            } catch (error) {
              console.error('❌ Erro ao processar dados do usuário:', error);
              // Still set a fallback user to prevent infinite loading
              const fallbackUser: ExtendedUser = {
                ...session.user,
                name: session.user.email?.split('@')[0] || 'Usuário',
                role: 'cliente',
                company: '',
                phone: '',
                avatar: ''
              };
              setUser(fallbackUser);
            } finally {
              if (mounted) {
                setLoading(false);
              }
            }
          }, 50); // Reduzir o delay para loading mais rápido
        } else {
          console.log('❌ Usuário não autenticado, event:', event);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session AFTER setting up the listener
    const checkInitialSession = async () => {
      try {
        console.log('🔍 Verificando sessão inicial...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (session) {
          console.log('✅ Sessão inicial encontrada:', {
            userId: session.user.id,
            email: session.user.email
          });
          // The onAuthStateChange will handle the rest
        } else {
          console.log('📭 Nenhuma sessão inicial encontrada');
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Erro inesperado ao verificar sessão inicial:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    // Small delay to ensure the auth listener is set up first
    setTimeout(checkInitialSession, 50);

    return () => {
      console.log('🧹 Limpando subscription de auth');
      mounted = false;
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
    company?: string;
    phone?: string;
    role: UserRole;
  }) => {
    const result = await signUp(userData.email, userData.password, userData.name);
    return {
      success: !result.error,
      error: result.error?.message || undefined
    };
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