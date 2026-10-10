/* =========================================================================
   APROBAR DESDE LA PAGINA

   Es lo que mira y escribe aprobar.html, la pagina que se guarda en la
   pantalla del telefono. Hace lo mismo que las aprobaciones por WhatsApp
   (ver whatsapp.js), pero sirve para revisar con calma y para cuando no
   haya WhatsApp a mano.

   Corre en el servidor de Vercel, nunca en el navegador: la llave de Google
   y la clave de acceso viven aqui como variables de entorno.

   Variables de entorno necesarias (en Vercel):
     APROBAR_CLAVE            clave larga que lleva el enlace de la pagina
     GOOGLE_SHEET_ID          la hoja de leads
     GOOGLE_CREDENTIALS_JSON  credencial de la cuenta de servicio, en una linea

   Lo unico que puede escribir es la casilla de aprobacion (ver _hoja.js).
   ========================================================================= */

import crypto from "node:crypto";
import {
  DIAS_VALIDO,
  PESTANAS,
  celdaTexto,
  estaPendiente,
  leerPestana,
  marcarDecision,
  vigencia,
} from "./_hoja.js";
import { decidir, pendientes } from "./_borradores.js";

/** Compara sin delatar por tiempo cuantos caracteres coinciden. */
function claveValida(recibida) {
  const esperada = process.env.APROBAR_CLAVE || "";
  if (!esperada || esperada.length < 16) return false;
  const a = Buffer.from(String(recibida ?? ""));
  const b = Buffer.from(esperada);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function armarPosts(ahora) {
  const conf = PESTANAS.post;
  const filas = await leerPestana(conf.pestana);
  return filas
    .filter(({ valores }) => estaPendiente(valores, conf))
    .map(({ fila, valores }) => ({
      fila,
      fecha: celdaTexto(valores, 0),
      id: celdaTexto(valores, 1),
      producto: celdaTexto(valores, 3),
      precio: celdaTexto(valores, 4),
      formato: celdaTexto(valores, 5),
      gancho: celdaTexto(valores, 6),
      feed: celdaTexto(valores, 7),
      historia: celdaTexto(valores, 8),
      grupo: celdaTexto(valores, 9),
      tiktok: celdaTexto(valores, 10),
      otrosGanchos: celdaTexto(valores, 11),
      foto: celdaTexto(valores, 12),
      ...vigencia(valores, ahora),
    }));
}

/** Articulos nuevos esperando: fotos, nombre, area y cantidad. Si Supabase falla, la pagina sigue con lo demas. */
async function armarArticulos() {
  try {
    const { filas } = await pendientes(50);
    return filas.map((b) => ({
      id: b.id,
      nombre: b.nombre,
      descripcion: b.descripcion || "",
      categoria: b.categoria || "otros",
      cantidad: b.cantidad || 1,
      precio: Number(b.precio) || 0,
      marca: b.marca || "",
      fotos: (Array.isArray(b.medios) ? b.medios : []).map((m) => m && m.url).filter(Boolean),
    }));
  } catch (error) {
    console.error("[aprobar] articulos:", error);
    return [];
  }
}

async function armarSeguimientos(ahora) {
  const conf = PESTANAS.seguimiento;
  const filas = await leerPestana(conf.pestana);
  return filas
    .filter(({ valores }) => estaPendiente(valores, conf))
    .map(({ fila, valores }) => {
      const telefono = celdaTexto(valores, 3).replace(/\D/g, "");
      return {
        fila,
        fecha: celdaTexto(valores, 0),
        id: celdaTexto(valores, 1),
        tipo: celdaTexto(valores, 2),
        telefono,
        enlace: telefono ? "https://wa.me/" + telefono : "",
        nombre: celdaTexto(valores, 4),
        producto: celdaTexto(valores, 5),
        mensaje: celdaTexto(valores, 6),
        ...vigencia(valores, ahora),
      };
    });
}

export default async function handler(peticion, respuesta) {
  // Un enlace con clave no deberia quedar guardado en ningun cache.
  respuesta.setHeader("Cache-Control", "no-store, max-age=0");
  respuesta.setHeader("X-Robots-Tag", "noindex, nofollow");

  try {
    if (peticion.method === "GET") {
      if (!claveValida(peticion.query?.clave)) {
        return respuesta.status(401).json({ error: "Clave incorrecta." });
      }
      const ahora = new Date();
      const [posts, seguimientos, articulos] = await Promise.all([armarPosts(ahora), armarSeguimientos(ahora), armarArticulos()]);
      return respuesta.status(200).json({ posts, seguimientos, articulos, diasValido: DIAS_VALIDO });
    }

    if (peticion.method === "POST") {
      const cuerpo =
        typeof peticion.body === "string" ? JSON.parse(peticion.body || "{}") : peticion.body || {};
      if (!claveValida(cuerpo.clave)) {
        return respuesta.status(401).json({ error: "Clave incorrecta." });
      }
      if (cuerpo.tipo === "articulo") {
        const id = Number(cuerpo.fila);
        if (!Number.isInteger(id) || id < 1) throw new Error("Fila invalida");
        if (cuerpo.decision !== "si" && cuerpo.decision !== "no") throw new Error("Decision invalida");
        const resultado = await decidir(id, cuerpo.decision);
        return respuesta.status(200).json({ ok: true, decision: cuerpo.decision, yaDecidido: Boolean(resultado.yaDecidido) });
      }
      const celda = await marcarDecision(cuerpo.tipo, Number(cuerpo.fila), cuerpo.decision);
      return respuesta.status(200).json({ ok: true, celda, decision: cuerpo.decision });
    }

    respuesta.setHeader("Allow", "GET, POST");
    return respuesta.status(405).json({ error: "Metodo no permitido." });
  } catch (error) {
    const esDeEntrada = /Tipo desconocido|Fila invalida|Decision invalida/.test(error.message);
    if (esDeEntrada) return respuesta.status(400).json({ error: error.message });
    // El detalle va al registro de Vercel, no al telefono.
    console.error("[aprobar]", error);
    return respuesta.status(500).json({ error: "No se pudo hablar con la hoja. Intentá de nuevo." });
  }
}
