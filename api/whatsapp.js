/* =========================================================================
   APROBAR POR WHATSAPP

   Esta es la oreja del sistema: aca llega lo que vos le escribis o tocas al
   WhatsApp del negocio (+506 7043 1317), y de aca sale la respuesta.

   Como se usa, desde el telefono:
     escribis  posts       -> te llegan los borradores pendientes con botones
     escribis  mensajes    -> lo mismo con los mensajes a compas
     tocas     Aprobar     -> queda aprobado y el agente lo toma en la hora
     tocas     No va       -> queda descartado y no vuelve a salir

   Solo atiende al numero de WHATSAPP_APROBADOR. A cualquier otro no le
   contesta nada: el bot de ventas sigue apagado y esto no lo enciende.

   Variables de entorno necesarias (en Vercel):
     WHATSAPP_TOKEN            token del numero del negocio
     WHATSAPP_PHONE_NUMBER_ID  identificador de ese numero
     WHATSAPP_VERIFY_TOKEN     la palabra que Meta pide al conectar el webhook
     WHATSAPP_APP_SECRET       para comprobar que el aviso viene de Meta
     WHATSAPP_APROBADOR        tu numero, con el 506 adelante
     GOOGLE_SHEET_ID / GOOGLE_CREDENTIALS_JSON   el archivero (ver _hoja.js)
   ========================================================================= */

import crypto from "node:crypto";
import {
  PESTANAS,
  celdaTexto,
  estaPendiente,
  leerFila,
  leerPestana,
  marcarDecision,
  vigencia,
} from "./_hoja.js";
import { aprobador, enviarImagen, enviarParaAprobar, enviarTexto, leerIdBoton, marcarLeido, recortar } from "./_whatsapp.js";
import { decidir, pendientes } from "./_borradores.js";

// Vercel no debe tocar el cuerpo: la firma de Meta se calcula sobre el texto
// crudo, y si se vuelve a armar desde el JSON ya no coincide.
export const config = { api: { bodyParser: false } };

// Cuantos borradores se mandan de una. Mas que esto y el chat se vuelve
// ilegible, y Meta puede cortar la respuesta por tardarse.
const MAXIMO_POR_TANDA = 5;

// Cada articulo manda su foto de portada con botones y las demas fotos sueltas,
// asi que son varios mensajes por articulo: tandas mas chicas.
const MAXIMO_ARTICULOS_POR_TANDA = 3;

const AYUDA =
  "Esto es lo que entiendo:\n\n" +
  "• *posts* — los borradores de hoy, con botones\n" +
  "• *mensajes* — los mensajes a compas por aprobar\n" +
  "• *articulos* — los articulos nuevos con fotos por aprobar\n\n" +
  "Después solo tocás Aprobar o No va.";

/* ------------------------------------------------------------------ Entrada */

async function cuerpoCrudo(peticion) {
  const trozos = [];
  for await (const trozo of peticion) trozos.push(trozo);
  return Buffer.concat(trozos);
}

