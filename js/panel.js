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
    $("#fImagen").value = "";
    $("#fPrecioAntes").value = 0;
    $("#fStock").value = 1;
    if (conservarCategoria && ultimaCategoria) $("#fCategoria").value = ultimaCategoria;
    $("#tituloForm").textContent = "Nuevo artículo";
    $("#btnGuardar").textContent = "Guardar artículo";
    mostrarError("#errorForm", "");
    pintarPrevia("");
  }

  function pintarPrevia(url) {
    var caja = $("#previa");
    if (url) {
      caja.innerHTML = '<img src="' + escapar(url) + '" alt="Vista previa">';
      $("#btnQuitarFoto").classList.remove("oculto");
    } else {
      caja.textContent = "Sin foto";
      $("#btnQuitarFoto").classList.add("oculto");
    }
  }

  function editar(id) {
    var p = lista.find(function (x) { return x.id === Number(id); });
    if (!p) return;
    editandoId = p.id;

    $("#fId").value = p.id;
    $("#fNombre").value = p.nombre;
    $("#fCategoria").value = p.categoria;
    $("#fPrecio").value = p.precio;
    $("#fPrecioAntes").value = p.precioAntes || 0;
    $("#fStock").value = p.stock;
    $("#fImagen").value = p.imagen || "";
    $("#fDescripcion").value = p.descripcion || "";
    $("#fEtiquetas").value = (p.etiquetas || []).join(", ");
    $("#fDestacado").checked = !!p.destacado;

    $("#tituloForm").textContent = "Editando: " + p.nombre;
    $("#btnGuardar").textContent = "Guardar cambios";
    mostrarError("#errorForm", "");
    pintarPrevia(p.imagen);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function borrar(id) {
    var p = lista.find(function (x) { return x.id === Number(id); });
    if (!p) return;
    if (!confirm('¿Eliminar "' + p.nombre + '" de la tienda?\n\nEsto no se puede deshacer.')) return;
    try {
      var r = await sb.from("productos").delete().eq("id", p.id);
      if (r.error) throw r.error;
      if (editandoId === p.id) limpiarFormulario();
      await recargar();
    } catch (err) {
      alert("No se pudo borrar: " + enCastellano(err));
    }
  }

  async function guardar(e) {
    e.preventDefault();
    mostrarError("#errorForm", "");

    var etiquetas = $("#fEtiquetas").value.split(",")
      .map(function (t) { return t.trim(); })
      .filter(Boolean);

    var datos = {
      nombre: $("#fNombre").value.trim(),
      categoria: $("#fCategoria").value,
      precio: Number($("#fPrecio").value) || 0,
      precioAntes: Number($("#fPrecioAntes").value) || 0,
      imagen: $("#fImagen").value.trim(),
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

  function nombreLimpio(nombre) {
    var base = nombre.replace(/\.[^.]+$/, "").toLowerCase().normalize("NFD");
    var limpio = base.split("").filter(function (c) {
      var n = c.charCodeAt(0);
      return n < 0x300 || n > 0x36f;
    }).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    // El sufijo evita pisar una foto anterior con el mismo nombre.
    return (limpio || "foto") + "-" + Date.now().toString(36) + ".jpg";
  }

  async function subirFoto(archivo) {
    var boton = $("#btnFoto");
    ocupado(boton, "Subiendo…");
    try {
      var blob = await optimizar(archivo);
      var nombre = nombreLimpio(archivo.name);
      var subida = await sb.storage.from("fotos").upload(nombre, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (subida.error) throw subida.error;

      var publica = sb.storage.from("fotos").getPublicUrl(nombre);
      $("#fImagen").value = publica.data.publicUrl;
      pintarPrevia(publica.data.publicUrl);
    } catch (err) {
      mostrarError("#errorForm", "No se pudo subir la foto: " + enCastellano(err));
    } finally {
      libre(boton);
    }
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
              " · " + precio + " · " + stock + "</div>" +
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
      var archivo = e.target.files[0];
      if (archivo) subirFoto(archivo);
      e.target.value = "";
    });
    $("#btnQuitarFoto").addEventListener("click", function () {
      $("#fImagen").value = "";
      pintarPrevia("");
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
