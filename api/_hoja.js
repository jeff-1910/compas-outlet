/* =========================================================================
   LA HOJA DE GOOGLE, DESDE VERCEL

   La hoja de leads es el archivero de todo el sistema: los agentes escriben
   ahi los borradores y de ahi los lee el publicador. Este modulo es lo que
   usan las funciones de Vercel para leerla y para marcar una aprobacion.

   Se habla con Google firmando un JWT a mano, en vez de cargar la libreria
   googleapis entera: la funcion arranca mucho mas rapido.

   El nombre empieza con guion bajo a proposito: Vercel no lo publica como
   una direccion de internet, solo lo pueden usar las otras funciones.

   Variables de entorno necesarias:
     GOOGLE_SHEET_ID          la hoja "leads compas outlet"
     GOOGLE_CREDENTIALS_JSON  credencial de la cuenta de servicio, en una linea
   ========================================================================= */

import crypto from "node:crypto";

const ALCANCE = "https://www.googleapis.com/auth/spreadsheets";

/* Columnas de cada pestana (ver PESTANAS en chat bot/src/agentes/hoja.js).
   Si alla cambia el orden, aca hay que cambiarlo igual. */
export const PESTANAS = {
  post: { pestana: "Posts", columnaAprobar: 13, columnaEstado: 14 },
  seguimiento: { pestana: "Seguimientos", columnaAprobar: 7, columnaEstado: 8 },
};

// El publicador no publica una aprobacion vieja: el catalogo de un outlet
// cambia rapido. Es el mismo numero que usa publicador.js.
export const DIAS_VALIDO = 3;

const DESFASE_CR_MS = -6 * 60 * 60 * 1000;

export function letra(indice) {
  return String.fromCharCode(65 + indice);
}

/** Lee la fecha que escribio el agente ("24/9/2026, 6:04:31 a. m."). */
export function leerSello(valor) {
  const m = String(valor ?? "").match(
    /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])?\.?\s*m?\.?/i,
  );
  if (!m) return null;
  const [, d, mes, anio, h, min, s = "0", ampm] = m;
  let hora = Number(h);
  if (ampm) {
    const pm = ampm.toLowerCase() === "p";
    if (pm && hora < 12) hora += 12;
    if (!pm && hora === 12) hora = 0;
  }
  const utc = Date.UTC(Number(anio), Number(mes) - 1, Number(d), hora, Number(min), Number(s));
  return new Date(utc - DESFASE_CR_MS);
}

export function diasEntre(desde, hasta = new Date()) {
  return (hasta.getTime() - desde.getTime()) / (24 * 60 * 60 * 1000);
}

/** Cuanta vida le queda al borrador, dicho en palabras. */
export function vigencia(valores, ahora = new Date()) {
  const fecha = leerSello(valores[0]);
  if (!fecha) return { dias: null, vencido: false, aviso: "" };
  const dias = Math.floor(diasEntre(fecha, ahora));
  if (dias > DIAS_VALIDO) {
    return { dias, vencido: true, aviso: "Venció hace " + (dias - DIAS_VALIDO) + " día(s). El agente arma uno nuevo." };
  }
  const quedan = DIAS_VALIDO - dias;
  return {
    dias,
    vencido: false,
    aviso: quedan === 0 ? "Último día para publicarlo" : "Quedan " + quedan + " día" + (quedan === 1 ? "" : "s"),
  };
}

export const yaAprobado = (valor) => /^s[ií]$/i.test(String(valor ?? "").trim());

export const celdaTexto = (valores, i) => String(valores[i] ?? "").trim();

/** Pendiente = el revisor lo dejo listo y nadie lo ha decidido todavia. */
export function estaPendiente(valores, conf) {
  return celdaTexto(valores, conf.columnaEstado) === "PENDIENTE" && !yaAprobado(valores[conf.columnaAprobar]);
}

/* ------------------------------------------------------------ Hablar con Google */

const base64url = (valor) => Buffer.from(valor).toString("base64url");

let cacheToken = { token: null, hasta: 0 };

async function tokenGoogle() {
  if (cacheToken.token && Date.now() < cacheToken.hasta) return cacheToken.token;

  const bruto = process.env.GOOGLE_CREDENTIALS_JSON;
  if (!bruto) throw new Error("Falta GOOGLE_CREDENTIALS_JSON.");
  const cred = JSON.parse(bruto);

  const ahora = Math.floor(Date.now() / 1000);
  const cabecera = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const cuerpo = base64url(
    JSON.stringify({
      iss: cred.client_email,
      scope: ALCANCE,
      aud: "https://oauth2.googleapis.com/token",
      iat: ahora,
      exp: ahora + 3600,
    }),
  );
  const firma = crypto
    .createSign("RSA-SHA256")
    .update(cabecera + "." + cuerpo)
    .sign(String(cred.private_key).replace(/\\n/g, "\n"));

  const respuesta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: cabecera + "." + cuerpo + "." + base64url(firma),
    }),
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok || !datos.access_token) {
    throw new Error(datos?.error_description || "Google no dio el token.");
  }

  cacheToken = { token: datos.access_token, hasta: Date.now() + 50 * 60 * 1000 };
  return datos.access_token;
}

async function sheets(ruta, opciones = {}) {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("Falta GOOGLE_SHEET_ID.");
  const token = await tokenGoogle();
  const respuesta = await fetch("https://sheets.googleapis.com/v4/spreadsheets/" + id + ruta, {
    ...opciones,
    headers: {
      ...(opciones.headers || {}),
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos?.error?.message || "Google respondio " + respuesta.status);
  return datos;
}

/** Devuelve { fila, valores } sin el encabezado. La fila 2 es la primera. */
export async function leerPestana(nombre) {
  const datos = await sheets("/values/" + encodeURIComponent(nombre + "!A:Z"));
  const filas = datos.values || [];
  return filas.slice(1).map((valores, i) => ({ fila: i + 2, valores }));
}

/** Lee una fila suelta, para confirmar que lo que se va a marcar sigue ahi. */
export async function leerFila(nombre, fila) {
  const datos = await sheets("/values/" + encodeURIComponent(nombre + "!A" + fila + ":Z" + fila));
  return datos.values?.[0] || null;
}

/**
 * Marca una aprobacion. Es lo UNICO que estas funciones pueden escribir en
 * toda la hoja: una casilla, con "si" o con "no".
 */
export async function marcarDecision(tipo, fila, decision) {
  const conf = PESTANAS[tipo];
  if (!conf) throw new Error("Tipo desconocido.");
  if (!Number.isInteger(fila) || fila < 2 || fila > 100000) throw new Error("Fila invalida.");
  if (decision !== "si" && decision !== "no") throw new Error("Decision invalida.");

  const celda = conf.pestana + "!" + letra(conf.columnaAprobar) + fila;
  await sheets("/values/" + encodeURIComponent(celda) + "?valueInputOption=RAW", {
    method: "PUT",
    body: JSON.stringify({ values: [[decision]] }),
  });
  return celda;
}
