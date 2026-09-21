-- =========================================================================
--  Compas Outlet - varias fotos por articulo (hasta 5)
-- -------------------------------------------------------------------------
--  Copia TODO este archivo y pegalo en Supabase:
--    Panel de Supabase  ->  SQL Editor  ->  New query  ->  pegar  ->  Run
--
--  Se puede correr varias veces sin romper nada.
-- =========================================================================

-- Las fotos del articulo, en orden: [{"tipo": "imagen", "url": "..."}, ...]
-- La columna "imagen" se conserva como portada, para lo que ya la usa.
alter table public.productos
  add column if not exists medios jsonb not null default '[]'::jsonb;

-- Los articulos que ya tenian foto la conservan como primera de la galeria.
update public.productos
set medios = jsonb_build_array(jsonb_build_object('tipo', 'imagen', 'url', imagen))
where imagen <> '' and medios = '[]'::jsonb;

-- Tiene que ser una lista de 5 fotos como mucho: asi un error al guardar no
-- deja basura adentro, y el almacen gratis no se llena con un solo articulo.
alter table public.productos drop constraint if exists productos_medios_es_lista;
alter table public.productos add constraint productos_medios_es_lista
  check (case when jsonb_typeof(medios) = 'array' then jsonb_array_length(medios) <= 5 else false end);

-- =========================================================================
--  Listo. Si no salio ningun error en rojo, ya se pueden subir varias fotos.
-- =========================================================================
