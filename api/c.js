/* =========================================================================
   Pagina de una categoria: /categoria/<id>   (ej. /categoria/muebles)

   Es la pagina que Google puede mostrar cuando alguien busca "muebles outlet
   Costa Rica" o "ropa de cama outlet". Lleva texto propio, la lista de
   articulos con foto y precio, y un enlace a cada ficha (/p/<id>).
   ========================================================================= */

import {
  TIENDA, WHATSAPP, TEXTOS, escapar, precio, jsonLd, documento,
  traerCategorias, traerProductos,
} from "./_seo.js";

export default async function handler(req, res) {
  const id = String(req.query.id || "").toLowerCase();
  if (!/^[a-z0-9-]{1,40}$/.test(id)) {
    res.statusCode = 302;
    res.setHeader("Location", "/");
    return res.end();
  }

  let categorias, productos;
  try {
    [categorias, productos] = await Promise.all([traerCategorias(), traerProductos()]);
  } catch {
    // Supabase no contesto: no se inventa una pagina vacia, se manda a la tienda.
    res.statusCode = 302;
    res.setHeader("Location", "/");
    res.setHeader("Cache-Control", "public, s-maxage=30");
    return res.end();
  }

  const cat = categorias.find((c) => c.id === id);
  const lista = productos.filter((p) => p.categoria === id);
  if (!cat || !lista.length) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(
      documento({
        titulo: "Categoría no disponible | Compas Outlet",
        descripcion: "Esta categoría no tiene artículos por ahora. Mira todo lo que hay en la tienda.",
        url: TIENDA + "/",
        robots: "noindex",
        cuerpo: `<h1>Esta categoría no tiene artículos por ahora</h1><p class="intro">Mira todo lo que hay en la tienda.</p><a class="btn az" href="/">Ir a la tienda</a>`,
      })
    );
  }

  const t = TEXTOS[id] || {
    titulo: `${cat.nombre} a precio de outlet en Costa Rica`,
    h1: `${cat.nombre} a precio de outlet`,
    intro: `${cat.nombre} a precio de outlet. Lotes limitados, con garantía de 30 días en todo artículo.`,
  };
  const url = `${TIENDA}/categoria/${id}`;
  const descripcion =
    `${t.h1}: ${lista.length} artículos disponibles. Garantía de 30 días, envío gratis en Heredia y alrededores y pedidos por WhatsApp.`;

  const tarjetas = lista
    .slice(0, 300)
    .map(
      (p, i) => `<li><a href="/p/${p.id}">
  ${p.imagen ? `<img src="${escapar(p.imagen)}" alt="${escapar(p.nombre)}" width="400" height="400" loading="${i < 4 ? "eager" : "lazy"}" decoding="async">` : ""}
  <div class="t"><p class="n">${escapar(p.nombre)}</p><span class="p">${
        Number(p.precio) > 0 ? precio(p.precio) : "Consultar precio"
      }</span></div></a></li>`
    )
    .join("\n");

  const otras = categorias
    .filter((c) => c.id !== id && productos.some((p) => p.categoria === c.id))
    .map((c) => `<a href="/categoria/${c.id}">${escapar(c.nombre)}</a>`)
    .join("");

  const wa = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, vi la categoría ${cat.nombre} en la página y quiero consultar.`)}`;

  const cuerpo = `
<nav class="mig" aria-label="Ruta"><a href="/">Inicio</a> › ${escapar(cat.nombre)}</nav>
<h1>${escapar(t.h1)}</h1>
<p class="intro">${escapar(t.intro)}</p>
<ul class="rej">
${tarjetas}
</ul>
<p><a class="btn wa" href="${escapar(wa)}" rel="noopener">Consultar por WhatsApp</a>
<a class="btn bo" href="/#catalogo">Ver toda la tienda</a></p>
<p class="otras"><strong>Otras categorías:</strong> ${otras}</p>`;

  const datos = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: t.h1,
      url,
      description: descripcion,
      isPartOf: { "@type": "WebSite", name: "Compas Outlet", url: TIENDA + "/" },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: lista.length,
        itemListElement: lista.slice(0, 100).map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${TIENDA}/p/${p.id}`,
          name: p.nombre,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: TIENDA + "/" },
        { "@type": "ListItem", position: 2, name: cat.nombre, item: url },
      ],
    },
  ].map(jsonLd).join("\n");

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=86400");
  res.end(
    documento({
      titulo: `${t.titulo} | Compas Outlet`,
      descripcion,
      url,
      imagen: lista.find((p) => p.imagen)?.imagen,
      extra: datos,
      cuerpo,
    })
  );
}
