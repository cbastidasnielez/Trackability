-- Log de entrenamientos · segunda parte. Pégalo en Supabase → SQL Editor → Run.
-- Se puede ejecutar más de una vez sin problema.

-- 1) Pesos: guardar también el valor y la unidad con que se anotó (kg o lb).
alter table public.pesos_entreno
  add column if not exists valor  numeric(7,2),
  add column if not exists unidad text not null default 'kg';

update public.pesos_entreno set valor = kg where valor is null;

alter table public.pesos_entreno drop constraint if exists pesos_entreno_unidad_check;
alter table public.pesos_entreno add constraint pesos_entreno_unidad_check check (unidad in ('kg', 'lb'));

-- 2) Poder borrar un registro equivocado.
drop policy if exists "borrar pesos" on public.pesos_entreno;
create policy "borrar pesos" on public.pesos_entreno for delete to anon using (true);
grant delete on public.pesos_entreno to anon;

-- 3) Ejercicios marcados y la última vez que se marcó cada uno.
create table if not exists public.ejercicios_hechos (
  semana      date        not null,
  dia         text        not null,
  ejercicio   text        not null,
  hecho       boolean     not null default true,
  marcado_at  timestamptz not null default now(),
  primary key (semana, dia, ejercicio)
);

alter table public.ejercicios_hechos enable row level security;
grant select, insert, update on public.ejercicios_hechos to anon;

drop policy if exists "leer hechos"      on public.ejercicios_hechos;
drop policy if exists "anadir hechos"    on public.ejercicios_hechos;
drop policy if exists "actualizar hechos" on public.ejercicios_hechos;
create policy "leer hechos"       on public.ejercicios_hechos for select to anon using (true);
create policy "anadir hechos"     on public.ejercicios_hechos for insert to anon with check (true);
create policy "actualizar hechos" on public.ejercicios_hechos for update to anon using (true) with check (true);
