/* =========================================================================
   BORRADORES DE ARTICULOS

   Los articulos nuevos (con sus fotos y su area sugerida) esperan aqui, en la
   tabla privada productos_borrador de Supabase, hasta que los apruebes desde
   el WhatsApp. Al aprobar, el articulo se copia a "productos" y desde ese
   momento lo ven la tienda y el bot.

   Variables de entorno necesarias (en Vercel):
     SUPABASE_URL           la direccion del proyecto de Supabase
     SUPABASE_SERVICE_KEY   la llave secreta (solo vive en el servidor)
   ========================================================================= */

function config() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const llave = String(process.env.SUPABASE_SERVICE_KEY || "");
  if (!url || !llave) throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en Vercel.");
  const cabecera = { apikey: llave, "Content-Type": "application/json" };
  // Las llaves viejas (service_role) son un JWT y tambien van como Bearer.
  if (llave.startsWith("eyJ")) cabecera.Authorization = "Bearer " + llave;
  return { url, cabecera };
}

async function rest(ruta, { metodo = "GET", cuerpo, prefer } = {}) {
  const { url, cabecera } = config();
  const respuesta = await fetch(url + "/rest/v1/" + ruta, {
    method: metodo,
    headers: { ...cabecera, ...(prefer ? { Prefer: prefer } : {}) },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await respuesta.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = null;
  }
  if (!respuesta.ok) {
    throw new Error((datos && (datos.message || datos.error)) || "Supabase respondio " + respuesta.status);
  }
  return { datos, cabeceras: respuesta.headers };
}

const ABIERTOS = "estado=in.(pendiente,enviado)";

/** Los borradores que esperan tu decision, los mas viejos primero. */
export async function pendientes(limite) {
  const { datos, cabeceras } = await rest(
    "productos_borrador?" + ABIERTOS + "&order=id.asc&limit=" + limite + "&select=*",
    { prefer: "count=exact" },
  );
  const total = Number(String(cabeceras.get("content-range") || "").split("/")[1]);
  return { filas: Array.isArray(datos) ? datos : [], total: Number.isFinite(total) ? total : (datos || []).length };
}

/**
 * Aprobar o descartar un borrador.
 *
 * Primero se "reclama" el borrador cambiandole el estado solo si todavia
 * estaba abierto. Si tocas el boton dos veces (o llegan dos avisos de Meta),
 * el segundo ya no encuentra nada que reclamar y no se duplica el articulo.
 */
export async function decidir(id, decision) {
  const nuevo = decision === "si" ? "aprobado" : "descartado";
  const { datos: reclamado } = await rest("productos_borrador?id=eq." + id + "&" + ABIERTOS, {
    metodo: "PATCH",
    prefer: "return=representation",
    cuerpo: { estado: nuevo, decidido_en: new Date().toISOString() },
  });

  if (!Array.isArray(reclamado) || !reclamado.length) {
    // Ya estaba decidido (o no existe). Se cuenta como estaba.
    const { datos } = await rest("productos_borrador?id=eq." + id + "&select=nombre,estado");
    const fila = Array.isArray(datos) ? datos[0] : null;
    return { yaDecidido: true, nombre: fila?.nombre || "", estado: fila?.estado || "" };
  }

  const borrador = reclamado[0];
  if (decision !== "si") return { nombre: borrador.nombre, estado: nuevo };

  const medios = Array.isArray(borrador.medios) ? borrador.medios : [];
  try {
    const { datos } = await rest("productos", {
      metodo: "POST",
      prefer: "return=representation",
      cuerpo: {
        nombre: borrador.nombre,
        categoria: borrador.categoria || "otros",
        precio: Math.max(0, Math.round(Number(borrador.precio) || 0)),
        precio_antes: 0,
        imagen: medios[0]?.url || "",
        medios,
        descripcion: borrador.descripcion || "",
        stock: Number(borrador.cantidad) > 0 ? Number(borrador.cantidad) : 1,
        destacado: false,
        etiquetas: borrador.marca ? [String(borrador.marca).toLowerCase()] : [],
      },
    });
    const creado = Array.isArray(datos) ? datos[0] : null;
    if (creado?.id) {
      await rest("productos_borrador?id=eq." + id, { metodo: "PATCH", cuerpo: { producto_id: creado.id } });
    }
    return { nombre: borrador.nombre, estado: nuevo, productoId: creado?.id };
  } catch (error) {
    // Si no se pudo crear el articulo, el borrador vuelve a quedar pendiente
    // para que no se pierda por una falla pasajera.
    await rest("productos_borrador?id=eq." + id, {
      metodo: "PATCH",
      cuerpo: { estado: "pendiente", decidido_en: null },
    }).catch(() => {});
    throw error;
  }
}
