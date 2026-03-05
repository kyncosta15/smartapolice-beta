
-- Vehicle Finance table
create table if not exists public.vehicle_finance (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.frota_veiculos(id) on delete cascade,
  empresa_id uuid not null,
  type text not null default 'FINANCIAMENTO',
  bank_name text,
  direct_payment boolean not null default false,
  status text not null default 'EM_ANDAMENTO',
  start_date date,
  term_months int not null default 1,
  installment_value numeric not null default 0,
  installments_paid int not null default 0,
  down_payment numeric default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(vehicle_id)
);

create index if not exists idx_vehicle_finance_vehicle on public.vehicle_finance(vehicle_id);
create index if not exists idx_vehicle_finance_status on public.vehicle_finance(status);
create index if not exists idx_vehicle_finance_bank on public.vehicle_finance(bank_name);
create index if not exists idx_vehicle_finance_empresa on public.vehicle_finance(empresa_id);

-- Vehicle FIPE Snapshots table
create table if not exists public.vehicle_fipe_snapshots (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.frota_veiculos(id) on delete cascade,
  fipe_value numeric not null default 0,
  reference_month date not null,
  created_at timestamptz not null default now(),
  unique(vehicle_id, reference_month)
);

create index if not exists idx_fipe_vehicle_month on public.vehicle_fipe_snapshots(vehicle_id, reference_month);

-- Updated at trigger for vehicle_finance
create or replace function public.update_vehicle_finance_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_vehicle_finance_updated_at
  before update on public.vehicle_finance
  for each row execute function public.update_vehicle_finance_updated_at();

-- RLS for vehicle_finance
alter table public.vehicle_finance enable row level security;

create policy "Users can view vehicle finance for their company"
  on public.vehicle_finance for select
  to authenticated
  using (empresa_id = public.current_empresa_id());

create policy "Users can insert vehicle finance for their company"
  on public.vehicle_finance for insert
  to authenticated
  with check (empresa_id = public.current_empresa_id());

create policy "Users can update vehicle finance for their company"
  on public.vehicle_finance for update
  to authenticated
  using (empresa_id = public.current_empresa_id());

create policy "Users can delete vehicle finance for their company"
  on public.vehicle_finance for delete
  to authenticated
  using (empresa_id = public.current_empresa_id());

-- RLS for vehicle_fipe_snapshots
alter table public.vehicle_fipe_snapshots enable row level security;

create policy "Users can view fipe snapshots for their vehicles"
  on public.vehicle_fipe_snapshots for select
  to authenticated
  using (vehicle_id in (
    select id from public.frota_veiculos where empresa_id = public.current_empresa_id()
  ));

create policy "Users can insert fipe snapshots for their vehicles"
  on public.vehicle_fipe_snapshots for insert
  to authenticated
  with check (vehicle_id in (
    select id from public.frota_veiculos where empresa_id = public.current_empresa_id()
  ));
