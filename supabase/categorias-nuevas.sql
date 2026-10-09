-- =========================================================================
--  Compas Outlet - areas nuevas (categorias)
-- -------------------------------------------------------------------------
--  OPCIONAL y para despues: corre este archivo cuando vayas a aprobar el
--  primer lote, no antes. Estas areas son PUBLICAS: aparecen como filtro en
--  la tienda, y una area sin articulos se veria vacia.
--
--  Copia TODO este archivo y pegalo en Supabase:
--    Panel de Supabase  ->  SQL Editor  ->  New query  ->  pegar  ->  Run
--
--  Se puede correr varias veces; no toca las areas que ya tienes.
-- =========================================================================

insert into public.categorias (id, nombre, icono, orden) values
  ('herramientas', 'Herramientas',      '🛠️', 8),
  ('jardin',       'Jardin y exteriores','🌿', 9),
  ('juguetes',     'Juguetes',          '🧸', 10),
  ('cama',         'Ropa de cama',      '🛏️', 11)
on conflict (id) do nothing;
