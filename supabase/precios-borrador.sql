-- Precio de cada articulo nuevo, calculado como el 70% del precio de Target
-- (en dolares) por 450 colones. Se guarda junto al borrador para que, al
-- aprobarlo, salga publicado con su precio.
-- Es seguro correrlo mas de una vez.
alter table public.productos_borrador
  add column if not exists precio integer not null default 0;
