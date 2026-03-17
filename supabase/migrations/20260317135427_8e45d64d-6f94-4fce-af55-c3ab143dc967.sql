
-- Tabela de logs de manutenção
create table if not exists public.vehicle_maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.frota_veiculos(id) on delete cascade,
  type text not null,
  performed_date date not null,
  odometer_km int not null default 0,
  cost numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger para validação do type
create or replace function public.validate_maintenance_log_type()
returns trigger language plpgsql security definer set search_path = 'public' as $$
begin
  if new.type not in ('BATERIA', 'PNEU', 'REVISAO') then
    raise exception 'Tipo de manutenção inválido: %', new.type;
  end if;
  if new.odometer_km < 0 then
    raise exception 'KM deve ser >= 0';
  end if;
  if new.cost < 0 then
    raise exception 'Custo deve ser >= 0';
  end if;
  return new;
end;
$$;

create trigger trg_validate_maintenance_log_type
  before insert or update on public.vehicle_maintenance_logs
  for each row execute function public.validate_maintenance_log_type();

-- Trigger updated_at
create trigger trg_vehicle_maintenance_logs_updated_at
  before update on public.vehicle_maintenance_logs
  for each row execute function public.update_updated_at_column();

-- Indexes
create index if not exists idx_vml_vehicle on public.vehicle_maintenance_logs(vehicle_id);
create index if not exists idx_vml_vehicle_type on public.vehicle_maintenance_logs(vehicle_id, type);
create index if not exists idx_vml_date on public.vehicle_maintenance_logs(performed_date);

-- RLS
alter table public.vehicle_maintenance_logs enable row level security;

create policy "Users can manage maintenance logs"
  on public.vehicle_maintenance_logs for all
  to authenticated
  using (true)
  with check (true);

-- Tabela de regras de manutenção
create table if not exists public.vehicle_maintenance_rules (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.frota_veiculos(id) on delete cascade,
  type text not null,
  due_every_km int,
  due_every_months int,
  alert_before_km int default 500,
  alert_before_days int default 15,
  created_at timestamptz not null default now(),
  unique(vehicle_id, type)
);

-- Trigger para validação das regras
create or replace function public.validate_maintenance_rule()
returns trigger language plpgsql security definer set search_path = 'public' as $$
begin
  if new.type not in ('BATERIA', 'PNEU', 'REVISAO') then
    raise exception 'Tipo de manutenção inválido: %', new.type;
  end if;
  if new.due_every_km is not null and new.due_every_km <= 0 then
    raise exception 'KM deve ser > 0';
  end if;
  if new.due_every_months is not null and new.due_every_months <= 0 then
    raise exception 'Meses deve ser > 0';
  end if;
  if new.alert_before_km is not null and new.alert_before_km < 0 then
    raise exception 'Alerta KM deve ser >= 0';
  end if;
  if new.alert_before_days is not null and new.alert_before_days < 0 then
    raise exception 'Alerta dias deve ser >= 0';
  end if;
  return new;
end;
$$;

create trigger trg_validate_maintenance_rule
  before insert or update on public.vehicle_maintenance_rules
  for each row execute function public.validate_maintenance_rule();

-- RLS
alter table public.vehicle_maintenance_rules enable row level security;

create policy "Users can manage maintenance rules"
  on public.vehicle_maintenance_rules for all
  to authenticated
  using (true)
  with check (true);
