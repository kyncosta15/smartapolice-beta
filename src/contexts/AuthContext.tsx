
import React, { createContext, useContext, useState, useEffect } from 'react';

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
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula verificação de token no localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erro ao recuperar usuário:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simula chamada de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock de usuários para demonstração
      const mockUsers = [
        {
          id: '1',
          email: 'admin@empresa.com',
          name: 'João Silva',
          role: 'administrador' as UserRole,
          company: 'Empresa ABC',
          phone: '(11) 99999-9999'
        },
        {
          id: '2',
          email: 'cliente@exemplo.com',
          name: 'Maria Santos',
          role: 'cliente' as UserRole,
          company: 'Consultoria XYZ',
          phone: '(11) 88888-8888'
        },
        {
          id: '3',
          email: 'corretora@seguro.com',
          name: 'Carlos Ferreira',
          role: 'corretora' as UserRole,
          company: 'Corretora Seguros Pro',
          phone: '(11) 77777-7777'
        }
      ];

      const foundUser = mockUsers.find(u => u.email === email);
      
      if (foundUser && password === '123456') {
        setUser(foundUser);
        localStorage.setItem('user', JSON.stringify(foundUser));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simula chamada de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        company: userData.company,
        phone: userData.phone
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
