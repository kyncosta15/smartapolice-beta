-- Create bucket for documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rcorp-docs', 
  'rcorp-docs', 
  false,
  20971520,
  ARRAY['application/pdf','image/jpeg','image/png','image/jpg','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
on conflict (id) do nothing;

-- Storage RLS policies
create policy "Authenticated users can upload rcorp docs"
on storage.objects for insert
to authenticated
with check (bucket_id = 'rcorp-docs');

create policy "Authenticated users can read rcorp docs"
on storage.objects for select
to authenticated
using (bucket_id = 'rcorp-docs');

create policy "Authenticated users can delete rcorp docs"
on storage.objects for delete
to authenticated
using (bucket_id = 'rcorp-docs');

-- Documents metadata table
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  account_id uuid,
  title text not null,
  original_filename text not null,
  file_extension text,
  mime_type text,
  file_size bigint not null default 0,
  bucket_name text not null default 'rcorp-docs',
  storage_path text not null,
  entity_type text not null default 'GERAL',
  vehicle_id uuid references public.frota_veiculos(id) on delete set null,
  policy_id uuid references public.policies(id) on delete set null,
  insurer text,
  category text not null default 'OUTROS',
  tags text[],
  description text,
  document_date date,
  uploaded_by_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_docs_vehicle on public.documents(vehicle_id);
create index if not exists idx_docs_policy on public.documents(policy_id);
create index if not exists idx_docs_category on public.documents(category);
create index if not exists idx_docs_insurer on public.documents(insurer);
create index if not exists idx_docs_created on public.documents(account_id, created_at desc);
create index if not exists idx_docs_entity on public.documents(entity_type);

-- Validation trigger
create or replace function public.validate_document_entity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.entity_type not in ('GERAL', 'VEICULO', 'APOLICE') then
    raise exception 'entity_type inválido: %', new.entity_type;
  end if;
  if new.category not in ('APOLICE', 'ENDOSSO', 'BOLETO', 'LAUDO', 'CRLV', 'CNH', 'FOTO', 'OUTROS') then
    raise exception 'category inválida: %', new.category;
  end if;
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_validate_document
before insert or update on public.documents
for each row execute function public.validate_document_entity();

-- RLS
alter table public.documents enable row level security;

create policy "Users can view documents"
on public.documents for select
to authenticated
using (deleted_at is null);

create policy "Users can insert documents"
on public.documents for insert
to authenticated
with check (true);

create policy "Users can update documents"
on public.documents for update
to authenticated
using (true);