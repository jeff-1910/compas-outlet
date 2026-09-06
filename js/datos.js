/* =========================================================================
   Origen de los datos del catalogo.

   Si en config.js hay datos de Supabase, el catalogo se lee de ahi: es lo
   que edita el panel desde cualquier lugar. Si no, o si falla la conexion,
   se usa el catalogo local de productos.js para que la tienda nunca quede
   en blanco.
   ========================================================================= */

var CO_DATOS = (function () {
  "use strict";

  var cliente = null;
  var origen = "local";

  function configurado() {
    return !!(CONFIG.supabase && CONFIG.supabase.url && CONFIG.supabase.anonKey);
  }

  // Cliente unico, compartido por la tienda y el panel.
  function obtenerCliente() {
    if (cliente) return cliente;
    if (!configurado()) return null;
    if (typeof window.supabase === "undefined") {
      console.warn("Compas Outlet: no cargo la libreria de Supabase.");
      return null;
    }
    cliente = window.supabase.createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    return cliente;
  }

  // La base guarda los nombres en minuscula y con guion bajo; la tienda los
  // usa como los venia usando. Aqui se traduce de un lado al otro.
  function desdeBase(fila) {
    return {
      id: fila.id,
      nombre: fila.nombre || "",
      categoria: fila.categoria || "otros",
      precio: Number(fila.precio) || 0,
      precioAntes: Number(fila.precio_antes) || 0,
      imagen: fila.imagen || "",
      descripcion: fila.descripcion || "",
      stock: Number(fila.stock) || 0,
      destacado: !!fila.destacado,
      etiquetas: fila.etiquetas || [],
    };
  }

  function haciaBase(p) {
    return {
      nombre: p.nombre,
      categoria: p.categoria,
      precio: Number(p.precio) || 0,
      precio_antes: Number(p.precioAntes) || 0,
      imagen: p.imagen || "",
      descripcion: p.descripcion || "",
      stock: Number(p.stock) || 0,
      destacado: !!p.destacado,
      etiquetas: p.etiquetas || [],
    };
  }

  /* ------------------------------------------------------------- Cargar */

  async function cargar() {
    var sb = obtenerCliente();
    if (!sb) {
      origen = "local";
      return { origen: origen, motivo: "Supabase no configurado" };
    }

    // Si el servidor no contesta en 6 segundos, nos quedamos con el
    // catalogo local en vez de dejar al cliente esperando.
    function conLimite(promesa) {
      return Promise.race([
        promesa,
        new Promise(function (_, rechazar) {
          setTimeout(function () { rechazar(new Error("El servidor tardo demasiado")); }, 6000);
        }),
      ]);
    }

    try {
      var cats = await conLimite(
        sb.from("categorias").select("*").order("orden", { ascending: true })
      );
      if (cats.error) throw cats.error;

      var prods = await conLimite(
        sb.from("productos").select("*").order("id", { ascending: true })
      );
      if (prods.error) throw prods.error;

      // Sustituimos los arreglos que usa la tienda. Por eso en productos.js
      // estan declarados con var y no con const.
      if (cats.data && cats.data.length) {
        CATEGORIAS = cats.data.map(function (c) {
          return { id: c.id, nombre: c.nombre, icono: c.icono || "✨" };
        });
      }
      PRODUCTOS = (prods.data || []).map(desdeBase);

      origen = "supabase";
      return { origen: origen, articulos: PRODUCTOS.length };
    } catch (e) {
      console.warn("Compas Outlet: no se pudo leer el catalogo en linea. " +
                   "Se muestra el catalogo guardado en la pagina.", e);
      origen = "local";
      return { origen: origen, motivo: e.message || String(e) };
    }
  }

  return {
    cargar: cargar,
    cliente: obtenerCliente,
    configurado: configurado,
    desdeBase: desdeBase,
    haciaBase: haciaBase,
    origen: function () { return origen; },
  };
})();
