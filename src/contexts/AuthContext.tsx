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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      console.log('Fetching user profile for:', userId);
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (userProfile) {
        console.log('User profile loaded:', userProfile);
        console.log('USER_ID ATUAL:', userProfile.id);
        console.log('USER EMAIL ATUAL:', userProfile.email);
        console.log('USER ROLE ATUAL:', userProfile.role);
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
      console.error('Exception loading user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          if (mounted) {
            setIsLoading(false);
            setInitialized(true);
          }
          return;
        }

        console.log('Initial session user ID:', initialSession?.user?.id || 'no session');
        console.log('AUTH UID from supabase:', initialSession?.user?.id);

        if (initialSession?.user && mounted) {
          // Fetch user profile with timeout to prevent hanging
          const timeoutPromise: Promise<User | null> = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
          );
          
          try {
            const userProfile: User | null = await Promise.race([
              fetchUserProfile(initialSession.user.id),
              timeoutPromise
            ]);
            
            if (mounted) {
              setSession(initialSession);
              setUser(userProfile);
            }
          } catch (profileError) {
            console.error('Profile fetch failed:', profileError);
            if (mounted) {
              setSession(initialSession);
              setUser(null);
            }
          }
        }

        if (mounted) {
          setIsLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
          setInitialized(true);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        console.log('Session user ID:', session?.user?.id || 'no session');
        console.log('AUTH UID CHANGED TO:', session?.user?.id);
        
        if (!mounted) return;

        setSession(session);
        
        if (session?.user && event === 'SIGNED_IN') {
          // Defer profile fetching to avoid blocking
          setTimeout(async () => {
            if (mounted) {
              const userProfile = await fetchUserProfile(session.user.id);
              if (mounted) {
                setUser(userProfile);
              }
            }
          }, 100);
        } else {
          setUser(null);
        }
        
        if (initialized && mounted) {
          setIsLoading(false);
        }
      }
    );

    // Initialize auth only once
    if (!initialized) {
      initializeAuth();
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('Login successful:', data.user.id);
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login exception:', error);
      return { success: false, error: 'Erro inesperado no login' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // Sign up with Supabase Auth
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
        console.error('Auth signup error:', authError);
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        // Create user profile in our users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            company: userData.company,
            phone: userData.phone,
            password_hash: 'handled_by_auth' // Placeholder since auth handles password
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Try to clean up the auth user if profile creation failed
          await supabase.auth.signOut();
          return { success: false, error: 'Erro ao criar perfil do usuário' };
        }

        console.log('Registration successful:', authData.user.id);
        return { success: true };
      }

      return { success: false, error: 'Falha no registro' };
    } catch (error) {
      console.error('Registration exception:', error);
      return { success: false, error: 'Erro inesperado no registro' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Attempting logout...');
      setIsLoading(true);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      
      console.log('Logout successful');
      
      // Clear local state
      setUser(null);
      setSession(null);
      
      // Force page reload to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local state and redirect
      setUser(null);
      setSession(null);
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
