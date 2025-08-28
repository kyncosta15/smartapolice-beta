
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Log detalhado do estado
        if (session?.user) {
          console.log('✅ Usuário autenticado:', {
            id: session.user.id,
            email: session.user.email,
            event
          });
        } else {
          console.log('❌ Usuário não autenticado, event:', event);
        }
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
          setUser(session.user);
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
        setUser(data.session?.user ?? null);
      }
    } catch (error) {
      console.error('❌ Erro inesperado ao atualizar sessão:', error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshSession,
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
