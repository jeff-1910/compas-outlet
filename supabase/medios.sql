-- =========================================================================
--  Compas Outlet - varias fotos y videos por articulo
-- -------------------------------------------------------------------------
--  Copia TODO este archivo y pegalo en Supabase:
--    Panel de Supabase  ->  SQL Editor  ->  New query  ->  pegar  ->  Run
--
--  Se puede correr varias veces sin romper nada.
-- =========================================================================

-- La galeria del articulo, en orden: [{"tipo": "imagen", "url": "..."}, ...]
-- La columna "imagen" se conserva como portada, para lo que ya la usa.
alter table public.productos
  add column if not exists medios jsonb not null default '[]'::jsonb;

-- Los articulos que ya tenian foto la conservan como primera de la galeria.
update public.productos
set medios = jsonb_build_array(jsonb_build_object('tipo', 'imagen', 'url', imagen))
where imagen <> '' and medios = '[]'::jsonb;

-- Tiene que ser una lista: asi un error al guardar no deja basura adentro.
alter table public.productos drop constraint if exists productos_medios_es_lista;
alter table public.productos add constraint productos_medios_es_lista
  check (jsonb_typeof(medios) = 'array');

-- =========================================================================
--  Listo. Si no salio ningun error en rojo, ya se pueden subir galerias.
-- =========================================================================
