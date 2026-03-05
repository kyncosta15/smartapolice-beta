-- Add stolen tracking columns to frota_veiculos
alter table public.frota_veiculos
add column if not exists is_stolen_current boolean not null default false,
add column if not exists stolen_current_date date;

-- Vehicle theft events table
create table if not exists public.vehicle_theft_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.frota_veiculos(id) on delete cascade,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  event_date date not null,
  status text not null default 'ROUBADO' check (status in ('ROUBADO','RECUPERADO')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_theft_events_vehicle on public.vehicle_theft_events(vehicle_id);
create index if not exists idx_theft_events_date on public.vehicle_theft_events(event_date);
create index if not exists idx_theft_events_empresa on public.vehicle_theft_events(empresa_id);

-- Theft risk reference table
create table if not exists public.theft_risk_reference (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete cascade,
  reference_date date not null,
  make text not null,
  model text not null,
  year_from int,
  year_to int,
  risk_score numeric not null,
  risk_level text not null check (risk_level in ('BAIXO','MEDIO','ALTO')),
  source text,
  notes text,
  created_at timestamptz not null default now(),
  unique(reference_date, make, model, year_from, year_to)
);

create index if not exists idx_theft_risk_refdate on public.theft_risk_reference(reference_date);
create index if not exists idx_theft_risk_make_model on public.theft_risk_reference(make, model);

-- RLS for vehicle_theft_events
alter table public.vehicle_theft_events enable row level security;

create policy "Users can view theft events for their empresa"
  on public.vehicle_theft_events for select
  to authenticated
  using (public.is_member_of(empresa_id));

create policy "Users can insert theft events for their empresa"
  on public.vehicle_theft_events for insert
  to authenticated
  with check (public.is_member_of(empresa_id));

create policy "Users can update theft events for their empresa"
  on public.vehicle_theft_events for update
  to authenticated
  using (public.is_member_of(empresa_id));

create policy "Users can delete theft events for their empresa"
  on public.vehicle_theft_events for delete
  to authenticated
  using (public.is_member_of(empresa_id));

-- RLS for theft_risk_reference
alter table public.theft_risk_reference enable row level security;

create policy "Anyone authenticated can view theft risk reference"
  on public.theft_risk_reference for select
  to authenticated
  using (true);

create policy "Admins can manage theft risk reference"
  on public.theft_risk_reference for insert
  to authenticated
  with check (true);

create policy "Admins can update theft risk reference"
  on public.theft_risk_reference for update
  to authenticated
  using (true);

create policy "Admins can delete theft risk reference"
  on public.theft_risk_reference for delete
  to authenticated
  using (true);