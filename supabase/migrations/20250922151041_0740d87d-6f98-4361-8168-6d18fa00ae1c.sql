-- Criar tabela user_profiles
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  photo_url text,
  photo_path text,
  settings jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índice para performance
create index if not exists idx_user_profiles_updated_at on public.user_profiles(updated_at);

-- Função para atualizar updated_at
create or replace function public.touch_user_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para updated_at
drop trigger if exists trg_touch_user_profiles on public.user_profiles;
create trigger trg_touch_user_profiles
before update on public.user_profiles
for each row execute function public.touch_user_profiles_updated_at();

-- RLS Policies
alter table public.user_profiles enable row level security;

-- Usuário pode ver apenas seu próprio perfil
create policy "profile_select_own"
on public.user_profiles for select
using ( auth.uid() = id );

-- Usuário pode inserir seu próprio registro
create policy "profile_insert_own"
on public.user_profiles for insert
with check ( auth.uid() = id );

-- Usuário pode atualizar apenas o próprio
create policy "profile_update_own"
on public.user_profiles for update
using ( auth.uid() = id )
with check ( auth.uid() = id );

-- Função para auto-criação de perfil no primeiro login
create or replace function public.ensure_profile()
returns trigger as $$
begin
  insert into public.user_profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql;

-- Trigger para criar perfil automaticamente
drop trigger if exists trg_ensure_profile on auth.users;
create trigger trg_ensure_profile
after insert on auth.users
for each row execute function public.ensure_profile();

-- Criar bucket avatars se não existir
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Políticas do Storage para avatars
create policy "read_public_avatars"
on storage.objects for select
using ( bucket_id = 'avatars' );

create policy "upload_own_avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and (auth.uid())::text = (storage.foldername(name))[1]
);

create policy "update_delete_own_avatars"
on storage.objects for update using (
  bucket_id = 'avatars'
  and (auth.uid())::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and (auth.uid())::text = (storage.foldername(name))[1]
);

create policy "delete_own_avatars"
on storage.objects for delete using (
  bucket_id = 'avatars'
  and (auth.uid())::text = (storage.foldername(name))[1]
);