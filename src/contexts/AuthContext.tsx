
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

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      console.log('🔍 Fetching user profile for:', userId);
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        return null;
      }

      if (userProfile) {
        console.log('✅ User profile loaded:', userProfile);
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
      console.error('💥 Exception loading user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    console.log('🚀 Setting up auth state listener...');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state change:', event, session ? 'with session' : 'no session');
        
        if (!mounted) return;

        // Update session immediately
        setSession(session);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🔑 User signed in, loading profile...');
          
          // Defer the profile loading to avoid blocking the auth state change
          setTimeout(async () => {
            if (!mounted) return;
            
            const userProfile = await fetchUserProfile(session.user.id);
            
            if (mounted) {
              setUser(userProfile);
              setIsLoading(false);
              console.log('✅ User profile set after signin:', userProfile?.name || 'Unknown');
            }
          }, 100);
          
        } else if (event === 'SIGNED_OUT' || !session) {
          console.log('👋 User signed out or no session');
          setUser(null);
          setIsLoading(false);
        } else if (session?.user) {
          // For existing sessions, load profile
          setTimeout(async () => {
            if (!mounted) return;
            
            const userProfile = await fetchUserProfile(session.user.id);
            
            if (mounted) {
              setUser(userProfile);
              setIsLoading(false);
            }
          }, 100);
        } else {
          setIsLoading(false);
        }
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔍 Getting initial session...');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
          if (mounted) setIsLoading(false);
          return;
        }

        if (!mounted) return;

        console.log('📋 Initial session:', initialSession ? 'Found' : 'None');
        
        if (initialSession?.user) {
          setSession(initialSession);
          
          // Load user profile for initial session
          const userProfile = await fetchUserProfile(initialSession.user.id);
          
          if (mounted) {
            setUser(userProfile);
            setIsLoading(false);
            console.log('✅ Initial auth complete with user:', userProfile?.name || 'Unknown');
          }
        } else {
          // No initial session
          setSession(null);
          setUser(null);
          setIsLoading(false);
          console.log('🏁 No initial session found');
        }
      } catch (error) {
        console.error('💥 Auth initialization error:', error);
        if (mounted) setIsLoading(false);
      }
    };

    // Initialize auth
    initializeAuth();

    return () => {
      console.log('🧹 Cleaning up auth');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to prevent re-runs

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('🔐 Starting login for:', email);
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        console.log('✅ Login successful for user:', data.user.id);
        // Loading state will be managed by the auth state listener
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('💥 Login exception:', error);
      setIsLoading(false);
      return { success: false, error: 'Erro inesperado no login' };
    }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
    console.log('📝 Starting registration for:', userData.email);
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
        console.error('❌ Auth signup error:', authError);
        setIsLoading(false);
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        console.log('✅ User registered:', authData.user.id);
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
          console.error('❌ Profile creation error:', profileError);
          // Try to clean up the auth user if profile creation failed
          await supabase.auth.signOut();
          setIsLoading(false);
          return { success: false, error: 'Erro ao criar perfil do usuário' };
        }

        console.log('✅ Registration successful');
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Falha no registro' };
    } catch (error) {
      console.error('💥 Registration exception:', error);
      setIsLoading(false);
      return { success: false, error: 'Erro inesperado no registro' };
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Attempting logout...');
      setIsLoading(true);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
      }
      
      console.log('✅ Logout successful');
      
      // Clear local state (will also be handled by auth state change)
      setUser(null);
      setSession(null);
      setIsLoading(false);
      
    } catch (error) {
      console.error('💥 Logout error:', error);
      // Even if there's an error, clear local state
      setUser(null);
      setSession(null);
      setIsLoading(false);
    }
  };

  console.log('🎯 Auth context render:', { 
    user: user?.name || 'None', 
    isLoading, 
    hasSession: !!session 
  });

  return (
    <AuthContext.Provider value={{ user, session, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
