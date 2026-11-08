/* =========================================================================
   Piezas compartidas por las paginas que Google lee: sitemap.xml,
   /categoria/<id> y /p/<id>.

   Por que existen: la tienda se arma con JavaScript en el navegador, asi que
   para Google cada articulo y cada categoria eran invisibles (solo habia UNA
   direccion indexable: la portada). Estas paginas le dan a Google una
   direccion con contenido real por cada categoria y por cada articulo.

   Solo LEEN de Supabase con la clave publica, igual que cualquier visitante.
   El archivo empieza con "_" para que Vercel no lo publique como ruta.
   ========================================================================= */

export const SUPABASE_URL = process.env.SUPABASE_URL || "https://bthczvrkrnzzwlnqunlh.supabase.co";
export const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_jxwBsbIkHkoIgTjrlT1jjg_LZj8IkN1";

export const TIENDA = "https://compas-outlet.vercel.app";
export const IMAGEN_TIENDA = TIENDA + "/img/compartir.jpg";
export const WHATSAPP = "50670090544";
export const MONEDA = "₡";

/* Texto propio de cada categoria. Esta escrito con las frases que la gente
   realmente busca en Google en Costa Rica (outlet + muebles / colchones /
   ropa de cama / herramientas...). Una categoria que no este aqui igual
   funciona: usa su nombre de Supabase. */
export const TEXTOS = {
  muebles: {
    titulo: "Muebles de outlet en Heredia y todo Costa Rica",
    h1: "Muebles de outlet en Costa Rica",
    intro:
      "Sillones, butacas, otomanas, cajas fuertes y más muebles a precio de outlet. " +
      "Son lotes limitados: lo que ves publicado es lo que hay. Envío gratis en Heredia y alrededores.",
  },
  hogar: {
    titulo: "Artículos para el hogar a precio de outlet en Costa Rica",
    h1: "Artículos para el hogar a precio de outlet",
    intro:
      "Lámparas, cuadros, decoración y todo para renovar tu casa sin pagar precio de tienda. " +
      "Lotes limitados, con garantía de 30 días en todo artículo.",
  },
  cama: {
    titulo: "Ropa de cama y colchones outlet en Costa Rica",
    h1: "Ropa de cama y colchones outlet",
    intro:
      "Sábanas, edredones, protectores de colchón, almohadas y colchones inflables en tamaños Twin, Queen y King, " +
      "a precio de outlet. Pedí por WhatsApp y te los llevamos.",
  },
  jardin: {
    titulo: "Jardín, patio y exteriores a precio de outlet en Costa Rica",
    h1: "Jardín y exteriores a precio de outlet",
    intro:
      "Hieleras, sombrillas, cortadoras de césped y artículos para patio y deporte al aire libre, " +
      "a precio de outlet y con garantía de 30 días.",
  },
  electronicos: {
    titulo: "Electrónicos y accesorios outlet en Costa Rica",
    h1: "Electrónicos y accesorios a precio de outlet",
    intro:
      "Baterías externas, bases de carga, audífonos y más electrónicos a precio de outlet. " +
      "Confirmamos disponibilidad al momento por WhatsApp.",
  },
  juguetes: {
    titulo: "Juguetes a precio de outlet en Costa Rica",
    h1: "Juguetes a precio de outlet",
    intro:
      "Juguetes y juegos para chicos y grandes a precio de outlet. Lotes limitados: lo que ves es lo que hay.",
  },
  cocina: {
    titulo: "Artículos de cocina a precio de outlet en Costa Rica",
    h1: "Cocina a precio de outlet",
    intro: "Termos, utensilios y artículos de cocina a precio de outlet, con garantía de 30 días.",
  },
  herramientas: {
    titulo: "Herramientas outlet en Costa Rica",
    h1: "Herramientas a precio de outlet",
    intro: "Herramientas manuales y eléctricas a precio de outlet, con garantía de 30 días.",
  },
  otros: {
    titulo: "Más artículos a precio de outlet en Costa Rica",
    h1: "Más artículos a precio de outlet",
    intro: "De todo un poco a precio de outlet: lotes limitados, con garantía de 30 días en todo artículo.",
  },
};

export const escapar = (t) =>
  String(t ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );

