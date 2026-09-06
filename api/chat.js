/* =========================================================================
   Asistente de ventas de Compas Outlet.

   Corre en el servidor de Vercel, no en el navegador. La clave de la API
   vive aqui como variable de entorno y nunca llega al visitante.

   Variables de entorno necesarias (se configuran en Vercel):
     ANTHROPIC_API_KEY   obligatoria
     SUPABASE_URL        opcional, si no se toma la del propio sitio
     SUPABASE_ANON_KEY   opcional, idem
   ========================================================================= */

import Anthropic from "@anthropic-ai/sdk";

const MODELO = "claude-opus-5";

// Limites para que una conversacion no se dispare de precio.
const MAX_MENSAJES = 24;        // turnos que aceptamos del navegador
const MAX_LARGO_MENSAJE = 1500; // caracteres por mensaje
const MAX_TOKENS = 8000;        // techo de la respuesta (incluye razonamiento)

const SUPABASE_URL = process.env.SUPABASE_URL || "https://bthczvrkrnzzwlnqunlh.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_jxwBsbIkHkoIgTjrlT1jjg_LZj8IkN1";

const WHATSAPP = "50670090544";
const MONEDA = "₡";

/* ------------------------------------------------------------- Catalogo */

// El catalogo cambia poco entre visitas, asi que lo guardamos un rato en
// memoria de la funcion. Cada instancia lo pide como mucho cada 5 minutos.
let cacheCatalogo = { datos: null, hasta: 0 };

async function traerCatalogo() {
  if (cacheCatalogo.datos && Date.now() < cacheCatalogo.hasta) {
    return cacheCatalogo.datos;
  }

  const cabeceras = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

  const [rc, rp] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/categorias?select=id,nombre&order=orden`, { headers: cabeceras }),
    fetch(
      `${SUPABASE_URL}/rest/v1/productos?select=id,nombre,categoria,precio,precio_antes,descripcion,stock,destacado&order=id`,
      { headers: cabeceras }
    ),
  ]);

  if (!rc.ok || !rp.ok) throw new Error("No se pudo leer el catalogo");

  const datos = { categorias: await rc.json(), productos: await rp.json() };
  cacheCatalogo = { datos, hasta: Date.now() + 5 * 60 * 1000 };
  return datos;
}

const precio = (n) =>
  MONEDA + Number(n).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// Texto compacto del catalogo: una linea por articulo.
function catalogoEnTexto({ categorias, productos }) {
  const nombreCat = (id) => (categorias.find((c) => c.id === id) || {}).nombre || "Varios";

  if (!productos.length) return "El catalogo esta vacio en este momento.";

  return productos
    .map((p) => {
      const partes = [`#${p.id}`, p.nombre, `[${nombreCat(p.categoria)}]`];
      partes.push(Number(p.precio) ? precio(p.precio) : "precio a consultar");
      if (Number(p.precio_antes) > Number(p.precio)) {
        partes.push(`(antes ${precio(p.precio_antes)})`);
      }
      partes.push(p.stock > 0 ? `${p.stock} disponibles` : "AGOTADO");
      if (p.destacado) partes.push("destacado");
      if (p.descripcion) partes.push(`- ${p.descripcion}`);
      return partes.join(" | ");
    })
    .join("\n");
}

/* --------------------------------------------------------- Instrucciones */

