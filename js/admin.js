/* =========================================================================
   Panel de administracion del catalogo.

   Tiene dos modos:

   - Modo servidor (abriendo administrar.cmd): guarda directo en
     js/productos.js, sube las fotos a img/ ya optimizadas y puede
     publicar en internet con un boton.

   - Modo solo lectura (archivo suelto o sitio publicado): no puede
     escribir nada. Solo queda descargar productos.js a mano.
   ========================================================================= */

(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const CLAVE = "co_borrador";

  const escapar = (t) =>
    String(t).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const catNombre = (id) => (CATEGORIAS.find((c) => c.id === id) || {}).nombre || id;
  const catIcono = (id) => (CATEGORIAS.find((c) => c.id === id) || {}).icono || "✨";

  // Mismo formato que la tienda: usa los decimales y el idioma de config.js.
  const dinero = (n) => {
    const d = Number.isInteger(CONFIG.decimales) ? CONFIG.decimales : 2;
    return (
      CONFIG.simboloMoneda +
      Number(n).toLocaleString(CONFIG.locale || "es", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      })
    );
  };

  // Precio 0 = articulo publicado sin precio.
  const sinPrecio = (p) => !Number(p.precio);

  /* --------------------------------------------------------------- Estado */

  // Borrador guardado, o copia limpia de lo que hay en productos.js
  let lista = cargarBorrador() || JSON.parse(JSON.stringify(PRODUCTOS));
  let editandoId = null;
  let urlPrevia = null;

  // true cuando el panel corre sobre administrar.cmd: ahi si puede escribir
  // en los archivos de verdad. false si se abrio como archivo suelto o en
  // el sitio publicado, donde solo queda la descarga manual.
  let modoServidor = false;

  // Hay ediciones hechas en el panel que todavia no se escribieron en
  // js/productos.js. Si hay borrador guardado, arrancamos avisando.
  let hayCambiosSinGuardar = !!cargarBorrador();

  function pintarAviso() {
    const caja = $("#avisoModo");
    if (!modoServidor) {
      caja.innerHTML =
        "<strong>⚠ Estás en modo solo lectura</strong>" +
        "Lo que edites aquí <b>no va a llegar a tu tienda</b>: se queda guardado " +
        "solo en este navegador. " +
        "Para editar de verdad, cierra esta pestaña y abre " +
        "<code>administrar.cmd</code> (doble clic) en la carpeta de tu página.";
      caja.style.borderColor = "var(--rojo)";
      return;
    }
    caja.style.borderColor = "";
    if (hayCambiosSinGuardar) {
      caja.innerHTML =
        "<strong>Tienes cambios sin guardar</strong>" +
        'Pulsa <b>«Guardar en la tienda»</b> para escribirlos en tu página, y luego ' +
        '<b>«Publicar en internet»</b> para que se vean en compas-outlet.vercel.app';
    } else {
      caja.innerHTML =
        "<strong>Todo guardado</strong>" +
        "Agrega o edita artículos con el formulario. Al terminar, " +
        '<b>«Guardar en la tienda»</b> y después <b>«Publicar en internet»</b>.';
    }
  }

  // Cualquier edicion deja el catalogo "sucio" hasta que se guarde en disco.
  function marcarSucio() {
    hayCambiosSinGuardar = true;
    pintarAviso();
  }

  async function detectarModo() {
    try {
      const r = await fetch("/api/estado", { cache: "no-store" });
      if (!r.ok) return false;
      const d = await r.json();
      return d && d.modo === "servidor";
    } catch (e) {
      return false;
    }
  }

  function cargarBorrador() {
    try {
      const v = localStorage.getItem(CLAVE);
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  }

  function guardarBorrador() {
    try { localStorage.setItem(CLAVE, JSON.stringify(lista)); } catch (e) { /* ignorar */ }
  }

  /* ------------------------------------------------------------ Formulario */

  function llenarCategorias() {
    $("#fCategoria").innerHTML = CATEGORIAS.map(
      (c) => '<option value="' + c.id + '">' + c.icono + " " + escapar(c.nombre) + "</option>"
    ).join("");
  }

  // Al cargar muchos articulos seguidos, casi siempre son de la misma
  // categoria: la dejamos puesta en vez de reiniciarla en cada alta.
  let ultimaCategoria = "";

  function limpiarFormulario(conservarCategoria) {
    editandoId = null;
    $("#formulario").reset();
    $("#fId").value = "";
    $("#fPrecioAntes").value = 0;
    $("#fStock").value = 1;
    if (conservarCategoria && ultimaCategoria) $("#fCategoria").value = ultimaCategoria;
    $("#tituloForm").textContent = "Nuevo artículo";
    $("#btnGuardar").textContent = "Guardar artículo";
    pintarPrevia("");
  }

  function pintarPrevia(ruta, urlLocal) {
    const caja = $("#previa");
    if (urlLocal) {
      caja.innerHTML = '<img src="' + urlLocal + '" alt="Vista previa">';
      return;
    }
    if (ruta) {
      caja.innerHTML =
        '<img src="' + escapar(ruta) + '" alt="Vista previa" ' +
        'onerror="this.parentNode.textContent=\'No se encuentra esa foto todavía. ' +
        'Cópiala dentro de la carpeta img/\'">';
      return;
    }
    caja.textContent = "Sin foto seleccionada";
  }

  function editar(id) {
    const p = lista.find((x) => x.id === Number(id));
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
    pintarPrevia(p.imagen);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function borrar(id) {
    const p = lista.find((x) => x.id === Number(id));
    if (!p) return;
    if (!confirm('¿Eliminar "' + p.nombre + '" del catálogo?')) return;
    lista = lista.filter((x) => x.id !== Number(id));
    if (editandoId === Number(id)) limpiarFormulario();
    guardarBorrador();
    marcarSucio();
    pintarTabla();
  }

  function guardar(e) {
    e.preventDefault();

    const etiquetas = $("#fEtiquetas").value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const datos = {
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

    // Con precio 0 el articulo sale como "Consultar precio", asi que no
    // tiene sentido un precio tachado.
    if (datos.precio === 0 && datos.precioAntes > 0) {
      alert('Con precio 0 el artículo se publica como "Consultar precio",\n' +
            "así que no puede llevar precio anterior. Déjalo en 0.");
      return;
    }

    if (datos.precio > 0 && datos.precioAntes > 0 && datos.precioAntes <= datos.precio) {
      alert("El precio anterior debe ser mayor que el precio de venta.\n" +
            "Si el artículo no está en oferta, deja ese campo en 0.");
      return;
    }

    if (editandoId) {
      const i = lista.findIndex((x) => x.id === editandoId);
      lista[i] = Object.assign({}, lista[i], datos);
    } else {
      const nuevoId = lista.reduce((max, p) => Math.max(max, p.id), 0) + 1;
      lista.push(Object.assign({ id: nuevoId }, datos));
    }

    ultimaCategoria = datos.categoria;
    guardarBorrador();
    marcarSucio();
    pintarTabla();
    limpiarFormulario(true);
    $("#fNombre").focus();
  }

  /* ---------------------------------------------------------------- Tabla */

  function pintarTabla() {
    const q = $("#filtroAdmin").value.trim().toLowerCase();
    const filtrada = lista.filter(
      (p) =>
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        catNombre(p.categoria).toLowerCase().includes(q)
    );

    $("#conteo").textContent = lista.length;

    if (!filtrada.length) {
      $("#tabla").innerHTML =
        '<tr><td colspan="6" style="text-align:center;padding:34px;color:var(--text-muted)">' +
        (lista.length ? "Ningún artículo coincide con el filtro." : "Todavía no hay artículos. Agrega el primero con el formulario.") +
        "</td></tr>";
      return;
    }

    $("#tabla").innerHTML = filtrada
      .map(
        (p) =>
          "<tr>" +
            '<td><div class="mini">' +
              (p.imagen
                ? '<img src="' + escapar(p.imagen) + '" alt="" onerror="this.replaceWith(document.createTextNode(\'' + catIcono(p.categoria) + '\'))">'
                : catIcono(p.categoria)) +
            "</div></td>" +
            "<td><strong>" + escapar(p.nombre) + "</strong>" +
              (p.destacado ? ' <span style="color:var(--amber-dark);font-size:11px">★ destacado</span>' : "") +
            "</td>" +
            "<td>" + escapar(catNombre(p.categoria)) + "</td>" +
            "<td>" +
              (sinPrecio(p)
                ? '<span style="color:var(--rojo);font-weight:600">Consultar</span>'
                : dinero(p.precio) +
                  (p.precioAntes > p.precio
                    ? '<br><span style="text-decoration:line-through;color:var(--text-muted);font-size:12px">' + dinero(p.precioAntes) + "</span>"
                    : "")) +
            "</td>" +
            "<td>" +
              (p.stock > 0
                ? p.stock
                : '<span style="color:var(--red);font-weight:600">agotado</span>') +
            "</td>" +
            '<td><div class="acc">' +
              '<button type="button" data-editar="' + p.id + '">Editar</button>' +
              '<button type="button" class="borrar" data-borrar="' + p.id + '">Borrar</button>' +
            "</div></td>" +
          "</tr>"
      )
      .join("");
  }

  /* ------------------------------------------------------------- Descarga */

  function generarArchivo() {
    const cab =
      "/* =========================================================================\n" +
      "   CATALOGO DE PRODUCTOS\n" +
      "   Generado desde admin.html el " +
      new Date().toLocaleString("es") + "\n" +
      "   -------------------------------------------------------------------------\n" +
      "   Puedes editar a mano o volver a usar admin.html.\n" +
      "   ========================================================================= */\n\n";

    const cats =
      "const CATEGORIAS = " + JSON.stringify(CATEGORIAS, null, 2) + ";\n\n";

    const prods =
      "const PRODUCTOS = [\n" +
      lista
        .map(
          (p) =>
            "  {\n" +
            "    id: " + p.id + ",\n" +
            "    nombre: " + JSON.stringify(p.nombre) + ",\n" +
            "    categoria: " + JSON.stringify(p.categoria) + ",\n" +
            "    precio: " + Number(p.precio) + ",\n" +
            "    precioAntes: " + Number(p.precioAntes || 0) + ",\n" +
            "    imagen: " + JSON.stringify(p.imagen || "") + ",\n" +
            "    descripcion: " + JSON.stringify(p.descripcion || "") + ",\n" +
            "    stock: " + Number(p.stock) + ",\n" +
            "    destacado: " + (p.destacado ? "true" : "false") + ",\n" +
            "    etiquetas: " + JSON.stringify(p.etiquetas || []) + ",\n" +
            "  },"
        )
        .join("\n") +
      "\n];\n";

    return cab + cats + prods;
  }

  function descargar() {
    const blob = new Blob([generarArchivo()], { type: "text/javascript;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "productos.js";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    alert(
      "Se descargó productos.js\n\n" +
      "Último paso: mueve ese archivo a la carpeta js/ de tu página,\n" +
      "reemplazando el que ya está ahí. Luego recarga la tienda."
    );
  }

  /* --------------------------------- Guardar y publicar (modo servidor) */

  function ocupado(boton, texto) {
    boton.dataset.textoOriginal = boton.textContent;
    boton.textContent = texto;
    boton.disabled = true;
  }
  function libre(boton) {
    boton.textContent = boton.dataset.textoOriginal || boton.textContent;
    boton.disabled = false;
  }

  async function guardarEnTienda() {
    const boton = $("#btnGuardarTienda");
    ocupado(boton, "Guardando…");
    try {
      const r = await fetch("/api/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: generarArchivo(), cantidad: lista.length }),
      });
      const d = await r.json();
      libre(boton);
      if (!d.ok) return alert("No se pudo guardar: " + (d.mensaje || "error desconocido"));

      // Lo guardado ya es la version buena: el borrador deja de hacer falta.
      try { localStorage.removeItem(CLAVE); } catch (e) { /* ignorar */ }
      hayCambiosSinGuardar = false;
      pintarAviso();
      alert(
        "Guardado en la tienda.\n\n" +
        lista.length + " artículos.\n\n" +
        'Ábrela con "Ver tienda" para revisarla. Cuando esté como quieres, ' +
        'pulsa "Publicar en internet".'
      );
    } catch (e) {
      libre(boton);
      alert("No se pudo guardar: " + e.message);
    }
  }

  async function publicar() {
    if (hayCambiosSinGuardar &&
        !confirm('Tienes cambios sin guardar en la tienda.\n\n¿Publicar de todos modos?\n' +
                 '(Lo no guardado no se sube.)')) return;

    const boton = $("#btnPublicar");
    ocupado(boton, "Publicando…");
    try {
      const r = await fetch("/api/publicar", { method: "POST" });
      const d = await r.json();
      libre(boton);
      if (d.ok) {
        alert(d.mensaje);
      } else {
        alert("No se pudo publicar.\n\n" + (d.mensaje || "") + "\n\n" + (d.detalle || ""));
      }
    } catch (e) {
      libre(boton);
      alert("No se pudo publicar: " + e.message);
    }
  }

  /* ------------------------------------------------- Fotos (optimizadas) */

  // Achica la foto antes de guardarla: 1200 px de lado mayor y JPEG de
  // calidad alta. Una foto de celular de 4 MB queda en unos 200 KB.
  function optimizar(archivo) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onerror = () => reject(new Error("No se pudo leer la foto"));
      lector.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("El archivo no parece una imagen"));
        img.onload = () => {
          const max = 1200;
          let { width: w, height: h } = img;
          if (w > max || h > max) {
            const k = Math.min(max / w, max / h);
            w = Math.round(w * k);
            h = Math.round(h * k);
          }
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          const ctx = c.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL("image/jpeg", 0.85).split(",")[1]);
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  // Convierte "Foto WhatsApp 2026.jpeg" en "foto-whatsapp-2026.jpg"
  function nombreLimpio(nombre) {
    const base = nombre.replace(/\.[^.]+$/, "");
    const limpio = base
      .toLowerCase()
      .normalize("NFD")
      .split("")
      .filter((c) => { const n = c.charCodeAt(0); return n < 0x300 || n > 0x36f; })
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return (limpio || "foto") + ".jpg";
  }

  async function subirFoto(archivo) {
    const boton = $("#btnFoto");
    ocupado(boton, "Subiendo…");
    try {
      const base64 = await optimizar(archivo);
      const nombre = nombreLimpio(archivo.name);
      const r = await fetch("/api/foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre, base64: base64 }),
      });
      const d = await r.json();
      libre(boton);
      if (!d.ok) return alert("No se pudo subir la foto.");
      $("#fImagen").value = d.ruta;
      pintarPrevia(d.ruta + "?t=" + Date.now());
    } catch (e) {
      libre(boton);
      alert("No se pudo subir la foto: " + e.message);
    }
  }

  /* ------------------------------------------------------------- Arranque */

  async function iniciar() {
    llenarCategorias();
    limpiarFormulario();
    pintarTabla();

    modoServidor = await detectarModo();

    // Los botones cambian segun donde se este usando el panel.
    $("#btnGuardarTienda").classList.toggle("oculto", !modoServidor);
    $("#btnPublicar").classList.toggle("oculto", !modoServidor);
    $("#btnDescargar").classList.toggle("oculto", modoServidor);
    $("#pistaFoto").innerHTML = modoServidor
      ? "Elige la foto y se guarda sola en tu página, ya optimizada."
      : "Aquí solo se anota el nombre. Para que la foto se guarde de verdad, " +
        "usa <code>administrar.cmd</code>.";
    pintarAviso();

    $("#formulario").addEventListener("submit", guardar);
    $("#btnCancelar").addEventListener("click", limpiarFormulario);
    $("#btnNuevo").addEventListener("click", () => {
      limpiarFormulario();
      $("#fNombre").focus();
    });
    $("#btnDescargar").addEventListener("click", descargar);
    $("#btnGuardarTienda").addEventListener("click", guardarEnTienda);
    $("#btnPublicar").addEventListener("click", publicar);

    $("#btnRecargar").addEventListener("click", () => {
      if (!confirm("Se descartan los cambios que no hayas guardado y se vuelve\n" +
                   "al catálogo que está publicado. ¿Continuar?")) return;
      lista = JSON.parse(JSON.stringify(PRODUCTOS));
      try { localStorage.removeItem(CLAVE); } catch (e) { /* ignorar */ }
      hayCambiosSinGuardar = false;
      limpiarFormulario();
      pintarTabla();
      pintarAviso();
    });

    $("#filtroAdmin").addEventListener("input", pintarTabla);

    $("#fImagen").addEventListener("input", (e) => pintarPrevia(e.target.value.trim()));

    $("#btnFoto").addEventListener("click", () => $("#fArchivo").click());
    $("#fArchivo").addEventListener("change", (e) => {
      const archivo = e.target.files[0];
      if (!archivo) return;
      if (modoServidor) {
        subirFoto(archivo);
      } else {
        // Sin servidor solo podemos anotar el nombre y mostrar una vista previa.
        $("#fImagen").value = "img/" + archivo.name;
        if (urlPrevia) URL.revokeObjectURL(urlPrevia);
        urlPrevia = URL.createObjectURL(archivo);
        pintarPrevia("", urlPrevia);
      }
      e.target.value = "";
    });

    $("#tabla").addEventListener("click", (e) => {
      const ed = e.target.closest("[data-editar]");
      if (ed) return editar(ed.dataset.editar);
      const bo = e.target.closest("[data-borrar]");
      if (bo) return borrar(bo.dataset.borrar);
    });

    // Evita cerrar la pestana con ediciones a medio guardar.
    window.addEventListener("beforeunload", (e) => {
      if (!hayCambiosSinGuardar) return;
      e.preventDefault();
      e.returnValue = "";
    });
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
