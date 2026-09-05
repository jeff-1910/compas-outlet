/* =========================================================================
   Panel de administracion del catalogo.

   Trabaja sobre una copia en el navegador (borrador). Para publicar los
   cambios hay que descargar productos.js y reemplazar el archivo real.
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

  /* ------------------------------------------------------------- Arranque */

  function iniciar() {
    llenarCategorias();
    limpiarFormulario();
    pintarTabla();

    $("#formulario").addEventListener("submit", guardar);
    $("#btnCancelar").addEventListener("click", limpiarFormulario);
    $("#btnNuevo").addEventListener("click", () => {
      limpiarFormulario();
      $("#fNombre").focus();
    });
    $("#btnDescargar").addEventListener("click", descargar);

    $("#btnRecargar").addEventListener("click", () => {
      if (!confirm("Se descartan los cambios no descargados y se vuelve a lo que hay en productos.js. ¿Continuar?")) return;
      lista = JSON.parse(JSON.stringify(PRODUCTOS));
      try { localStorage.removeItem(CLAVE); } catch (e) { /* ignorar */ }
      limpiarFormulario();
      pintarTabla();
    });

    $("#filtroAdmin").addEventListener("input", pintarTabla);

    $("#fImagen").addEventListener("input", (e) => pintarPrevia(e.target.value.trim()));

    $("#btnFoto").addEventListener("click", () => $("#fArchivo").click());
    $("#fArchivo").addEventListener("change", (e) => {
      const archivo = e.target.files[0];
      if (!archivo) return;
      $("#fImagen").value = "img/" + archivo.name;
      if (urlPrevia) URL.revokeObjectURL(urlPrevia);
      urlPrevia = URL.createObjectURL(archivo);
      pintarPrevia("", urlPrevia);
    });

    $("#tabla").addEventListener("click", (e) => {
      const ed = e.target.closest("[data-editar]");
      if (ed) return editar(ed.dataset.editar);
      const bo = e.target.closest("[data-borrar]");
      if (bo) return borrar(bo.dataset.borrar);
    });

    // Avisa si hay un borrador con cambios sin descargar.
    if (cargarBorrador()) {
      const banner = document.createElement("div");
      banner.className = "aviso";
      banner.innerHTML =
        "<strong>Tienes cambios sin publicar</strong>" +
        "Se recuperó tu último borrador guardado en este navegador. " +
        "Recuerda pulsar «Descargar productos.js» para que se vean en la tienda.";
      document.querySelector("main").insertBefore(banner, document.querySelector(".barra-admin"));
    }
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
