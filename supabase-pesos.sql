-- Pesos de entrenar.html. Pégalo en Supabase → SQL Editor → Run.
create table if not exists public.pesos_entreno (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  semana      date        not null,
  dia         text        not null,
  ejercicio   text        not null,
  kg          numeric(6,2) not null check (kg >= 0)
);

create index if not exists pesos_entreno_ej_idx
  on public.pesos_entreno (dia, ejercicio, created_at desc);

alter table public.pesos_entreno enable row level security;

-- La web no tiene login: la clave pública puede leer y añadir, no editar ni borrar.
create policy "leer pesos"  on public.pesos_entreno for select to anon using (true);
create policy "anadir pesos" on public.pesos_entreno for insert to anon with check (true);
