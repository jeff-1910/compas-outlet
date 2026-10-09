/* =========================================================================
   MANDAR WHATSAPP (API oficial de Meta - Cloud API)

   Lo usa el webhook para contestarte y para mandarte los borradores con
   botones de Aprobar y No va.

   Un mensaje con botones de verdad (los que se tocan) solo se puede mandar
   dentro de las 24 horas siguientes a que vos le escribas al numero del
   negocio. Pasadas esas 24 horas Meta solo deja mandar plantillas aprobadas,
   y una plantilla no lleva la foto del articulo ni el texto largo. Por eso
   el camino normal es: vos escribis "posts" y el sistema te contesta.

   Variables de entorno necesarias:
     WHATSAPP_TOKEN            token del numero de WhatsApp del negocio
     WHATSAPP_PHONE_NUMBER_ID  identificador de ese numero
     WHATSAPP_APROBADOR        a que numero se le mandan los borradores
   ========================================================================= */

const VERSION = process.env.WHATSAPP_API_VERSION || "v26.0";

const LIMITE_CUERPO = 1024; // el cuerpo de un mensaje con botones es mas corto
const LIMITE_TEXTO = 4000; // WhatsApp corta en 4096

function soloDigitos(valor) {
  return String(valor ?? "").replace(/\D/g, "");
}

export function aprobador() {
  return soloDigitos(process.env.WHATSAPP_APROBADOR);
}

function configurado() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

async function graph(cuerpo) {
  if (!configurado()) {
    console.log("[whatsapp] sin configurar, no se manda nada");
    return null;
  }
  const respuesta = await fetch(
    "https://graph.facebook.com/" + VERSION + "/" + process.env.WHATSAPP_PHONE_NUMBER_ID + "/messages",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.WHATSAPP_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cuerpo),
    },
  );
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new Error(datos?.error?.message || "WhatsApp respondio " + respuesta.status);
  }
  return datos;
}

/** Recorta sin cortar una palabra por la mitad. */
export function recortar(texto, largo) {
  const limpio = String(texto ?? "").trim();
  if (limpio.length <= largo) return limpio;
  const corte = limpio.lastIndexOf(" ", largo - 1);
  return limpio.slice(0, corte > largo * 0.6 ? corte : largo - 1).trimEnd() + "…";
}

export async function enviarTexto(para, texto) {
  const destino = soloDigitos(para);
  if (!destino) return null;
  let resto = String(texto ?? "");
  let ultimo = null;
  while (resto.length) {
    const parte = resto.slice(0, LIMITE_TEXTO);
    resto = resto.slice(parte.length);
    ultimo = await graph({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: destino,
      type: "text",
      text: { preview_url: false, body: parte },
    });
  }
  return ultimo;
}

/**
 * El identificador del boton viaja de ida y vuelta: es lo unico que dice que
 * fila de la hoja hay que marcar cuando lo toques. Meta lo limita a 256
 * caracteres, asi que va corto.
 */
export function idBoton(decision, tipo, fila) {
  return ["d", decision, tipo, fila].join("|");
}

export function leerIdBoton(id) {
  const partes = String(id ?? "").split("|");
  if (partes[0] !== "d" || partes.length !== 4) return null;
  const [, decision, tipo, fila] = partes;
  if (decision !== "si" && decision !== "no") return null;
  if (tipo !== "post" && tipo !== "seguimiento" && tipo !== "articulo") return null;
  const numero = Number(fila);
  // En la hoja la fila 1 es el encabezado; un articulo es un id y empieza en 1.
  const minimo = tipo === "articulo" ? 1 : 2;
  if (!Number.isInteger(numero) || numero < minimo) return null;
  return { decision, tipo, fila: numero };
}

/**
 * Manda un borrador con la foto del articulo arriba y dos botones abajo.
 * Si el articulo no tiene foto, va sin foto: el borrador igual se aprueba.
 */
export async function enviarParaAprobar(para, { titulo, cuerpo, pie, foto, tipo, fila, vencido }) {
  const destino = soloDigitos(para);
  if (!destino) return null;

  const botones = vencido
    ? [{ type: "reply", reply: { id: idBoton("no", tipo, fila), title: "Descartar" } }]
    : [
        { type: "reply", reply: { id: idBoton("si", tipo, fila), title: "Aprobar" } },
        { type: "reply", reply: { id: idBoton("no", tipo, fila), title: "No va" } },
      ];

  const interactivo = {
    type: "button",
    body: { text: recortar(cuerpo, LIMITE_CUERPO) || "(sin texto)" },
    action: { buttons: botones },
  };

  // La foto va de encabezado. Si no hay, se usa el titulo como encabezado.
  if (foto && /^https?:\/\//i.test(foto)) {
    interactivo.header = { type: "image", image: { link: foto } };
  } else if (titulo) {
    interactivo.header = { type: "text", text: recortar(titulo, 60) };
  }
  if (pie) interactivo.footer = { text: recortar(pie, 60) };

  return graph({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: destino,
    type: "interactive",
    interactive: interactivo,
  });
}

/** Manda una foto suelta (sin botones). Sirve para las fotos 2, 3, 4... de un articulo. */
export async function enviarImagen(para, url) {
  const destino = soloDigitos(para);
  if (!destino || !/^https?:\/\//i.test(String(url || ""))) return null;
  return graph({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: destino,
    type: "image",
    image: { link: url },
  });
}

export async function marcarLeido(idMensaje) {
  if (!idMensaje || !configurado()) return;
  try {
    await graph({ messaging_product: "whatsapp", status: "read", message_id: idMensaje });
  } catch (error) {
    console.warn("[whatsapp] no pude marcar como leido:", error.message);
  }
}
