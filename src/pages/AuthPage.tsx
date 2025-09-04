import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, UserPlus, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const AuthPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Signup form
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    company: '',
    role: 'rh' as 'rh' | 'administrador',
    phone: '',
    department: ''
  });

  // Handle auth redirects and provide system selection
  useEffect(() => {
    if (!loading) {
      if (user) {
        // Check user role and redirect appropriately
        if (user.role === 'corretora_admin' || user.role === 'administrador') {
          navigate('/dashboard');
        } else {
          navigate('/smartbeneficios/dashboard');
        }
      } else {
        // If no user, redirect to system selection to choose login type
        navigate('/system-selection');
      }
    }
  }, [user, navigate, loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu email antes de fazer login');
        } else {
          setError(error.message);
        }
        return;
      }

      toast.success('Login realizado com sucesso!');
      // Navigation will be handled by useEffect based on user role
    } catch (err: any) {
      setError('Erro interno. Tente novamente.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validações
    if (signupForm.password !== signupForm.confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    if (signupForm.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (!signupForm.fullName.trim()) {
      setError('Nome completo é obrigatório');
      setIsLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/smartbeneficios/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signupForm.fullName,
            role: signupForm.role,
            company: signupForm.company,
            phone: signupForm.phone,
            department: signupForm.department
          }
        }
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setError('Este email já está cadastrado. Tente fazer login.');
        } else if (error.message.includes('Password should be at least 6 characters')) {
          setError('A senha deve ter pelo menos 6 caracteres');
        } else {
          setError(error.message);
        }
        return;
      }

      toast.success('Conta criada com sucesso! Verifique seu email.');
      
      // Limpar formulário
      setSignupForm({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        company: '',
        role: 'rh',
        phone: '',
        department: ''
      });

    } catch (err: any) {
      setError('Erro interno. Tente novamente.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth or redirecting
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // This will rarely be shown as the useEffect will redirect
  return null;
};