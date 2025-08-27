
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'cliente' | 'administrador' | 'corretora';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  company?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  company?: string;
  phone?: string;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Função para limpar estado de autenticação
const cleanupAuthState = () => {
  console.log('🧹 Limpando estado de autenticação...');
  
  // Remover todas as chaves relacionadas ao Supabase
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Limpar sessionStorage também se existir
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      console.log('🔍 Buscando perfil do usuário:', userId);
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        return null;
      }

      if (userProfile) {
        console.log('✅ Perfil carregado:', userProfile.name);
        return {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role as UserRole,
          company: userProfile.company,
          phone: userProfile.phone,
          avatar: userProfile.avatar
        };
      }
      return null;
    } catch (error) {
      console.error('💥 Exceção ao carregar perfil:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    console.log('🚀 Configurando listener de autenticação...');

    // Configurar listener de mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Mudança de estado de auth:', event, session ? 'com sessão' : 'sem sessão');
        
        if (!mounted) return;

        // Atualizar sessão imediatamente
        setSession(session);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔑 Usuário logou, carregando perfil...');
          
          // Usar setTimeout para evitar deadlocks
          setTimeout(async () => {
            if (!mounted) return;
            
            const userProfile = await fetchUserProfile(session.user.id);
            
            if (mounted) {
              setUser(userProfile);
              setIsLoading(false);
              setIsInitialized(true);
              console.log('✅ Perfil definido após login:', userProfile?.name || 'Desconhecido');
            }
          }, 100);
          
        } else if (event === 'SIGNED_OUT' || !session) {
          console.log('👋 Usuário deslogou ou sem sessão');
          setUser(null);
          setIsLoading(false);
          setIsInitialized(true);
        } else if (session?.user) {
          // Para sessões existentes, carregar perfil
          setTimeout(async () => {
            if (!mounted) return;
            
            const userProfile = await fetchUserProfile(session.user.id);
            
            if (mounted) {
              setUser(userProfile);
              setIsLoading(false);
              setIsInitialized(true);
            }
          }, 100);
        } else {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    );

    // Obter sessão inicial
    const initializeAuth = async () => {
      try {
        console.log('🔍 Obtendo sessão inicial...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão inicial:', error);
          if (mounted) {
            setIsLoading(false);
            setIsInitialized(true);
          }
          return;
        }

        if (!mounted) return;

        console.log('📋 Sessão inicial:', initialSession ? 'Encontrada' : 'Nenhuma');
        
        if (initialSession?.user) {
          setSession(initialSession);
          
          // Carregar perfil do usuário para sessão inicial
          const userProfile = await fetchUserProfile(initialSession.user.id);
          
          if (mounted) {
            setUser(userProfile);
            setIsLoading(false);
            setIsInitialized(true);
            console.log('✅ Auth inicial completa com usuário:', userProfile?.name || 'Desconhecido');
          }
        } else {
          // Sem sessão inicial
          setSession(null);
          setUser(null);
          setIsLoading(false);
          setIsInitialized(true);
          console.log('🏁 Nenhuma sessão inicial encontrada');
        }
      } catch (error) {
        console.error('💥 Erro na inicialização da auth:', error);
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Inicializar auth
    initializeAuth();

    return () => {
      console.log('🧹 Limpando auth');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Array de dependências vazio para prevenir re-execuções

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🔐 Iniciando login para:', email);
    
    try {
      setIsLoading(true);
      
      // Limpar estado antes do login
      cleanupAuthState();
      
      // Tentar logout global primeiro
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('ℹ️ Logout preventivo ignorado:', err);
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        console.log('✅ Login bem-sucedido para usuário:', data.user.id);
        // Estado será gerenciado pelo listener onAuthStateChange
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Falha no login' };
    } catch (error) {
      console.error('💥 Exceção no login:', error);
      setIsLoading(false);
      return { success: false, error: 'Erro inesperado no login' };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    console.log('📝 Iniciando registro para:', userData.email);
    setIsLoading(true);
    
    try {
      // Registrar com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: userData.name,
            role: userData.role,
            company: userData.company,
            phone: userData.phone
          }
        }
      });

      if (authError) {
        console.error('❌ Erro no registro auth:', authError);
        setIsLoading(false);
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        console.log('✅ Usuário registrado:', authData.user.id);
        // Criar perfil na tabela users
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            company: userData.company,
            phone: userData.phone,
            password_hash: 'handled_by_auth' // Placeholder já que auth gerencia senha
          });

        if (profileError) {
          console.error('❌ Erro na criação do perfil:', profileError);
          // Tentar limpar o usuário auth se criação do perfil falhou
          await supabase.auth.signOut();
          setIsLoading(false);
          return { success: false, error: 'Erro ao criar perfil do usuário' };
        }

        console.log('✅ Registro bem-sucedido');
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Falha no registro' };
    } catch (error) {
      console.error('💥 Exceção no registro:', error);
      setIsLoading(false);
      return { success: false, error: 'Erro inesperado no registro' };
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Tentando logout...');
      setIsLoading(true);
      
      // Limpar estado local primeiro
      cleanupAuthState();
      
      // Fazer logout do Supabase
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('❌ Erro no logout:', error);
      }
      
      console.log('✅ Logout bem-sucedido');
      
      // Limpar estado local (também será gerenciado pelo listener auth state change)
      setUser(null);
      setSession(null);
      setIsLoading(false);
      
      // Forçar atualização da página para estado limpo
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error) {
      console.error('💥 Erro no logout:', error);
      // Mesmo com erro, limpar estado local
      setUser(null);
      setSession(null);
      setIsLoading(false);
    }
  };

  console.log('🎯 Render do contexto auth:', { 
    user: user?.name || 'Nenhum', 
    isLoading, 
    isInitialized,
    hasSession: !!session 
  });

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      login, 
      register, 
      logout, 
      isLoading,
      isInitialized 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