export const precio = (n) =>
  MONEDA + Number(n).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/* Los datos estructurados van dentro de <script>: hay que impedir que un
   nombre de articulo con "</script>" cierre la etiqueta antes de tiempo. */
export const jsonLd = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

async function pedir(ruta) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    signal: AbortSignal.timeout(6000),
  });
  if (!r.ok) throw new Error("Supabase respondio " + r.status);
  return r.json();
}

/* Lanza si Supabase no contesta: asi nunca se publica un sitemap vacio que
   le diga a Google "ya no hay nada". */
export const traerCategorias = () => pedir("categorias?select=id,nombre,orden&order=orden.asc");

export const traerProductos = () =>
  pedir(
    "productos?select=id,nombre,categoria,precio,stock,imagen,descripcion&stock=gt.0&order=id.desc&limit=2000"
  );

export const traerProducto = async (id) =>
  (await pedir(`productos?select=id,nombre,categoria,precio,stock,imagen,descripcion&id=eq.${id}`))[0] || null;

/* Estilo minimo, en linea: estas paginas no cargan nada externo para abrir
   rapido en el celular. Mismos colores de la tienda. */
export const ESTILO = `
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#10213f;background:#f6f7fb;line-height:1.5}
a{color:#0f2a66}header.s{background:#0f2a66;color:#fff;padding:14px 18px}header.s a{color:#fff;text-decoration:none;font-weight:700;font-size:18px}
main.s{max-width:1100px;margin:0 auto;padding:22px 18px 48px}
nav.mig{font-size:14px;margin-bottom:14px;color:#51607f}nav.mig a{color:#51607f}
h1{font-size:28px;line-height:1.2;margin:0 0 10px}p.intro{margin:0 0 20px;color:#34456a;max-width:70ch}
.rej{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;list-style:none;margin:0;padding:0}
.rej a{display:block;background:#fff;border-radius:12px;overflow:hidden;text-decoration:none;color:inherit;border:1px solid #e3e7f1;height:100%}
.rej img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block;background:#e9edf6}
.rej .t{padding:10px 12px 12px}.rej .n{font-size:14px;margin:0 0 6px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.rej .p{font-weight:700;font-size:17px;color:#ce1126}
.btn{display:inline-block;padding:12px 20px;border-radius:10px;font-weight:700;text-decoration:none;margin:6px 8px 0 0}
.btn.wa{background:#1fa855;color:#fff}.btn.az{background:#0f2a66;color:#fff}.btn.bo{border:2px solid #0f2a66;color:#0f2a66}
.otras{margin-top:34px;font-size:15px}.otras a{margin-right:14px;display:inline-block}
footer.s{max-width:1100px;margin:0 auto;padding:0 18px 30px;font-size:13px;color:#51607f}
.ficha{display:grid;grid-template-columns:minmax(0,1fr);gap:22px}@media(min-width:760px){.ficha{grid-template-columns:1fr 1fr}}
.ficha img{width:100%;border-radius:14px;background:#e9edf6}.pr{font-size:30px;font-weight:800;color:#ce1126;margin:6px 0 14px}
`;

export function documento({ titulo, descripcion, url, imagen, cuerpo, extra = "", robots = "" }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(titulo)}</title>
<meta name="description" content="${escapar(descripcion)}">
${robots ? `<meta name="robots" content="${robots}">\n` : ""}<link rel="canonical" href="${escapar(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Compas Outlet">
<meta property="og:title" content="${escapar(titulo)}">
<meta property="og:description" content="${escapar(descripcion)}">
<meta property="og:url" content="${escapar(url)}">
<meta property="og:image" content="${escapar(imagen || IMAGEN_TIENDA)}">
<meta property="og:locale" content="es_CR">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0f2a66">
<link rel="icon" href="/img/icono.ico">
<style>${ESTILO}</style>
${extra}
</head>
<body>
<header class="s"><a href="/">Compas Outlet</a></header>
<main class="s">
${cuerpo}
</main>
<footer class="s">Compas Outlet · Heredia, Costa Rica · Precios en colones con IVA incluido · Garantía de 30 días ·
<a href="/terminos.html">Términos</a> · <a href="/privacidad.html">Privacidad</a> · <a href="/devoluciones.html">Cambios y devoluciones</a></footer>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>`;
}
