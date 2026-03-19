
-- Tabela de vistorias do tacógrafo
create table if not exists public.truck_tachograph_inspections (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.frota_veiculos(id) on delete cascade,
  inspection_date date not null,
  valid_until date not null,
  provider_name text,
  certificate_number text,
  cost numeric not null default 0,
  notes text,
  attachments jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tacho_vehicle on public.truck_tachograph_inspections(vehicle_id);
create index if not exists idx_tacho_valid_until on public.truck_tachograph_inspections(valid_until);

-- Tabela de registros anuais do tacógrafo
create table if not exists public.truck_tachograph_yearly_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.frota_veiculos(id) on delete cascade,
  year int not null,
  summary text,
  km_start int,
  km_end int,
  incidents text,
  notes text,
  created_at timestamptz not null default now(),
  unique(vehicle_id, year)
);

create index if not exists idx_tacho_year_vehicle on public.truck_tachograph_yearly_records(vehicle_id, year);

-- RLS para vistorias
alter table public.truck_tachograph_inspections enable row level security;

create policy "Users can view tachograph inspections for their vehicles"
  on public.truck_tachograph_inspections for select to authenticated
  using (
    vehicle_id in (
      select id from public.frota_veiculos where empresa_id = public.current_empresa_id()
    )
  );

create policy "Users can insert tachograph inspections for their vehicles"
  on public.truck_tachograph_inspections for insert to authenticated
  with check (
    vehicle_id in (
      select id from public.frota_veiculos where empresa_id = public.current_empresa_id()
    )
  );

create policy "Users can update tachograph inspections for their vehicles"
  on public.truck_tachograph_inspections for update to authenticated
  using (
    vehicle_id in (
      select id from public.frota_veiculos where empresa_id = public.current_empresa_id()
    )
  );

create policy "Users can delete tachograph inspections for their vehicles"
  on public.truck_tachograph_inspections for delete to authenticated
  using (
    vehicle_id in (
      select id from public.frota_veiculos where empresa_id = public.current_empresa_id()
    )
  );

-- RLS para registros anuais
alter table public.truck_tachograph_yearly_records enable row level security;

create policy "Users can view tachograph yearly records for their vehicles"
  on public.truck_tachograph_yearly_records for select to authenticated
  using (
    vehicle_id in (
      select id from public.frota_veiculos where empresa_id = public.current_empresa_id()
    )
  );

create policy "Users can insert tachograph yearly records for their vehicles"
  on public.truck_tachograph_yearly_records for insert to authenticated
  with check (
    vehicle_id in (
      select id from public.frota_veiculos where empresa_id = public.current_empresa_id()
    )
  );

create policy "Users can update tachograph yearly records for their vehicles"
  on public.truck_tachograph_yearly_records for update to authenticated
  using (
    vehicle_id in (
      select id from public.frota_veiculos where empresa_id = public.current_empresa_id()
    )
  );

create policy "Users can delete tachograph yearly records for their vehicles"
  on public.truck_tachograph_yearly_records for delete to authenticated
  using (
    vehicle_id in (
      select id from public.frota_veiculos where empresa_id = public.current_empresa_id()
    )
  );

-- Trigger de validação para cost >= 0
create or replace function public.validate_tachograph_inspection()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if new.cost < 0 then
    raise exception 'Custo deve ser >= 0';
  end if;
  return new;
end;
$$;

create trigger trg_validate_tachograph_inspection
  before insert or update on public.truck_tachograph_inspections
  for each row execute function public.validate_tachograph_inspection();

-- Trigger de validação para yearly records
create or replace function public.validate_tachograph_yearly_record()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if new.year < 2000 then
    raise exception 'Ano deve ser >= 2000';
  end if;
  if new.km_start is not null and new.km_start < 0 then
    raise exception 'KM início deve ser >= 0';
  end if;
  if new.km_end is not null and new.km_end < 0 then
    raise exception 'KM fim deve ser >= 0';
  end if;
  return new;
end;
$$;

create trigger trg_validate_tachograph_yearly_record
  before insert or update on public.truck_tachograph_yearly_records
  for each row execute function public.validate_tachograph_yearly_record();
