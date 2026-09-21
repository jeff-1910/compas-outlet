/* =========================================================================
   Enlace para compartir un articulo: /p/<id>

   WhatsApp, Facebook e Instagram no ejecutan JavaScript: para la vista previa
   leen las etiquetas og: del HTML que devuelve el servidor. La ficha de la
   tienda se arma con JavaScript, asi que un enlace a /#p=5 sale con la
   tarjeta general de la tienda. Esta funcion devuelve una pagina minima con
   la foto, el nombre y el precio del articulo, y a la persona que hace clic
   la manda enseguida a la ficha dentro de la tienda.

   Solo lee: la misma clave publica y los mismos datos que ve cualquier
   visitante de la tienda.
   ========================================================================= */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://bthczvrkrnzzwlnqunlh.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_jxwBsbIkHkoIgTjrlT1jjg_LZj8IkN1";

const TIENDA = "https://compas-outlet.vercel.app";
const IMAGEN_TIENDA = TIENDA + "/img/compartir.jpg";
const TITULO_TIENDA = "Compas Outlet | No son clientes, son nuestros Compas";
const MONEDA = "₡";

const escapar = (t) =>
  String(t ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );

const precio = (n) =>
  MONEDA + Number(n).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// null = no existe. Lanza si Supabase no contesta, para no confundir una
// caida con un articulo borrado.
async function traerProducto(id) {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/productos?select=id,nombre,precio,descripcion,stock,imagen&id=eq.${id}`,
    {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      signal: AbortSignal.timeout(5000),
    }
  );
  if (!r.ok) throw new Error("Supabase respondio " + r.status);
  const filas = await r.json();
  return filas[0] || null;
}

// La linea que aparece debajo del titulo en la vista previa.
function resumen(p) {
  const partes = [Number(p.precio) > 0 ? precio(p.precio) : "Consulta el precio por WhatsApp"];
  if (Number(p.stock) <= 0) partes.push("Agotado");
  else if (Number(p.stock) === 1) partes.push("Queda 1");
  let texto = partes.join(" · ");
  if (p.descripcion) texto += ". " + p.descripcion;
  return texto.length > 200 ? texto.slice(0, 197) + "…" : texto;
}

function pagina({ titulo, descripcion, imagen, url, destino }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(titulo)}</title>
<meta name="description" content="${escapar(descripcion)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Compas Outlet">
<meta property="og:title" content="${escapar(titulo)}">
<meta property="og:description" content="${escapar(descripcion)}">
<meta property="og:url" content="${escapar(url)}">
<meta property="og:image" content="${escapar(imagen)}">
<meta property="og:locale" content="es_CR">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${escapar(url)}">
<script>location.replace(${JSON.stringify(destino)});</script>
</head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#071a45;font-family:system-ui,sans-serif">
<a href="${escapar(destino)}" style="color:#fff;font-size:17px">Ver en Compas Outlet</a>
</body>
</html>`;
}

export default async function handler(req, res) {
  const id = String(req.query.id || "");
  if (!/^[0-9]{1,12}$/.test(id)) {
    res.statusCode = 302;
    res.setHeader("Location", "/");
    return res.end();
  }

  let p = null;
  let fallo = false;
  try {
    p = await traerProducto(id);
  } catch {
    fallo = true;
  }

  let html;
  let estado = 200;
  let cache = "public, s-maxage=300, stale-while-revalidate=86400";

  if (p) {
    html = pagina({
      titulo: `${p.nombre} · Compas Outlet`,
      descripcion: resumen(p),
      imagen: p.imagen || IMAGEN_TIENDA,
      url: `${TIENDA}/p/${id}`,
      destino: `/#p=${id}`,
    });
  } else if (fallo) {
    // Supabase no contesto: tarjeta general, pero la persona igual llega a la
    // ficha. Poco cache, para que la vista previa buena aparezca pronto.
    html = pagina({
      titulo: TITULO_TIENDA,
      descripcion: "Muebles, hogar, cocina, electrónicos, ropa y calzado a precio de outlet en Costa Rica.",
      imagen: IMAGEN_TIENDA,
      url: `${TIENDA}/p/${id}`,
      destino: `/#p=${id}`,
    });
    cache = "public, s-maxage=30";
  } else {
    html = pagina({
      titulo: TITULO_TIENDA,
      descripcion: "Ese artículo ya no está disponible, pero hay más en la tienda.",
      imagen: IMAGEN_TIENDA,
      url: TIENDA + "/",
      destino: "/",
    });
    estado = 404;
  }

  res.statusCode = estado;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  // Las redes piden la vista previa una vez y la guardan. Con 5 minutos, un
  // cambio de precio o de foto se ve pronto sin castigar a Supabase.
  res.setHeader("Cache-Control", cache);
  res.end(html);
}
