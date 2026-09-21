/* =========================================================================
   Panel en linea de Compas Outlet.

   Funciona desde cualquier lugar: celular, tablet o computadora. Entra con
   correo y contrasena, guarda en Supabase y la tienda lo muestra al
   instante, sin republicar nada.
   ========================================================================= */

(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };

  var sb = null;
  var lista = [];
  var editandoId = null;

  var medios = [];        // galeria del articulo que se esta editando
  var mediosAntes = [];   // la que tenia al abrirlo: para borrar lo que se quite
  var subidosAhora = [];  // subidos en esta edicion y todavia sin guardar
  var subiendo = false;

  var MAX_MEDIOS = 10;
  var MAX_VIDEO_MB = 50;
  var VIDEOS = { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "video/x-m4v": "m4v" };

  var escapar = function (t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  var catNombre = function (id) {
    var c = CATEGORIAS.find(function (x) { return x.id === id; });
    return c ? c.nombre : id;
  };
  var catIcono = function (id) {
    var c = CATEGORIAS.find(function (x) { return x.id === id; });
    return c ? c.icono : "✨";
  };

  var dinero = function (n) {
    var d = Number.isInteger(CONFIG.decimales) ? CONFIG.decimales : 2;
    return CONFIG.simboloMoneda + Number(n).toLocaleString(CONFIG.locale || "es", {
      minimumFractionDigits: d, maximumFractionDigits: d,
    });
  };

  function mostrarError(caja, mensaje) {
    var el = $(caja);
    if (!mensaje) { el.classList.add("oculto"); return; }
    el.textContent = mensaje;
    el.classList.remove("oculto");
  }

  function ocupado(boton, texto) {
    boton.dataset.original = boton.textContent;
    boton.textContent = texto;
    boton.disabled = true;
  }
  function libre(boton) {
    if (boton.dataset.original) boton.textContent = boton.dataset.original;
    boton.disabled = false;
  }

  // Traduce los errores tecnicos de Supabase a algo entendible.
  function enCastellano(e) {
    var m = (e && (e.message || e.error_description)) || String(e);
    if (/Invalid login credentials/i.test(m)) return "Correo o contraseña incorrectos.";
    if (/Email not confirmed/i.test(m)) return "Falta confirmar el correo. Revisa tu bandeja de entrada.";
    if (/Failed to fetch|NetworkError/i.test(m)) return "Sin conexión. Revisa tu internet.";
    if (/row-level security|violates/i.test(m)) return "No tienes permiso para ese cambio. Vuelve a entrar.";
    if (/JWT|token/i.test(m)) return "Tu sesión venció. Vuelve a entrar.";
    if (/User already registered|already been registered/i.test(m))
      return "Ese correo ya tiene cuenta. Usa «Ya tengo cuenta» para entrar.";
    if (/Password should be at least/i.test(m)) return "La contraseña es muy corta: mínimo 6 caracteres.";
    if (/exceeded the maximum allowed size|Payload too large|413/i.test(m))
      return "El archivo es demasiado pesado para el almacén de fotos.";
    if (/mime type|not supported/i.test(m)) return "Ese tipo de archivo no está permitido en el almacén.";
    if (/Signups not allowed|signup is disabled/i.test(m))
      return "El registro está desactivado en Supabase. Avísame y lo resolvemos.";
    return m;
  }

  /* ------------------------------------------------------------- Ingreso */

  // El formulario sirve para entrar y para crear la cuenta la primera vez.
  var modoCrear = false;

  function cambiarModo(crear) {
    modoCrear = crear;
    mostrarError("#errorIngreso", "");
    $("#avisoIngreso").classList.add("oculto");
    $("#btnEntrar").textContent = crear ? "Crear mi cuenta" : "Entrar";
    $("#btnVolverEntrar").classList.toggle("oculto", !crear);
    $("#enlaceCrear").classList.toggle("oculto", crear);
    $("#clave").setAttribute("autocomplete", crear ? "new-password" : "current-password");
    document.querySelector(".ingreso p.sub").textContent = crear
      ? "Elige el correo y la contraseña con los que vas a entrar"
      : "Entra para cargar y editar tus artículos";
  }

  async function entrar(e) {
    e.preventDefault();
    mostrarError("#errorIngreso", "");
    $("#avisoIngreso").classList.add("oculto");

    var correo = $("#correo").value.trim();
    var clave = $("#clave").value;
    var boton = $("#btnEntrar");

    if (modoCrear && clave.length < 6) {
      return mostrarError("#errorIngreso", "La contraseña tiene que tener al menos 6 caracteres.");
    }

    ocupado(boton, modoCrear ? "Creando…" : "Entrando…");
    try {
      var r = modoCrear
        ? await sb.auth.signUp({ email: correo, password: clave })
        : await sb.auth.signInWithPassword({ email: correo, password: clave });
      if (r.error) throw r.error;

      // Con la confirmacion por correo activada, signUp no devuelve sesion.
      if (modoCrear && !(r.data && r.data.session)) {
        $("#avisoIngreso").innerHTML =
          "<b>Cuenta creada.</b> Te mandamos un correo a <b>" + escapar(correo) +
          "</b> para confirmarla. Ábrelo, pulsa el enlace y vuelve aquí a entrar. " +
          "Si no lo ves, revisa la carpeta de correo no deseado.";
        $("#avisoIngreso").classList.remove("oculto");
        cambiarModo(false);
        $("#avisoIngreso").classList.remove("oculto");
        return;
      }

      $("#clave").value = "";
      await mostrarTrabajo((r.data.user) || (r.data.session && r.data.session.user));
    } catch (err) {
      mostrarError("#errorIngreso", enCastellano(err));
    } finally {
      libre(boton);
    }
  }

  async function salir() {
    await sb.auth.signOut();
    location.reload();
  }

  async function mostrarTrabajo(usuario) {
    $("#pantallaIngreso").classList.add("oculto");
    $("#pantallaTrabajo").classList.remove("oculto");
    $("#quien").textContent = usuario ? usuario.email : "";
    llenarCategorias();
    limpiarFormulario();
    await recargar();
  }

  /* -------------------------------------------------------------- Datos */

  async function recargar() {
    $("#listado").innerHTML = '<div class="cargando">Cargando…</div>';
    try {
      var cats = await sb.from("categorias").select("*").order("orden", { ascending: true });
      if (cats.error) throw cats.error;
      if (cats.data && cats.data.length) {
        CATEGORIAS = cats.data.map(function (c) {
          return { id: c.id, nombre: c.nombre, icono: c.icono || "✨" };
        });
        llenarCategorias();
      }

      // Si la base ya tiene la columna de galerias. Mientras no, el panel
      // sigue con una sola foto por articulo, como antes.
      var prueba = await sb.from("productos").select("medios").limit(1);
      if (prueba.error && !/medios|42703/.test(prueba.error.message + " " + prueba.error.code)) {
        throw prueba.error;
      }
      prepararGaleria(!prueba.error);

      var prods = await sb.from("productos").select("*").order("id", { ascending: true });
      if (prods.error) throw prods.error;
      lista = (prods.data || []).map(CO_DATOS.desdeBase);
      pintarLista();
    } catch (err) {
      $("#listado").innerHTML =
        '<div class="cargando">No se pudo cargar: ' + escapar(enCastellano(err)) + "</div>";
    }
  }

  /* --------------------------------------------------------- Formulario */

  function llenarCategorias() {
    $("#fCategoria").innerHTML = CATEGORIAS.map(function (c) {
      return '<option value="' + c.id + '">' + c.icono + " " + escapar(c.nombre) + "</option>";
    }).join("");
  }

  var ultimaCategoria = "";

  function limpiarFormulario(conservarCategoria) {
    editandoId = null;
    $("#formulario").reset();
    $("#fId").value = "";
    descartarSubidos();
    medios = [];
    mediosAntes = [];
    $("#fPrecioAntes").value = 0;
    $("#fStock").value = 1;
    if (conservarCategoria && ultimaCategoria) $("#fCategoria").value = ultimaCategoria;
    $("#tituloForm").textContent = "Nuevo artículo";
    $("#btnGuardar").textContent = "Guardar artículo";
    mostrarError("#errorForm", "");
    pintarMedios();
  }

  function editar(id) {
    var p = lista.find(function (x) { return x.id === Number(id); });
    if (!p) return;
    descartarSubidos();
    editandoId = p.id;
    medios = CO_DATOS.mediosDe(p).slice();
    mediosAntes = medios.slice();

    $("#fId").value = p.id;
    $("#fNombre").value = p.nombre;
    $("#fCategoria").value = p.categoria;
    $("#fPrecio").value = p.precio;
    $("#fPrecioAntes").value = p.precioAntes || 0;
    $("#fStock").value = p.stock;
    $("#fDescripcion").value = p.descripcion || "";
    $("#fEtiquetas").value = (p.etiquetas || []).join(", ");
    $("#fDestacado").checked = !!p.destacado;

    $("#tituloForm").textContent = "Editando: " + p.nombre;
    $("#btnGuardar").textContent = "Guardar cambios";
    mostrarError("#errorForm", "");
    pintarMedios();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function borrar(id) {
    var p = lista.find(function (x) { return x.id === Number(id); });
    if (!p) return;
    if (!confirm('¿Eliminar "' + p.nombre + '" de la tienda?\n\nEsto no se puede deshacer.')) return;
    try {
      var r = await sb.from("productos").delete().eq("id", p.id);
      if (r.error) throw r.error;
      if (CO_DATOS.conMedios()) borrarArchivos(CO_DATOS.mediosDe(p).map(urlDe));
      if (editandoId === p.id) limpiarFormulario();
      await recargar();
    } catch (err) {
      alert("No se pudo borrar: " + enCastellano(err));
    }
  }

  async function guardar(e) {
    e.preventDefault();
    mostrarError("#errorForm", "");
    if (subiendo) return mostrarError("#errorForm", "Espera a que terminen de subir las fotos.");

    var etiquetas = $("#fEtiquetas").value.split(",")
      .map(function (t) { return t.trim(); })
      .filter(Boolean);

    var datos = {
      nombre: $("#fNombre").value.trim(),
      categoria: $("#fCategoria").value,
      precio: Number($("#fPrecio").value) || 0,
      precioAntes: Number($("#fPrecioAntes").value) || 0,
      medios: medios.slice(),
      descripcion: $("#fDescripcion").value.trim(),
      stock: Number($("#fStock").value) || 0,
      destacado: $("#fDestacado").checked,
      etiquetas: etiquetas,
    };

    if (datos.precio === 0 && datos.precioAntes > 0) {
      return mostrarError("#errorForm",
        'Con precio 0 el artículo sale como «Consultar precio», así que no puede llevar precio anterior. Déjalo en 0.');
    }
    if (datos.precio > 0 && datos.precioAntes > 0 && datos.precioAntes <= datos.precio) {
      return mostrarError("#errorForm",
        "El precio anterior tiene que ser mayor que el de venta. Si no está en oferta, déjalo en 0.");
    }

    var boton = $("#btnGuardar");
    ocupado(boton, "Guardando…");
    try {
      var r;
      if (editandoId) {
        r = await sb.from("productos").update(CO_DATOS.haciaBase(datos)).eq("id", editandoId);
      } else {
        r = await sb.from("productos").insert(CO_DATOS.haciaBase(datos));
      }
      if (r.error) throw r.error;

      // Ya quedo guardado: lo subido ahora pasa a ser del articulo, y lo que
      // se quito de la galeria ya no lo usa nadie. Solo con galerias: sin
      // ellas no sabemos que otras fotos sigue usando la base.
      subidosAhora = [];
      if (CO_DATOS.conMedios()) {
        var quedan = medios.map(urlDe);
        borrarArchivos(mediosAntes.map(urlDe).filter(function (u) { return quedan.indexOf(u) < 0; }));
      }

      ultimaCategoria = datos.categoria;
      limpiarFormulario(true);
      await recargar();
      $("#fNombre").focus();
    } catch (err) {
      mostrarError("#errorForm", enCastellano(err));
    } finally {
      libre(boton);
    }
  }

  /* -------------------------------------------------------------- Fotos */

  // Achica la foto antes de subirla: 1200 px de lado mayor. Una foto de
  // celular de 4 MB queda en unos 200 KB.
  function optimizar(archivo) {
    return new Promise(function (resolve, reject) {
      var lector = new FileReader();
      lector.onerror = function () { reject(new Error("No se pudo leer la foto")); };
      lector.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("El archivo no parece una imagen")); };
        img.onload = function () {
          var max = 1200, w = img.width, h = img.height;
          if (w > max || h > max) {
            var k = Math.min(max / w, max / h);
            w = Math.round(w * k); h = Math.round(h * k);
          }
          var c = document.createElement("canvas");
          c.width = w; c.height = h;
          var ctx = c.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          c.toBlob(function (b) {
            if (b) resolve(b); else reject(new Error("No se pudo procesar la foto"));
          }, "image/jpeg", 0.85);
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  function nombreLimpio(nombre, extension) {
    var base = nombre.replace(/\.[^.]+$/, "").toLowerCase().normalize("NFD");
    var limpio = base.split("").filter(function (c) {
      var n = c.charCodeAt(0);
      return n < 0x300 || n > 0x36f;
    }).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    // El sufijo evita pisar una foto anterior con el mismo nombre.
    return (limpio || "foto") + "-" + Date.now().toString(36) +
      Math.random().toString(36).slice(2, 5) + "." + extension;
  }

  var urlDe = function (m) { return m.url; };

  async function subirAlAlmacen(nombre, cuerpo, tipo) {
    // Los nombres nunca se repiten, asi que el navegador puede guardarlos
    // un año: la tienda carga mas rapido la segunda vez.
    var r = await sb.storage.from("fotos").upload(nombre, cuerpo, {
      contentType: tipo,
      upsert: false,
      cacheControl: "31536000",
    });
    if (r.error) throw r.error;
    return sb.storage.from("fotos").getPublicUrl(nombre).data.publicUrl;
  }

  async function subirUno(archivo) {
    var tipo = archivo.type || "";
    if (/^video\//.test(tipo) || /\.(mp4|mov|m4v|webm)$/i.test(archivo.name)) {
      var mb = archivo.size / 1048576;
      if (mb > MAX_VIDEO_MB) {
        throw new Error("pesa " + Math.round(mb) + " MB y el máximo es " + MAX_VIDEO_MB +
          ". Recórtalo o grábalo más corto.");
      }
      var ext = VIDEOS[tipo] || (archivo.name.split(".").pop() || "").toLowerCase();
      if (!/^(mp4|mov|m4v|webm)$/.test(ext)) throw new Error("ese formato de video no se ve en todos los celulares");
      var url = await subirAlAlmacen(nombreLimpio(archivo.name, ext), archivo, tipo || "video/mp4");
      return { tipo: "video", url: url };
    }
    if (!/^image\//.test(tipo)) throw new Error("no es una foto ni un video");
    var blob = await optimizar(archivo);
    return { tipo: "imagen", url: await subirAlAlmacen(nombreLimpio(archivo.name, "jpg"), blob, "image/jpeg") };
  }

  async function subirArchivos(archivos) {
    var simple = !CO_DATOS.conMedios();
    var pendientes = Array.prototype.slice.call(archivos);
    var problemas = [];

    if (simple) {
      pendientes = pendientes.filter(function (a) { return /^image\//.test(a.type); }).slice(0, 1);
      if (!pendientes.length) {
        return mostrarError("#errorForm",
          "Por ahora solo se puede una foto. Los videos se habilitan con el paso de Supabase.");
      }
    } else if (pendientes.length > MAX_MEDIOS - medios.length) {
      var sobran = pendientes.length - (MAX_MEDIOS - medios.length);
      pendientes = pendientes.slice(0, MAX_MEDIOS - medios.length);
      problemas.push("quedaron " + sobran + " sin subir: el máximo es " + MAX_MEDIOS + " por artículo");
    }

    mostrarError("#errorForm", "");
    subiendo = true;
    var boton = $("#btnFoto");
    try {
      for (var k = 0; k < pendientes.length; k++) {
        boton.disabled = true;
        boton.textContent = pendientes.length > 1
          ? "Subiendo " + (k + 1) + " de " + pendientes.length + "…"
          : "Subiendo…";
        try {
          var nuevo = await subirUno(pendientes[k]);
          if (simple) {
            descartarSubidos();
            medios = [nuevo];
          } else {
            medios.push(nuevo);
          }
          subidosAhora.push(nuevo.url);
          pintarMedios();
        } catch (err) {
          problemas.push(pendientes[k].name + ": " + enCastellano(err));
        }
      }
    } finally {
      subiendo = false;
      pintarMedios();
    }
    if (problemas.length) mostrarError("#errorForm", "Ojo · " + problemas.join(" · "));
  }

  function rutaEnAlmacen(url) {
    var marca = "/storage/v1/object/public/fotos/";
    var i = String(url).indexOf(marca);
    return i < 0 ? null : decodeURIComponent(url.slice(i + marca.length).split(/[?#]/)[0]);
  }

  // Borra del almacen lo que ya no usa nadie. Si falla no es grave: el
  // articulo ya quedo bien, solo sobra un archivo que ocupa lugar.
  async function borrarArchivos(urls) {
    var rutas = urls.map(rutaEnAlmacen).filter(Boolean);
    if (!rutas.length) return;
    var r = await sb.storage.from("fotos").remove(rutas);
    if (r.error) console.warn("Compas Outlet: no se pudieron borrar archivos viejos.", r.error);
  }

  // Lo subido en una edicion que no se guardo no lo usa ningun articulo.
  function descartarSubidos() {
    if (!subidosAhora.length) return;
    borrarArchivos(subidosAhora);
    subidosAhora = [];
  }

  function prepararGaleria(conGalerias) {
    CO_DATOS.conMedios(conGalerias);
    $("#faltaMedios").classList.toggle("oculto", conGalerias);
    $("#pistaMedios").classList.toggle("oculto", !conGalerias);
    $("#fArchivo").multiple = conGalerias;
    $("#fArchivo").accept = conGalerias ? "image/*,video/*" : "image/*";
    pintarMedios();
  }

  function pintarMedios() {
    var simple = !CO_DATOS.conMedios();
    var portada = medios.findIndex(function (m) { return m.tipo === "imagen"; });
    var ultimo = medios.length - 1;

    $("#medios").innerHTML = medios.map(function (m, i) {
      var vista = m.tipo === "video"
        ? '<video src="' + escapar(m.url) + '#t=0.1" muted playsinline preload="metadata"></video>'
        : '<img src="' + escapar(m.url) + '" alt="" loading="lazy">';
      var etiqueta = m.tipo === "video"
        ? '<span class="medio__etiqueta medio__etiqueta--video">▶ Video</span>'
        : i === portada ? '<span class="medio__etiqueta">Portada</span>' : "";
      var mover = medios.length > 1
        ? '<div class="medio__mover">' +
            '<button type="button" data-medio="izq" data-i="' + i + '" aria-label="Mover antes"' +
              (i === 0 ? " disabled" : "") + ">‹</button>" +
            '<button type="button" data-medio="der" data-i="' + i + '" aria-label="Mover después"' +
              (i === ultimo ? " disabled" : "") + ">›</button>" +
          "</div>"
        : "";
      return (
        '<div class="medio">' + vista + etiqueta +
          '<button type="button" class="medio__quitar" data-medio="quitar" data-i="' + i +
            '" aria-label="Quitar">×</button>' +
          mover +
        "</div>"
      );
    }).join("");

    if (subiendo) return;
    var boton = $("#btnFoto");
    var lleno = !simple && medios.length >= MAX_MEDIOS;
    boton.disabled = lleno;
    boton.textContent = simple
      ? (medios.length ? "Cambiar foto…" : "Elegir foto…")
      : lleno ? "Llegaste al máximo de " + MAX_MEDIOS
      : medios.length ? "Agregar más fotos o videos…" : "Agregar fotos o videos…";
  }

  function tocarMedio(accion, i) {
    if (subiendo || i < 0 || i >= medios.length) return;
    if (accion === "quitar") {
      var quitado = medios.splice(i, 1)[0];
      // Si se subio en esta misma edicion, nadie mas lo usa: se borra ya.
      var k = subidosAhora.indexOf(quitado.url);
      if (k >= 0) {
        subidosAhora.splice(k, 1);
        borrarArchivos([quitado.url]);
      }
    } else {
      var j = accion === "izq" ? i - 1 : i + 1;
      if (j < 0 || j >= medios.length) return;
      var tmp = medios[i];
      medios[i] = medios[j];
      medios[j] = tmp;
    }
    pintarMedios();
  }

  /* ------------------------------------------------------------- Listado */

  function pintarLista() {
    var q = $("#filtro").value.trim().toLowerCase();
    var filtrada = lista.filter(function (p) {
      return !q ||
        p.nombre.toLowerCase().indexOf(q) >= 0 ||
        catNombre(p.categoria).toLowerCase().indexOf(q) >= 0;
    });

    $("#conteo").textContent = lista.length;

    if (!filtrada.length) {
      $("#listado").innerHTML =
        '<div class="cargando">' +
        (lista.length ? "Ningún artículo coincide con el filtro."
                      : "Todavía no hay artículos. Agrega el primero con el formulario.") +
        "</div>";
      return;
    }

    $("#listado").innerHTML = filtrada.map(function (p) {
      var precio = !Number(p.precio)
        ? '<b style="color:var(--rojo)">Consultar</b>'
        : "<b>" + dinero(p.precio) + "</b>";
      var stock = p.stock > 0
        ? p.stock + " en existencia"
        : '<span style="color:var(--rojo)">agotado</span>';
      var cantidad = (p.medios || []).length;
      var galeria = cantidad > 1 ? " · " + cantidad + " fotos/videos" : cantidad ? "" : " · sin foto";
      return (
        '<div class="articulo">' +
          '<div class="articulo__foto">' +
            (p.imagen ? '<img src="' + escapar(p.imagen) + '" alt="" loading="lazy">' : catIcono(p.categoria)) +
          "</div>" +
          "<div>" +
            '<p class="articulo__nombre">' + escapar(p.nombre) +
              (p.destacado ? ' <span style="color:var(--rojo-oscuro);font-size:11px">★</span>' : "") +
            "</p>" +
            '<div class="articulo__meta">' + escapar(catNombre(p.categoria)) +
              " · " + precio + " · " + stock + galeria + "</div>" +
          "</div>" +
          '<div class="articulo__acc">' +
            '<button type="button" data-editar="' + p.id + '">Editar</button>' +
            '<button type="button" class="borrar" data-borrar="' + p.id + '">Borrar</button>' +
          "</div>" +
        "</div>"
      );
    }).join("");
  }

  /* ------------------------------------------------------------ Arranque */

  async function iniciar() {
    if (!CO_DATOS.configurado()) {
      $("#pantallaIngreso").innerHTML =
        '<div class="ingreso__caja">' +
          '<h1>Falta configurar el panel</h1>' +
          '<p class="sub">Todavía no están puestos los datos de Supabase en ' +
          "<code>js/config.js</code>. Sigue los pasos del archivo " +
          "<code>LEEME.md</code>, sección «Panel en línea».</p>" +
          '<a class="btn btn--claro btn--bloque" href="index.html">Volver a la tienda</a>' +
        "</div>";
      return;
    }

    sb = CO_DATOS.cliente();
    if (!sb) {
      $("#errorIngreso").textContent = "No se pudo conectar con el servidor.";
      $("#errorIngreso").classList.remove("oculto");
      return;
    }

    $("#formIngreso").addEventListener("submit", entrar);
    $("#enlaceCrear").addEventListener("click", function (e) {
      e.preventDefault();
      cambiarModo(true);
    });
    $("#btnVolverEntrar").addEventListener("click", function () { cambiarModo(false); });
    $("#btnSalir").addEventListener("click", salir);
    $("#formulario").addEventListener("submit", guardar);
    $("#btnCancelar").addEventListener("click", function () { limpiarFormulario(); });
    $("#btnNuevo").addEventListener("click", function () {
      limpiarFormulario(true);
      $("#fNombre").focus();
    });
    $("#btnRecargar").addEventListener("click", recargar);
    $("#filtro").addEventListener("input", pintarLista);

    $("#btnFoto").addEventListener("click", function () { $("#fArchivo").click(); });
    $("#fArchivo").addEventListener("change", function (e) {
      var archivos = e.target.files;
      if (archivos && archivos.length) subirArchivos(archivos);
      e.target.value = "";
    });
    $("#medios").addEventListener("click", function (e) {
      var b = e.target.closest("[data-medio]");
      if (b) tocarMedio(b.dataset.medio, Number(b.dataset.i));
    });

    $("#listado").addEventListener("click", function (e) {
      var ed = e.target.closest("[data-editar]");
      if (ed) return editar(ed.dataset.editar);
      var bo = e.target.closest("[data-borrar]");
      if (bo) return borrar(bo.dataset.borrar);
    });

    // Si ya habia sesion abierta, entra directo.
    var sesion = await sb.auth.getSession();
    if (sesion.data && sesion.data.session) {
      await mostrarTrabajo(sesion.data.session.user);
    }
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
