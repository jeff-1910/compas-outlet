-- =========================================================================
--  Compas Outlet - configuracion de la base de datos
-- -------------------------------------------------------------------------
--  Copia TODO este archivo y pegalo en Supabase:
--    Panel de Supabase  ->  SQL Editor  ->  New query  ->  pegar  ->  Run
--
--  Se puede correr varias veces sin romper nada.
-- =========================================================================

-- ------------------------------------------------------------- Categorias

create table if not exists public.categorias (
  id     text primary key,
  nombre text not null,
  icono  text not null default '',
  orden  int  not null default 0
);

-- -------------------------------------------------------------- Productos

create table if not exists public.productos (
  id           bigint generated always as identity primary key,
  nombre       text    not null,
  categoria    text    references public.categorias(id) on delete set null,
  precio       numeric not null default 0,   -- 0 = "Consultar precio"
  precio_antes numeric not null default 0,   -- 0 = sin oferta
  imagen       text    not null default '',
  descripcion  text    not null default '',
  stock        int     not null default 0,   -- 0 = agotado
  destacado    boolean not null default false,
  etiquetas    text[]  not null default '{}',
  creado_en    timestamptz not null default now()
);

create index if not exists productos_categoria_idx on public.productos (categoria);

-- ------------------------------------------------------- Quien es el dueno
--  La PRIMERA cuenta que se cree queda como dueno de la tienda. Si mas
--  adelante alguien mas se registra, podra mirar pero no tocar nada.
--  Asi puedes crear tu cuenta desde el panel, sin entrar aqui.

create table if not exists public.duenios (
  id        uuid primary key references auth.users(id) on delete cascade,
  creado_en timestamptz not null default now()
);

alter table public.duenios enable row level security;

drop policy if exists "duenios lectura con login" on public.duenios;
create policy "duenios lectura con login"
  on public.duenios for select
  to authenticated
  using (true);

create or replace function public.registrar_primer_duenio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.duenios) = 0 then
    insert into public.duenios (id) values (new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.registrar_primer_duenio();

-- Si ya creaste tu usuario a mano antes de esto, lo marcamos como dueno.
insert into public.duenios (id)
select id from auth.users
where not exists (select 1 from public.duenios)
order by created_at asc
limit 1
on conflict (id) do nothing;

-- Atajo para las reglas de abajo
create or replace function public.es_duenio()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.duenios d where d.id = auth.uid());
$$;

-- ------------------------------------------------- Permisos (importante)
--  Cualquiera puede LEER el catalogo: es una tienda publica.
--  Solo el dueno puede AGREGAR, EDITAR o BORRAR.

alter table public.categorias enable row level security;
alter table public.productos  enable row level security;

drop policy if exists "categorias lectura publica"     on public.categorias;
drop policy if exists "categorias escritura con login" on public.categorias;
drop policy if exists "categorias escritura duenio"    on public.categorias;
drop policy if exists "productos lectura publica"      on public.productos;
drop policy if exists "productos escritura con login"  on public.productos;
drop policy if exists "productos escritura duenio"     on public.productos;

create policy "categorias lectura publica"
  on public.categorias for select
  using (true);

create policy "categorias escritura duenio"
  on public.categorias for all
  to authenticated
  using (public.es_duenio()) with check (public.es_duenio());

create policy "productos lectura publica"
  on public.productos for select
  using (true);

create policy "productos escritura duenio"
  on public.productos for all
  to authenticated
  using (public.es_duenio()) with check (public.es_duenio());

-- ------------------------------------------------ Almacen de fotos

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do update set public = true;

drop policy if exists "fotos lectura publica"     on storage.objects;
drop policy if exists "fotos subida con login"    on storage.objects;
drop policy if exists "fotos borrado con login"   on storage.objects;
drop policy if exists "fotos reemplazo con login" on storage.objects;
drop policy if exists "fotos subida duenio"       on storage.objects;
drop policy if exists "fotos borrado duenio"      on storage.objects;
drop policy if exists "fotos reemplazo duenio"    on storage.objects;

create policy "fotos lectura publica"
  on storage.objects for select
  using (bucket_id = 'fotos');

create policy "fotos subida duenio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'fotos' and public.es_duenio());

create policy "fotos reemplazo duenio"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'fotos' and public.es_duenio());

create policy "fotos borrado duenio"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'fotos' and public.es_duenio());

-- ------------------------------------------------------ Datos iniciales

insert into public.categorias (id, nombre, icono, orden) values
  ('muebles',      'Muebles',      '🛋️', 1),
  ('hogar',        'Hogar',        '🏠', 2),
  ('cocina',       'Cocina',       '🍳', 3),
  ('electronicos', 'Electronicos', '🔌', 4),
  ('ropa',         'Ropa',         '👕', 5),
  ('calzado',      'Calzado',      '👟', 6),
  ('otros',        'Varios',       '✨', 7)
on conflict (id) do update
  set nombre = excluded.nombre,
      icono  = excluded.icono,
      orden  = excluded.orden;

-- Los tres articulos que salieron de las fotos de Instagram.
-- Solo se insertan la primera vez: si ya editaste algo, no se pisa.
insert into public.productos (nombre, categoria, precio, precio_antes, imagen, descripcion, stock, destacado, etiquetas)
select * from (values
  ('Butaca de cuero capitoneada', 'muebles', 0, 0, '',
   'Sillon individual en cuero sintetico negro con respaldo capitoneado y patas de madera. Ideal para sala, recibidor u oficina.',
   1, true, array['butaca','sillon','cuero','sala','negro']),
  ('Caja fuerte con cerradura electronica', 'hogar', 0, 0, '',
   'Gabinete de seguridad en acero con teclado electronico, estantes internos y bolsillos organizadores en la puerta.',
   1, true, array['caja fuerte','seguridad','acero','gabinete']),
  ('Librero hexagonal de pared', 'muebles', 0, 0, '',
   'Estante decorativo en tono oscuro con nichos hexagonales. Perfecto para libros, plantas y adornos.',
   1, true, array['librero','estante','repisa','pared'])
) as nuevos(nombre, categoria, precio, precio_antes, imagen, descripcion, stock, destacado, etiquetas)
where not exists (select 1 from public.productos);

-- =========================================================================
--  Listo. Si no salio ningun error en rojo, la base ya esta preparada.
-- =========================================================================
