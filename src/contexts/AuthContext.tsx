
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

export type UserRole = 'cliente' | 'administrador' | 'corretora';

interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch extended user data from our users table
  const fetchExtendedUserData = async (userId: string): Promise<ExtendedUser | null> => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar dados do usuário:', error);
        return null;
      }

      return userData as ExtendedUser;
    } catch (error) {
      console.error('❌ Erro inesperado ao buscar dados do usuário:', error);
      return null;
    }
  };

  // CORREÇÃO PRINCIPAL: Melhor gestão do estado de autenticação
  useEffect(() => {
    console.log('🔐 AuthProvider: Configurando autenticação');

    // Configurar listener de mudanças de estado PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', { 
          event, 
          hasSession: !!session,
          userId: session?.user?.id,
          userEmail: session?.user?.email 
        });
        
        // Atualizar estado SEMPRE que houver mudança
        setSession(session);
        
        if (session?.user) {
          console.log('✅ Usuário autenticado, buscando dados estendidos...');
          // Fetch extended user data from our users table
          const extendedUser = await fetchExtendedUserData(session.user.id);
          if (extendedUser) {
            // Merge Supabase user with our extended data
            const mergedUser: ExtendedUser = {
              ...session.user,
              name: extendedUser.name,
              role: extendedUser.role,
              company: extendedUser.company,
              phone: extendedUser.phone,
              avatar: extendedUser.avatar,
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
            setUser(session.user as ExtendedUser);
          }
        } else {
          console.log('❌ Usuário não autenticado, event:', event);
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // DEPOIS verificar sessão existente
    const checkSession = async () => {
      try {
        console.log('🔍 Verificando sessão existente...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error);
          setSession(null);
          setUser(null);
        } else if (session) {
          console.log('✅ Sessão existente encontrada:', {
            userId: session.user.id,
            email: session.user.email
          });
          setSession(session);
          
          // Fetch extended user data
          const extendedUser = await fetchExtendedUserData(session.user.id);
          if (extendedUser) {
            const mergedUser: ExtendedUser = {
              ...session.user,
              name: extendedUser.name,
              role: extendedUser.role,
              company: extendedUser.company,
              phone: extendedUser.phone,
              avatar: extendedUser.avatar,
            };
            setUser(mergedUser);
          } else {
            setUser(session.user as ExtendedUser);
          }
        } else {
          console.log('📭 Nenhuma sessão existente encontrada');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('❌ Erro inesperado ao verificar sessão:', error);
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      console.log('🧹 Limpando subscription de auth');
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('🔑 Tentativa de login para:', email);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        return { error };
      }

      console.log('✅ Login bem-sucedido:', {
        userId: data.user?.id,
        email: data.user?.email
      });

      // O estado será atualizado automaticamente pelo onAuthStateChange
      return { error: null };
    } catch (error) {
      console.error('❌ Erro inesperado no login:', error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('📝 Tentativa de registro para:', email);
    setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Iniciando logout');
    setIsLoading(true);

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
    } catch (error) {
      console.error('❌ Erro inesperado no logout:', error);
      // Ainda assim limpar o estado local
      setSession(null);
      setUser(null);
    } finally {
      setIsLoading(false);
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
          const extendedUser = await fetchExtendedUserData(data.session.user.id);
          if (extendedUser) {
            const mergedUser: ExtendedUser = {
              ...data.session.user,
              name: extendedUser.name,
              role: extendedUser.role,
              company: extendedUser.company,
              phone: extendedUser.phone,
              avatar: extendedUser.avatar,
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
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshSession,
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
