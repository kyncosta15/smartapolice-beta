
-- Habilitar Row Level Security na tabela users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Política para permitir inserção durante o registro (será usado pela função de registro)
CREATE POLICY "Enable insert for registration" ON public.users
  FOR INSERT WITH CHECK (true);

-- Política para permitir que usuários atualizem seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Política para administradores verem todos os usuários
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'administrador'
    )
  );