function instrucciones(catalogo) {
  return `Sos el asistente de ventas de Compas Outlet, una tienda de articulos
varios en Costa Rica: muebles, hogar, cocina, electronicos, ropa y calzado, a
precio de outlet.

COMO HABLAS
- En espanol de Costa Rica, con "usted" o "vos" segun como te hablen.
- Calido y directo, como un dependiente que conoce la tienda. Nada de robot.
- Respuestas cortas: dos o tres frases, o una lista breve. Es un chat, no un correo.
- A los clientes les decimos "Compas". Es el sello de la tienda, usalo con naturalidad.

QUE PODES HACER
- Recomendar articulos del catalogo de abajo segun lo que busquen y su presupuesto.
- Decir precios y disponibilidad exactos.
- Explicar como funcionan los apartados y que hay varios metodos de pago.
- Cuando alguien quiera comprar, apartar o pedir algo que no esta, pasalo a
  WhatsApp: https://wa.me/${WHATSAPP}

REGLAS QUE NO SE ROMPEN
- Solo hablas de articulos que estan en el catalogo de abajo. Si no esta, decilo
  y ofrece preguntarlo por WhatsApp; conseguimos cosas por encargo.
- NUNCA te inventes precios, medidas, colores, materiales ni plazos de entrega.
  Si el dato no esta en el catalogo, decis que lo consulten por WhatsApp.
- Si un articulo dice "precio a consultar", no estimes un precio: mandalo a WhatsApp.
- Si esta AGOTADO, decilo claro y ofrece avisar cuando vuelva.
- No prometas descuentos, envios gratis ni fechas. Eso lo define el duenio.
- No pidas datos personales, ni tarjetas, ni direcciones. Los pedidos se cierran
  por WhatsApp.
- Si te preguntan algo que no tiene que ver con la tienda, redirigi con amabilidad.

CATALOGO ACTUAL (es lo unico que existe; cada linea es un articulo)
${catalogo}`;
}

/* ------------------------------------------------------------- Endpoint */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Usa POST" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: "El asistente todavia no esta configurado.",
      detalle: "Falta la variable ANTHROPIC_API_KEY en Vercel.",
    });
  }

  try {
    const cuerpo = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    let mensajes = Array.isArray(cuerpo.mensajes) ? cuerpo.mensajes : [];

    if (!mensajes.length) {
      return res.status(400).json({ error: "No llego ningun mensaje." });
    }

    // Nos quedamos con los ultimos turnos y recortamos lo demasiado largo.
    mensajes = mensajes.slice(-MAX_MENSAJES).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, MAX_LARGO_MENSAJE),
    }));

    if (mensajes[0].role !== "user") mensajes = mensajes.slice(1);
    if (!mensajes.length) {
      return res.status(400).json({ error: "No llego ningun mensaje valido." });
    }

    const catalogo = catalogoEnTexto(await traerCatalogo());
    const cliente = new Anthropic();

    const respuesta = await cliente.messages.create({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      // Effort bajo: es una conversacion de tienda, no hace falta que se
      // detenga a razonar mucho. Sale mas rapido y mas barato.
      output_config: { effort: "low" },
      system: [
        {
          type: "text",
          text: instrucciones(catalogo),
          // El catalogo se repite en cada mensaje de la charla: cachearlo
          // baja mucho el costo a partir del segundo mensaje.
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: mensajes,
    });

    if (respuesta.stop_reason === "refusal") {
      return res.status(200).json({
        respuesta: "Mejor eso lo vemos por WhatsApp: https://wa.me/" + WHATSAPP,
      });
    }

    const texto = respuesta.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    return res.status(200).json({
      respuesta: texto || "Perdon, no me salio la respuesta. ¿Me lo repetis?",
    });
  } catch (e) {
    // Errores tipados del SDK, de mas especifico a mas general.
    if (e instanceof Anthropic.AuthenticationError) {
      console.error("Clave de API invalida", e.message);
      return res.status(503).json({ error: "El asistente no esta disponible ahora." });
    }
    if (e instanceof Anthropic.RateLimitError) {
      return res.status(429).json({
        error: "Hay mucha gente escribiendo. Proba en un momento, o escribinos por WhatsApp.",
      });
    }
    if (e instanceof Anthropic.APIError) {
      console.error("Error de la API", e.status, e.message);
      return res.status(502).json({ error: "El asistente tuvo un problema. Proba de nuevo." });
    }
    console.error("Error inesperado", e);
    return res.status(500).json({ error: "Algo salio mal. Proba de nuevo." });
  }
}