/** Comprueba que el aviso lo mando Meta y no cualquiera. */
function firmaValida(crudo, cabecera) {
  const secreto = process.env.WHATSAPP_APP_SECRET;
  if (!secreto) return false;
  const recibida = String(cabecera || "");
  if (!recibida.startsWith("sha256=")) return false;
  const esperada = "sha256=" + crypto.createHmac("sha256", secreto).update(crudo).digest("hex");
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* ------------------------------------------------- Armar lo que se te manda */

function textoDePost(valores, estado) {
  const producto = celdaTexto(valores, 3);
  const precio = celdaTexto(valores, 4);
  const formato = celdaTexto(valores, 5);
  const feed = celdaTexto(valores, 7);
  return (
    (formato ? "*" + formato + "*\n" : "") +
    producto + (precio ? " — " + precio : "") + "\n" +
    (estado.aviso ? "_" + estado.aviso + "_\n" : "") +
    "\n" + feed
  );
}

function textoDeSeguimiento(valores, estado) {
  const nombre = celdaTexto(valores, 4);
  const producto = celdaTexto(valores, 5);
  const mensaje = celdaTexto(valores, 6);
  return (
    "*Mensaje para " + (nombre || "un compa") + "*\n" +
    (producto ? producto + "\n" : "") +
    (estado.aviso ? "_" + estado.aviso + "_\n" : "") +
    "\n" + mensaje
  );
}

async function mandarPendientes(para, tipo) {
  const conf = PESTANAS[tipo];
  const ahora = new Date();
  const filas = (await leerPestana(conf.pestana)).filter(({ valores }) => estaPendiente(valores, conf));

  if (!filas.length) {
    await enviarTexto(para, tipo === "post" ? "No hay posts esperando. Todo al día." : "No hay mensajes esperando.");
    return 0;
  }

  // Los que todavia sirven van primero: son los que de verdad conviene decidir.
  const conEstado = filas.map((f) => ({ ...f, estado: vigencia(f.valores, ahora) }));
  conEstado.sort((a, b) => Number(a.estado.vencido) - Number(b.estado.vencido) || a.fila - b.fila);

  const vencidos = conEstado.filter((f) => f.estado.vencido).length;
  const tanda = conEstado.slice(0, MAXIMO_POR_TANDA);

  const cabecera =
    "Tenés *" + filas.length + "* " + (tipo === "post" ? "post(s)" : "mensaje(s)") + " esperando" +
    (vencidos ? " (" + vencidos + " ya vencidos)" : "") + "." +
    (filas.length > tanda.length ? "\nTe mando " + tanda.length + ". Escribí *" + (tipo === "post" ? "posts" : "mensajes") + "* otra vez para seguir." : "");
  await enviarTexto(para, cabecera);

  for (const { fila, valores, estado } of tanda) {
    await enviarParaAprobar(para, {
      titulo: celdaTexto(valores, 3),
      cuerpo: tipo === "post" ? textoDePost(valores, estado) : textoDeSeguimiento(valores, estado),
      pie: estado.vencido ? "Ya venció" : estado.aviso,
      foto: tipo === "post" ? celdaTexto(valores, 12) : "",
      tipo,
      fila,
      vencido: estado.vencido,
    });
  }
  return tanda.length;
}

/* ------------------------------------------------------- Articulos nuevos */

function nombreDeArea(id) {
  const limpio = String(id || "otros");
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

async function mandarArticulos(para) {
  const { filas, total } = await pendientes(MAXIMO_ARTICULOS_POR_TANDA);

  if (!filas.length) {
    await enviarTexto(para, "No hay articulos nuevos esperando. Todo al día.");
    return 0;
  }

  await enviarTexto(
    para,
    "Tenés *" + total + "* articulo(s) nuevo(s) esperando." +
      (total > filas.length ? "\nTe mando " + filas.length + ". Escribí *articulos* otra vez para seguir." : ""),
  );

  for (const borrador of filas) {
    const medios = (Array.isArray(borrador.medios) ? borrador.medios : []).filter((m) => m && m.url);
    // Las fotos 2, 3, 4... van sueltas primero; la tarjeta con botones va al
    // final para que Aprobar / No va quede justo debajo de lo ultimo que viste.
    for (const medio of medios.slice(1)) {
      await enviarImagen(para, medio.url);
    }
    await enviarParaAprobar(para, {
      titulo: borrador.nombre,
      cuerpo:
        "*" + borrador.nombre + "*\n" +
        "Área: " + nombreDeArea(borrador.categoria) + " · " + (borrador.cantidad || 1) + " pz · " +
        medios.length + " foto(s)\n" +
        "Sin precio (sale como «Consultar precio»)\n\n" +
        (borrador.descripcion || ""),
      pie: "Aprobar lo publica en la tienda",
      foto: medios[0]?.url || "",
      tipo: "articulo",
      fila: borrador.id,
      vencido: false,
    });
  }
  return filas.length;
}

async function atenderBotonArticulo(para, orden) {
  const resultado = await decidir(orden.fila, orden.decision);
  const nombre = recortar(resultado.nombre || "el articulo", 60);

  if (resultado.yaDecidido) {
    await enviarTexto(para, "Ese articulo ya estaba " + (resultado.estado || "decidido") + ": " + nombre + ". No hice cambios.");
    return;
  }
  if (orden.decision === "si") {
    await enviarTexto(para, "✅ Publicado en la tienda: " + nombre + "\n\nYa lo ven los compas y el asistente. Sin precio: sale como «Consultar precio».");
  } else {
    await enviarTexto(para, "Descartado: " + nombre + ". No vuelve a salir.");
  }
}

/* -------------------------------------------------------- Lo que vos tocaste */

async function atenderBoton(para, id) {
  const orden = leerIdBoton(id);
  if (!orden) return;

  if (orden.tipo === "articulo") return atenderBotonArticulo(para, orden);

  const conf = PESTANAS[orden.tipo];
  const valores = await leerFila(conf.pestana, orden.fila);
  if (!valores) {
    await enviarTexto(para, "No encontré ese borrador en la hoja. Escribí *posts* para ver los que quedan.");
    return;
  }

  await marcarDecision(orden.tipo, orden.fila, orden.decision);

  const nombre = celdaTexto(valores, orden.tipo === "post" ? 3 : 4) || "el borrador";
  if (orden.decision === "si") {
    await enviarTexto(
      para,
      "✅ Aprobado: " + recortar(nombre, 60) + "\n\n" +
        (orden.tipo === "post"
          ? "Como Instagram y Facebook todavía no están conectados, va a quedar marcado *LISTO PARA COPIAR* y lo pegás vos. En cuanto conectemos Meta, sale solo."
          : "Sale solo en la próxima vuelta, entre 9 a. m. y 7 p. m."),
    );
  } else {
    await enviarTexto(para, "Descartado: " + recortar(nombre, 60) + ". No vuelve a salir.");
  }
}

async function atenderTexto(para, texto) {
  const limpio = String(texto || "").trim().toLowerCase();

  if (/^(posts?|publicaciones?)$/.test(limpio)) return mandarPendientes(para, "post");
  if (/^(mensajes?|seguimientos?|compas)$/.test(limpio)) return mandarPendientes(para, "seguimiento");
  if (/^(art[ií]culos?|productos?)$/.test(limpio)) return mandarArticulos(para);
  if (/^(hola|buenas|menu|men[uú]|ayuda|\?)$/.test(limpio)) return enviarTexto(para, AYUDA);

  await enviarTexto(para, "No entendí.\n\n" + AYUDA);
}

/* ------------------------------------------------------------------ Peticion */

export default async function handler(peticion, respuesta) {
  // Meta comprueba la direccion una vez, al conectarla.
  if (peticion.method === "GET") {
    const q = peticion.query || {};
    if (q["hub.mode"] === "subscribe" && q["hub.verify_token"] === process.env.WHATSAPP_VERIFY_TOKEN) {
      respuesta.setHeader("Content-Type", "text/plain");
      return respuesta.status(200).send(String(q["hub.challenge"] ?? ""));
    }
    return respuesta.status(403).send("no");
  }

  if (peticion.method !== "POST") {
    respuesta.setHeader("Allow", "GET, POST");
    return respuesta.status(405).json({ error: "Metodo no permitido." });
  }

  const crudo = await cuerpoCrudo(peticion);
  if (!firmaValida(crudo, peticion.headers["x-hub-signature-256"])) {
    console.warn("[whatsapp] firma invalida");
    return respuesta.status(401).send("no");
  }

  let aviso;
  try {
    aviso = JSON.parse(crudo.toString("utf8"));
  } catch {
    return respuesta.status(200).send("ok");
  }

  try {
    const mio = aprobador();
    for (const entrada of aviso.entry || []) {
      for (const cambio of entrada.changes || []) {
        for (const mensaje of cambio.value?.messages || []) {
          // Solo se le contesta al numero que aprueba. A nadie mas.
          if (!mio || String(mensaje.from).replace(/\D/g, "") !== mio) continue;

          await marcarLeido(mensaje.id);

          if (mensaje.type === "interactive" && mensaje.interactive?.type === "button_reply") {
            await atenderBoton(mensaje.from, mensaje.interactive.button_reply.id);
          } else if (mensaje.type === "text") {
            await atenderTexto(mensaje.from, mensaje.text?.body);
          } else {
            await enviarTexto(mensaje.from, AYUDA);
          }
        }
      }
    }
  } catch (error) {
    // Si algo falla igual se contesta 200: si no, Meta reenvia el mismo aviso
    // una y otra vez y terminarias con el mensaje repetido en el telefono.
    console.error("[whatsapp]", error);
  }

  return respuesta.status(200).send("ok");
}
