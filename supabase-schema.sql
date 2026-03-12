-- ================================================
-- CONTROL FINANCIERO — Schema para Supabase
-- Ejecuta esto en: Supabase Dashboard → SQL Editor → New Query
-- ================================================

-- 1. Perfiles de usuario
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
-- Admin can view all profiles
create policy "Admin can view all profiles" on profiles for select using (
  auth.jwt() ->> 'email' = current_setting('app.settings.admin_email', true)
);

-- 2. Cubos personalizados por usuario
create table if not exists user_cubos (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null,
  cubo_id text not null,
  emoji text default '💰',
  nombre text not null,
  presupuesto numeric default 0,
  tipo text default 'diario' check (tipo in ('fijo', 'semanal', 'diario')),
  color text default '#22C55E',
  sort_order int default 0,
  created_at timestamptz default now(),
  unique(user_id, cubo_id)
);

alter table user_cubos enable row level security;

create policy "Users manage own cubos" on user_cubos for all using (auth.uid() = user_id);

-- 3. Datos mensuales (ingresos)
create table if not exists monthly_data (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null,
  month text not null, -- formato: '2026-03'
  ingresos numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, month)
);

alter table monthly_data enable row level security;

create policy "Users manage own monthly data" on monthly_data for all using (auth.uid() = user_id);
-- Admin read
create policy "Admin can read all monthly data" on monthly_data for select using (
  auth.jwt() ->> 'email' = current_setting('app.settings.admin_email', true)
);

-- 4. Gastos individuales (para cubos diarios/semanales)
create table if not exists expenses (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null,
  month text not null,
  cubo_id text not null,
  cantidad numeric not null default 0,
  nota text,
  created_at timestamptz default now()
);

alter table expenses enable row level security;

create policy "Users manage own expenses" on expenses for all using (auth.uid() = user_id);
-- Admin read
create policy "Admin can read all expenses" on expenses for select using (
  auth.jwt() ->> 'email' = current_setting('app.settings.admin_email', true)
);

-- 5. Totales de cubos fijos (editados manualmente por mes)
create table if not exists cubo_totals (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete cascade not null,
  month text not null,
  cubo_id text not null,
  total numeric default 0,
  created_at timestamptz default now(),
  unique(user_id, month, cubo_id)
);

alter table cubo_totals enable row level security;

create policy "Users manage own cubo totals" on cubo_totals for all using (auth.uid() = user_id);
-- Admin read
create policy "Admin can read all cubo totals" on cubo_totals for select using (
  auth.jwt() ->> 'email' = current_setting('app.settings.admin_email', true)
);

-- ================================================
-- NOTA SOBRE ADMIN:
-- Las políticas de admin usan current_setting('app.settings.admin_email')
-- Si no funciona, puedes simplificar reemplazando esas policies por:
--   auth.jwt() ->> 'email' = 'TU-EMAIL-ADMIN@ejemplo.com'
-- ================================================
