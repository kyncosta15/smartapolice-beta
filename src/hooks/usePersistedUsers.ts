import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company?: string;
  phone?: string;
  avatar?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export function usePersistedUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar usuários quando usuário admin faz login
  useEffect(() => {
    if (user?.role === 'administrador') {
      loadUsers();
    } else {
      // Para não-admins, mostrar apenas dados básicos mockados
      setUsers([
        {
          id: user?.id || '1',
          name: user?.name || 'Usuário',
          email: user?.email || 'usuario@email.com',
          role: user?.role || 'cliente',
          company: user?.company || 'Empresa',
          phone: user?.phone || '(00) 00000-0000',
          status: 'active'
        }
      ]);
    }
  }, [user?.id, user?.role]);

  const loadUsers = async () => {
    if (!user?.id || user.role !== 'administrador') return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔄 Carregando usuários para admin: ${user.id}`);
      
      const { data: loadedUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        throw usersError;
      }

      if (loadedUsers) {
        setUsers(loadedUsers);
        console.log(`✅ ${loadedUsers.length} usuários carregados com sucesso`);
      } else {
        console.log('📭 Nenhum usuário encontrado');
        setUsers([]);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuários';
      setError(errorMessage);
      console.error('❌ Erro ao carregar usuários:', err);
      
      toast({
        title: "❌ Erro ao Carregar Usuários",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar usuário
  const updateUser = async (userId: string, updates: Partial<User>) => {
    if (!user?.id || user.role !== 'administrador') {
      toast({
        title: "❌ Acesso Negado",
        description: "Apenas administradores podem atualizar usuários",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Atualizar estado local
      setUsers(prev => 
        prev.map(u => u.id === userId ? { ...u, ...updates } : u)
      );

      toast({
        title: "✅ Usuário Atualizado",
        description: "As informações foram salvas com sucesso",
      });

      return true;
    } catch (err) {
      console.error('❌ Erro ao atualizar usuário:', err);
      toast({
        title: "❌ Erro ao Atualizar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
      return false;
    }
  };

  // Deletar usuário (soft delete - mudar status)
  const deleteUser = async (userId: string) => {
    if (!user?.id || user.role !== 'administrador') {
      toast({
        title: "❌ Acesso Negado",
        description: "Apenas administradores podem deletar usuários",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error: deleteError } = await supabase
        .from('users')
        .update({ status: 'inactive' })
        .eq('id', userId);

      if (deleteError) {
        throw deleteError;
      }

      // Remover do estado local
      setUsers(prev => prev.filter(u => u.id !== userId));

      toast({
        title: "✅ Usuário Removido",
        description: "O usuário foi desativado com sucesso",
      });

      return true;
    } catch (err) {
      console.error('❌ Erro ao deletar usuário:', err);
      toast({
        title: "❌ Erro ao Remover",
        description: "Não foi possível remover o usuário",
        variant: "destructive",
      });
      return false;
    }
  };

  // Adicionar novo usuário
  const addUser = async (newUser: Omit<User, 'id' | 'created_at' | 'updated_at'> & { password: string }) => {
    if (!user?.id || user.role !== 'administrador') {
      toast({
        title: "❌ Acesso Negado",
        description: "Apenas administradores podem adicionar usuários",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert([{
          name: newUser.name,
          email: newUser.email,
          password_hash: 'handled_by_auth', // Placeholder - real auth handled by Supabase Auth
          role: newUser.role,
          company: newUser.company,
          phone: newUser.phone,
          status: newUser.status || 'active'
        }])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      if (createdUser) {
        setUsers(prev => [createdUser, ...prev]);
        
        toast({
          title: "✅ Usuário Criado",
          description: `${newUser.name} foi adicionado com sucesso`,
        });
        
        return true;
      }

      return false;
    } catch (err) {
      console.error('❌ Erro ao criar usuário:', err);
      toast({
        title: "❌ Erro ao Criar",
        description: "Não foi possível criar o usuário",
        variant: "destructive",
      });
      return false;
    }
  };

  // Recarregar dados
  const refreshUsers = () => {
    if (user?.role === 'administrador') {
      loadUsers();
    }
  };

  return {
    users,
    isLoading,
    error,
    updateUser,
    deleteUser,
    addUser,
    refreshUsers,
    canManageUsers: user?.role === 'administrador'
  };
}