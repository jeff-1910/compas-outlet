-- =========================================================================
--  Compas Outlet - borradores de articulos (esperan tu aprobacion)
-- -------------------------------------------------------------------------
--  Copia TODO este archivo y pegalo en Supabase:
--    Panel de Supabase  ->  SQL Editor  ->  New query  ->  pegar  ->  Run
--
--  Que hace: crea una tabla APARTE, privada, donde quedan los articulos
--  nuevos (con sus fotos y su area sugerida) hasta que los apruebes.
--  No toca la tabla "productos": la tienda y el bot siguen igual, y nada de
--  lo que este aqui se ve en la pagina hasta que lo apruebes.
--
--  Se puede correr varias veces sin romper nada.
-- =========================================================================

create table if not exists public.productos_borrador (
  id           bigint generated always as identity primary key,
  upc          text    not null unique,              -- codigo del articulo
  nombre       text    not null,
  descripcion  text    not null default '',
  marca        text    not null default '',
  categoria    text    references public.categorias(id) on delete set null,
  medios       jsonb   not null default '[]'::jsonb, -- fotos: [{"tipo":"imagen","url":"..."}]
  cantidad     int     not null default 1,           -- piezas recibidas
  pallet       text    not null default '',
  estado       text    not null default 'pendiente'
               check (estado in ('pendiente', 'enviado', 'aprobado', 'descartado')),
  producto_id  bigint  references public.productos(id) on delete set null, -- se llena al aprobar
  creado_en    timestamptz not null default now(),
  decidido_en  timestamptz
);

-- Igual que la tienda: 5 fotos como maximo por articulo.
alter table public.productos_borrador drop constraint if exists borrador_medios_es_lista;
alter table public.productos_borrador add constraint borrador_medios_es_lista
  check (case when jsonb_typeof(medios) = 'array' then jsonb_array_length(medios) <= 5 else false end);

create index if not exists productos_borrador_estado_idx on public.productos_borrador (estado);

-- ------------------------------------------------- Permisos (importante)
--  A diferencia del catalogo, los borradores NO son publicos:
--  solo el dueno puede verlos y cambiarlos.

alter table public.productos_borrador enable row level security;

drop policy if exists "borrador solo duenio" on public.productos_borrador;
create policy "borrador solo duenio"
  on public.productos_borrador for all
  to authenticated
  using (public.es_duenio()) with check (public.es_duenio());

-- =========================================================================
--  Listo. Si no salio ningun error en rojo, ya existe la tabla de borradores.
-- =========================================================================
