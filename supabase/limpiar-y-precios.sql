-- PASO UNICO: columna de precio para borradores + limpieza de la tienda.
-- Antes de correr esto se guardo un respaldo de los 40 articulos en
-- fotos-manifiesto\respaldo-productos-antes-de-borrar.json
-- Es seguro correrlo mas de una vez.

-- 1) El precio de los articulos nuevos (70% de Target x 450 colones)
alter table public.productos_borrador
  add column if not exists precio integer not null default 0;

-- 2) Quitar los articulos cuya foto trae el precio escrito:
--    archivador, estante aereo, cesped, alfombra, cortadora, cafetera, vaso,
--    triturador, bascula, tocador, estacion de salon, medias y lentes.
delete from public.productos
 where id in (6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 22, 27, 28);

-- 3) Quitar toda el area de Belleza (sus articulos y la categoria)
delete from public.productos where categoria = 'belleza';
delete from public.categorias where id = 'belleza';

-- Queda: caja fuerte (5), butacas (43), sillon (44) y bomba de vacio (45).
select id, categoria, nombre from public.productos order by id;
