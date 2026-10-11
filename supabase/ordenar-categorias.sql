-- =========================================================================
--  Compas Outlet - ordenar las categorias
--  1) Crea las areas que faltan: Herramientas, Jardin, Juguetes, Ropa de cama
--  2) Pasa los 125 articulos que estaban en "Varios" a su area
--  Se puede correr mas de una vez. No borra nada.
--  Supabase -> SQL Editor -> New query -> pegar -> Run
-- =========================================================================

insert into public.categorias (id, nombre, icono, orden) values
  ('herramientas', 'Herramientas',       '🛠️', 8),
  ('jardin',       'Jardín y exteriores', '🌿', 9),
  ('juguetes',     'Juguetes',           '🧸', 10),
  ('cama',         'Ropa de cama',       '🛏️', 11)
on conflict (id) do nothing;

-- Ropa de cama (88): edredones, cobertores, mantas, sabanas, colchonetas y colchones
update public.productos set categoria = 'cama' where categoria = 'otros' and id in (50, 55, 60, 63, 64, 65, 66, 71, 72, 75, 76, 80, 86, 89, 92, 93, 99, 103, 105, 107, 109, 118, 121, 122, 123, 124, 125, 127, 128, 129, 130, 146, 148, 149, 150, 151, 152, 153, 155, 160, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 185, 192, 193, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 213, 216, 218, 219, 221, 222, 224, 225, 226, 229, 232, 234, 238, 241, 242, 243, 247, 248, 253, 254);

-- Jardin y exteriores (27): tapetes de exterior, hieleras, patio, playa, cortadora de cesped
update public.productos set categoria = 'jardin' where categoria = 'otros' and id in (53, 56, 59, 67, 70, 78, 79, 87, 100, 101, 104, 111, 137, 156, 158, 159, 163, 182, 183, 187, 188, 191, 220, 223, 240, 244, 249);

-- Juguetes (9): bicicletas infantiles, casas de munecas, scooters, triciclo
update public.productos set categoria = 'juguetes' where categoria = 'otros' and id in (57, 62, 74, 81, 102, 145, 178, 235, 237);

-- Hogar (1): tapete para interior y exterior
update public.productos set categoria = 'hogar' where categoria = 'otros' and id in (215);

-- Resultado: cuantos articulos hay ahora en cada area
select c.nombre, count(p.id) as articulos
  from public.categorias c left join public.productos p on p.categoria = c.id
 group by c.nombre, c.orden order by c.orden;
