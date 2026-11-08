/* =========================================================================
   /sitemap.xml  --  la lista de paginas que se le entrega a Google.

   Se arma sola con lo que hay en Supabase: cuando entra un articulo nuevo
   aparece aqui, y cuando se agota desaparece. Nadie tiene que editarla.
   ========================================================================= */

import { TIENDA, escapar, traerCategorias, traerProductos } from "./_seo.js";

const FIJAS = [
  ["/", "daily", "1.0"],
  ["/devoluciones.html", "yearly", "0.4"],
  ["/terminos.html", "yearly", "0.3"],
  ["/privacidad.html", "yearly", "0.3"],
  ["/cookies.html", "yearly", "0.2"],
];

export default async function handler(req, res) {
  let categorias, productos;
  try {
    [categorias, productos] = await Promise.all([traerCategorias(), traerProductos()]);
  } catch {
    // Mejor un error temporal que un sitemap sin articulos: Google reintenta.
    res.statusCode = 503;
    res.setHeader("Retry-After", "600");
    return res.end("Sitemap no disponible por ahora");
  }

  const filas = FIJAS.map(([ruta, freq, prio]) => [TIENDA + ruta, freq, prio]);

  // Una categoria con 1 o 2 articulos seria una pagina casi vacia: no se ofrece a Google.
  categorias
    .filter((c) => productos.filter((p) => p.categoria === c.id).length >= 3)
    .forEach((c) => filas.push([`${TIENDA}/categoria/${c.id}`, "daily", "0.8"]));

  productos.forEach((p) => filas.push([`${TIENDA}/p/${p.id}`, "weekly", "0.6"]));

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    filas
      .map(
        ([loc, freq, prio]) =>
          `  <url><loc>${escapar(loc)}</loc><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  res.end(xml);
}
