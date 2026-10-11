-- Los 11 articulos que entraron despues y quedaron en "Varios".
-- Supabase -> SQL Editor -> New query -> pegar -> Run. No borra nada.

update public.productos set categoria = 'cama'
 where categoria = 'otros' and id in (255, 257, 261, 262, 265, 272, 277, 283, 284);

update public.productos set categoria = 'cocina'  where categoria = 'otros' and id = 264;  -- termo Stanley
update public.productos set categoria = 'jardin'  where categoria = 'otros' and id = 281;  -- paletas de pickleball

select c.nombre, count(p.id) as articulos
  from public.categorias c left join public.productos p on p.categoria = c.id
 group by c.nombre, c.orden order by c.orden;
