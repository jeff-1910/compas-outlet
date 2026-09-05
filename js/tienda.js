/* =========================================================================
   Compass Outlet - Logica de la tienda
   No hace falta editar este archivo para cambiar productos o datos.
   Productos -> js/productos.js     Datos del negocio -> js/config.js
   ========================================================================= */

(function () {
  "use strict";

  /* ------------------------------------------------------------- Utilidades */

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

  // Formatea con los decimales y el idioma que diga config.js
  // (colones sin decimales, dolares con dos).
  const precio = (n) => {
    const d = Number.isInteger(CONFIG.decimales) ? CONFIG.decimales : 2;
    return (
      CONFIG.simboloMoneda +
      Number(n).toLocaleString(CONFIG.locale || "es", {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      })
    );
  };

  // Un articulo con precio 0 se publica sin precio: se consulta por WhatsApp.
  const sinPrecio = (p) => !Number(p.precio);

  const escapar = (t) =>
    String(t).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  // Quita acentos y pasa a minusculas, para que el buscador sea tolerante.
  // Buscar "lampara" encuentra "Lámpara", y viceversa.
  const normalizar = (t) =>
    String(t).toLowerCase().normalize("NFD").split("").filter((c) => { const n = c.charCodeAt(0); return n < 0x300 || n > 0x36f; }).join("");

  const guardar = (clave, valor) => {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* modo privado */ }
  };
  const leer = (clave, porDefecto) => {
    try {
      const v = localStorage.getItem(clave);
      return v ? JSON.parse(v) : porDefecto;
    } catch (e) { return porDefecto; }
  };

  const catNombre = (id) => (CATEGORIAS.find((c) => c.id === id) || {}).nombre || "Varios";
  const catIcono = (id) => (CATEGORIAS.find((c) => c.id === id) || {}).icono || "✨";

  /* ------------------------------------------------------------------ SVG */

  const ICO = {
    carrito: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    lupa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35M12 2a10 10 0 0 0-8.53 15.26L2 22l4.85-1.42A10 10 0 1 0 12 2m0 1.67a8.32 8.32 0 0 1 6.6 13.4 8.32 8.32 0 0 1-11.9 1.16l-.35-.28-2.87.84.85-2.8-.3-.36A8.32 8.32 0 0 1 12 3.67"/></svg>',
    mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
    sol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    luna: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8"/></svg>',
    camion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    escudo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
    etiqueta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/></svg>',
    caja: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8"/><rect x="1" y="3" width="22" height="5" rx="1"/><path d="M10 12h4"/></svg>',
    tarjeta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></svg>',
    grupo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    reloj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    sobre: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    ig: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    fb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.8a5 5 0 0 1-1-1.8V3.5h-2.8v11.2a2.7 2.7 0 1 1-1.9-2.6V9.2a5.6 5.6 0 1 0 4.7 5.5V9a7.8 7.8 0 0 0 4.5 1.4V7.6a4.6 4.6 0 0 1-3.5-1.8"/></svg>',
  };

  /* -------------------------------------------------------------- Estado */

  let filtroCategoria = "todos";
  let filtroTexto = "";
  let orden = "relevancia";
  let soloOfertas = false;
  let visibles = 12;

  let carrito = leer("co_carrito", []);
  let productoAbierto = null;
  let cantidadModal = 1;

  /* ------------------------------------------------ Datos del negocio en HTML */

  function pintarDatosNegocio() {
    document.title = CONFIG.nombre + " | " + CONFIG.eslogan;
    $$("[data-campo]").forEach((el) => {
      const valor = CONFIG[el.dataset.campo];
      if (valor) el.textContent = valor;
    });

    const partes = CONFIG.nombre.trim().split(" ");
    $("#logoNombre").innerHTML =
      escapar(partes[0]) + (partes[1] ? " <em>" + escapar(partes.slice(1).join(" ")) + "</em>" : "");

    // Si existe el archivo de logo, sustituye al dibujo y al texto de respaldo.
    if (CONFIG.logo) {
      const img = $("#logoImg");
      img.alt = CONFIG.nombre;
      img.addEventListener("load", () => {
        img.classList.remove("oculto");
        $("#logoSvg").classList.add("oculto");
        img.closest(".logo").classList.add("tiene-logo");
      });
      img.src = CONFIG.logo;
    }

    // Enlaces de redes
    const redes = $("#redes");
    const mapa = [
      ["instagram", "Instagram", ICO.ig],
      ["facebook", "Facebook", ICO.fb],
      ["tiktok", "TikTok", ICO.tiktok],
    ];
    redes.innerHTML = mapa
      .filter(([k]) => CONFIG[k])
      .map(
        ([k, nom, ico]) =>
          '<a class="red" href="' + escapar(CONFIG[k]) +
          '" target="_blank" rel="noopener" title="' + nom + '" aria-label="' + nom + '">' + ico + "</a>"
      )
      .join("");

    // WhatsApp
    const wa = "https://wa.me/" + CONFIG.whatsapp;
    $$("[data-wa]").forEach((a) => {
      a.href = wa + "?text=" + encodeURIComponent("Hola " + CONFIG.nombre + ", quisiera informacion sobre sus productos.");
    });

    // Boton del grupo de WhatsApp: solo aparece si hay enlace configurado.
    const grupo = $("#btnGrupo");
    if (CONFIG.grupoWhatsapp) {
      grupo.href = CONFIG.grupoWhatsapp;
      grupo.classList.remove("oculto");
    }

    // Aviso de que falta configurar el numero real.
    const digitos = String(CONFIG.whatsapp || "").replace(/\D/g, "");
    if (digitos.length < 10 || /^0+$/.test(digitos.slice(3))) {
      console.warn(
        "Compas Outlet: el numero de WhatsApp en js/config.js todavia es el de ejemplo. " +
        "Los pedidos no llegaran a ningun lado hasta que lo cambies."
      );
    }

    $("#anio").textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------ Categorias */

  function pintarCategorias() {
    const cont = $("#categorias");
    cont.innerHTML = CATEGORIAS.map((c) => {
      const n = PRODUCTOS.filter((p) => p.categoria === c.id).length;
      return (
        '<a class="categoria" href="#catalogo" data-cat="' + c.id + '">' +
        '<div class="categoria__emoji">' + c.icono + "</div>" +
        '<span class="categoria__nombre">' + escapar(c.nombre) + "</span>" +
        '<span class="categoria__conteo">' + n + (n === 1 ? " articulo" : " articulos") + "</span>" +
        "</a>"
      );
    }).join("");

    cont.addEventListener("click", (e) => {
      const a = e.target.closest("[data-cat]");
      if (!a) return;
      filtroCategoria = a.dataset.cat;
      visibles = 12;
      sincronizarChips();
      pintarCatalogo();
    });

    // Chips de filtro
    const chips = $("#chips");
    chips.innerHTML =
      '<button class="chip" data-chip="todos" aria-pressed="true">Todos</button>' +
      CATEGORIAS.map(
        (c) =>
          '<button class="chip" data-chip="' + c.id + '" aria-pressed="false">' +
          c.icono + " " + escapar(c.nombre) + "</button>"
      ).join("");

    chips.addEventListener("click", (e) => {
      const b = e.target.closest("[data-chip]");
      if (!b) return;
      filtroCategoria = b.dataset.chip;
      visibles = 12;
      sincronizarChips();
      pintarCatalogo();
    });
  }

  function sincronizarChips() {
    $$("#chips .chip").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.chip === filtroCategoria))
    );
  }

  /* -------------------------------------------------------------- Catalogo */

  function filtrar() {
    const q = normalizar(filtroTexto.trim());
    let lista = PRODUCTOS.filter((p) => {
      if (filtroCategoria !== "todos" && p.categoria !== filtroCategoria) return false;
      if (soloOfertas && !(p.precioAntes > p.precio)) return false;
      if (!q) return true;
      const heno = normalizar(
        [p.nombre, p.descripcion, catNombre(p.categoria), (p.etiquetas || []).join(" ")].join(" ")
      );
      return q.split(/\s+/).every((palabra) => heno.includes(palabra));
    });

    const ordenadores = {
      relevancia: (a, b) => (b.destacado === true) - (a.destacado === true) || a.id - b.id,
      precioAsc: (a, b) => a.precio - b.precio,
      precioDesc: (a, b) => b.precio - a.precio,
      nombre: (a, b) => a.nombre.localeCompare(b.nombre, "es"),
      descuento: (a, b) => descuento(b) - descuento(a),
    };
    return lista.sort(ordenadores[orden] || ordenadores.relevancia);
  }

  const descuento = (p) =>
    !sinPrecio(p) && p.precioAntes > p.precio
      ? Math.round((1 - p.precio / p.precioAntes) * 100)
      : 0;

  // Marcador que se muestra cuando no hay foto o la ruta esta mal escrita.
  function marcador(p, texto) {
    return (
      '<div class="sin-foto"><span>' + catIcono(p.categoria) +
      "</span><span>" + texto + "</span></div>"
    );
  }

  // Si la imagen no carga, se reemplaza por el marcador en vez de dejar el
  // icono roto del navegador.
  window.__coFotoFallo = function (img) {
    const p = PRODUCTOS.find((x) => x.id === Number(img.dataset.pid));
    img.parentNode.insertAdjacentHTML(
      "afterbegin",
      marcador(p || { categoria: "otros" }, "Foto no encontrada")
    );
    img.remove();
  };

  function figura(p) {
    if (p.imagen) {
      return (
        '<img src="' + escapar(p.imagen) + '" alt="' + escapar(p.nombre) +
        '" data-pid="' + p.id + '" loading="lazy" onerror="__coFotoFallo(this)">'
      );
    }
    return marcador(p, "Agrega una foto");
  }

  function tarjeta(p) {
    const desc = descuento(p);
    const agotado = Number(p.stock) <= 0;
    const consultar = sinPrecio(p);

    let insignias = "";
    if (desc > 0) insignias += '<span class="insignia insignia--oferta">-' + desc + "%</span>";
    if (p.destacado) insignias += '<span class="insignia insignia--nuevo">Destacado</span>';
    if (!agotado && !consultar && p.stock <= 3)
      insignias += '<span class="insignia insignia--pocas">Ultimas ' + p.stock + "</span>";

    // Precio publicado, o invitacion a consultar cuando vale 0.
    const bloquePrecio = consultar
      ? '<div class="precios"><span class="precio precio--consultar">Consultar precio</span></div>'
      : '<div class="precios">' +
          '<span class="precio">' + precio(p.precio) + "</span>" +
          (desc > 0 ? '<span class="precio-antes">' + precio(p.precioAntes) + "</span>" : "") +
        "</div>" +
        (desc > 0 ? '<span class="ahorro">Ahorras ' + precio(p.precioAntes - p.precio) + "</span>" : "");

    // Sin precio no se puede sumar al carrito: se pregunta por WhatsApp.
    const boton = agotado
      ? '<button class="btn-agregar" disabled>Sin existencias</button>'
      : consultar
      ? '<a class="btn-agregar btn-agregar--consultar" href="' + waConsulta(p) +
        '" target="_blank" rel="noopener">' + ICO.wa + " Consultar</a>"
      : '<button class="btn-agregar" data-agregar="' + p.id + '">' + ICO.carrito + " Agregar</button>";

    return (
      '<article class="tarjeta">' +
        '<div class="tarjeta__figura" data-ver="' + p.id + '">' +
          figura(p) +
          '<div class="insignias">' + insignias + "</div>" +
          (agotado ? '<div class="agotado-capa">AGOTADO</div>' : "") +
        "</div>" +
        '<div class="tarjeta__cuerpo">' +
          '<span class="tarjeta__cat">' + escapar(catNombre(p.categoria)) + "</span>" +
          '<h3 class="tarjeta__nombre" data-ver="' + p.id + '">' + escapar(p.nombre) + "</h3>" +
          bloquePrecio +
          '<div class="tarjeta__pie">' + boton + "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function pintarCatalogo() {
    const lista = filtrar();
    const rejilla = $("#rejilla");

    $("#resumen").innerHTML =
      lista.length === 0
        ? "Sin resultados"
        : "Mostrando <strong>" + Math.min(visibles, lista.length) + "</strong> de <strong>" +
          lista.length + "</strong> " + (lista.length === 1 ? "articulo" : "articulos");

    if (lista.length === 0) {
      rejilla.innerHTML =
        '<div class="vacio"><span>\u{1F50D}</span><h3>No encontramos nada con esos filtros</h3>' +
        "<p>Prueba con otra palabra o mira todas las categorias.</p>" +
        '<button class="btn btn--claro" id="limpiar">Ver todo el catalogo</button></div>';
      $("#limpiar").addEventListener("click", limpiarFiltros);
      $("#verMas").classList.add("oculto");
      return;
    }

    rejilla.innerHTML = lista.slice(0, visibles).map(tarjeta).join("");
    $("#verMas").classList.toggle("oculto", visibles >= lista.length);
  }

  function limpiarFiltros() {
    filtroCategoria = "todos";
    filtroTexto = "";
    soloOfertas = false;
    visibles = 12;
    $("#busqueda").value = "";
    $("#ofertas").checked = false;
    sincronizarChips();
    pintarCatalogo();
  }

  /* ------------------------------------------------------------ Destacados */

  function pintarDestacados() {
    const dest = PRODUCTOS.filter((p) => p.destacado).slice(0, 4);
    if (!dest.length) {
      $("#seccionDestacados").classList.add("oculto");
      return;
    }
    $("#destacados").innerHTML = dest.map(tarjeta).join("");
  }

  /* ----------------------------------------------------------- Modal ficha */

  function abrirFicha(id) {
    const p = PRODUCTOS.find((x) => x.id === Number(id));
    if (!p) return;
    productoAbierto = p;
    cantidadModal = 1;

    const desc = descuento(p);
    const agotado = Number(p.stock) <= 0;
    const consultar = sinPrecio(p);

    const bloquePrecio = consultar
      ? '<div class="precios"><span class="precio precio--consultar" style="font-size:19px">' +
        "Consultar precio</span></div>"
      : '<div class="precios">' +
          '<span class="precio" style="font-size:27px">' + precio(p.precio) + "</span>" +
          (desc > 0 ? '<span class="precio-antes">' + precio(p.precioAntes) + "</span>" : "") +
        "</div>";

    // Solo se puede sumar al pedido lo que tiene precio y existencias.
    const acciones = agotado
      ? '<a class="btn btn--wa btn--bloque" href="' + waConsulta(p) + '" target="_blank" rel="noopener">' +
        ICO.wa + " Consultar disponibilidad</a>"
      : consultar
      ? '<a class="btn btn--wa btn--bloque" href="' + waConsulta(p) + '" target="_blank" rel="noopener">' +
        ICO.wa + " Pedir precio por WhatsApp</a>"
      : '<button class="btn btn--primario btn--bloque" id="agregarModal">' + ICO.carrito + " Agregar al pedido</button>" +
        '<a class="btn btn--wa btn--bloque" href="' + waConsulta(p) + '" target="_blank" rel="noopener">' +
        ICO.wa + " Preguntar por WhatsApp</a>";

    $("#modalCuerpo").innerHTML =
      '<div class="detalle">' +
        '<div class="detalle__figura">' + figura(p) +
          '<div class="insignias">' +
            (desc > 0 ? '<span class="insignia insignia--oferta">-' + desc + "%</span>" : "") +
          "</div>" +
          (agotado ? '<div class="agotado-capa">AGOTADO</div>' : "") +
        "</div>" +
        '<div class="detalle__info">' +
          '<span class="tarjeta__cat">' + escapar(catNombre(p.categoria)) + "</span>" +
          "<h2>" + escapar(p.nombre) + "</h2>" +
          bloquePrecio +
          '<p class="detalle__desc">' + escapar(p.descripcion || "Consultanos por mas detalles de este articulo.") + "</p>" +
          '<p class="dato-stock' + (agotado ? " agotado" : "") + '">' +
            (agotado
              ? "Estado: <strong>Agotado</strong> — escribenos y te avisamos cuando vuelva."
              : "Disponibilidad: <strong>" + p.stock + " en existencia</strong>") +
          "</p>" +
          (agotado || consultar
            ? ""
            : '<div class="cantidad"><button data-cant="-1">−</button><span id="cantValor">1</span><button data-cant="1">+</button></div>') +
          '<div class="detalle__acciones">' + acciones + "</div>" +
        "</div>" +
      "</div>";

    $("#modal").classList.remove("oculto");
    document.body.style.overflow = "hidden";
  }

  function waConsulta(p) {
    const txt = sinPrecio(p)
      ? "Hola " + CONFIG.nombre + ", me interesa este articulo:\n\n" +
        "* " + p.nombre + "\n\n" +
        "Cual es el precio y esta disponible?"
      : "Hola " + CONFIG.nombre + ", me interesa este articulo:\n\n" +
        "* " + p.nombre + "\n" +
        "* Precio: " + precio(p.precio) + "\n\n" +
        "Esta disponible?";
    return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(txt);
  }

  function cerrarFicha() {
    $("#modal").classList.add("oculto");
    document.body.style.overflow = "";
    productoAbierto = null;
  }

  /* -------------------------------------------------------------- Carrito */

  function agregar(id, cant) {
    const p = PRODUCTOS.find((x) => x.id === Number(id));
    // Sin existencias o sin precio publicado no entra al carrito.
    if (!p || p.stock <= 0 || sinPrecio(p)) return;

    const linea = carrito.find((l) => l.id === p.id);
    const nuevaCant = (linea ? linea.cantidad : 0) + (cant || 1);

    if (nuevaCant > p.stock) {
      avisar("Solo quedan " + p.stock + " unidades de " + p.nombre);
      if (linea) linea.cantidad = p.stock;
      else carrito.push({ id: p.id, cantidad: p.stock });
    } else if (linea) {
      linea.cantidad = nuevaCant;
      avisar(p.nombre + " actualizado en el pedido");
    } else {
      carrito.push({ id: p.id, cantidad: cant || 1 });
      avisar(p.nombre + " agregado al pedido");
    }

    persistir();
  }

  function cambiarCantidad(id, delta) {
    const linea = carrito.find((l) => l.id === Number(id));
    if (!linea) return;
    const p = PRODUCTOS.find((x) => x.id === Number(id));
    linea.cantidad += delta;
    if (linea.cantidad < 1) return quitar(id);
    if (p && linea.cantidad > p.stock) {
      linea.cantidad = p.stock;
      avisar("Solo quedan " + p.stock + " unidades");
    }
    persistir();
  }

  function quitar(id) {
    carrito = carrito.filter((l) => l.id !== Number(id));
    persistir();
  }

  function lineasResueltas() {
    return carrito
      .map((l) => {
        const p = PRODUCTOS.find((x) => x.id === l.id);
        return p ? { producto: p, cantidad: l.cantidad, subtotal: p.precio * l.cantidad } : null;
      })
      .filter(Boolean);
  }

  function persistir() {
    // Descarta lineas de productos que ya no existen en el catalogo.
    carrito = carrito.filter((l) => PRODUCTOS.some((p) => p.id === l.id));
    guardar("co_carrito", carrito);
    pintarCarrito();
  }

  function pintarCarrito() {
    const lineas = lineasResueltas();
    const unidades = lineas.reduce((s, l) => s + l.cantidad, 0);
    const total = lineas.reduce((s, l) => s + l.subtotal, 0);
    const ahorroTotal = lineas.reduce(
      (s, l) => s + (l.producto.precioAntes > l.producto.precio
        ? (l.producto.precioAntes - l.producto.precio) * l.cantidad
        : 0),
      0
    );

    const contador = $("#contadorCarrito");
    contador.textContent = unidades;
    contador.classList.toggle("oculto", unidades === 0);

    const lista = $("#carritoLista");
    if (!lineas.length) {
      lista.innerHTML =
        '<div class="vacio"><span>\u{1F6D2}</span><h3>Tu pedido esta vacio</h3>' +
        "<p>Agrega articulos del catalogo y los envias por WhatsApp.</p></div>";
      $("#carritoPie").classList.add("oculto");
      return;
    }

    $("#carritoPie").classList.remove("oculto");
    lista.innerHTML = lineas
      .map(
        (l) =>
          '<div class="linea">' +
            '<div class="linea__foto">' +
              (l.producto.imagen
                ? '<img src="' + escapar(l.producto.imagen) + '" alt="">'
                : catIcono(l.producto.categoria)) +
            "</div>" +
            "<div>" +
              '<p class="linea__nombre">' + escapar(l.producto.nombre) + "</p>" +
              '<p class="linea__precio">' + precio(l.producto.precio) + " c/u</p>" +
              '<div class="linea__ctrl">' +
                '<button data-menos="' + l.producto.id + '" aria-label="Quitar uno">−</button>' +
                "<span>" + l.cantidad + "</span>" +
                '<button data-mas="' + l.producto.id + '" aria-label="Agregar uno">+</button>' +
              "</div>" +
            "</div>" +
            "<div style=\"text-align:right\">" +
              '<div class="linea__total">' + precio(l.subtotal) + "</div>" +
              '<button class="linea__quitar" data-quitar="' + l.producto.id + '">Quitar</button>' +
            "</div>" +
          "</div>"
      )
      .join("");

    $("#totalUnidades").textContent = unidades + (unidades === 1 ? " articulo" : " articulos");
    $("#totalMonto").textContent = precio(total);
    const filaAhorro = $("#filaAhorro");
    filaAhorro.classList.toggle("oculto", ahorroTotal <= 0);
    $("#totalAhorro").textContent = "− " + precio(ahorroTotal);
  }

  function abrirCarrito() {
    $("#panelCarrito").classList.remove("oculto");
    document.body.style.overflow = "hidden";
  }
  function cerrarCarrito() {
    $("#panelCarrito").classList.add("oculto");
    document.body.style.overflow = "";
  }

  function enviarPedido() {
    const lineas = lineasResueltas();
    if (!lineas.length) return;

    const total = lineas.reduce((s, l) => s + l.subtotal, 0);
    let txt = "*NUEVO PEDIDO - " + CONFIG.nombre + "*\n\n";
    lineas.forEach((l, i) => {
      txt += (i + 1) + ". " + l.producto.nombre + "\n";
      txt += "   " + l.cantidad + " x " + precio(l.producto.precio) + " = " + precio(l.subtotal) + "\n";
    });
    txt += "\n*TOTAL: " + precio(total) + "*\n\n";
    txt += "Quedo atento para coordinar el pago y la entrega.";

    window.open("https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(txt), "_blank");
  }

  /* ----------------------------------------------------------------- Aviso */

  let brindisTimer = null;
  function avisar(mensaje) {
    let el = $("#brindis");
    if (!el) {
      el = document.createElement("div");
      el.id = "brindis";
      el.className = "brindis";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = mensaje;
    el.classList.remove("oculto");
    clearTimeout(brindisTimer);
    brindisTimer = setTimeout(() => el.classList.add("oculto"), 2600);
  }

  /* ------------------------------------------------------------------ Tema */

  function aplicarTema(tema, recordar) {
    document.documentElement.dataset.tema = tema;
    if (recordar !== false) guardar("co_tema", tema);
    $("#btnTema").innerHTML = tema === "oscuro" ? ICO.sol : ICO.luna;
  }

  // La primera visita sigue el modo del sistema; despues manda lo que
  // el visitante haya elegido con el boton.
  function temaInicial() {
    const elegido = leer("co_tema", null);
    if (elegido) return { tema: elegido, recordar: true };
    const oscuroEnSistema =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return { tema: oscuroEnSistema ? "oscuro" : "claro", recordar: false };
  }

  /* ------------------------------------------------------------- Arranque */

  function iconosEstaticos() {
    $("#btnCarrito").insertAdjacentHTML("afterbegin", ICO.carrito);
    $("#btnMenu").innerHTML = ICO.menu;
    $("#icoBuscar").innerHTML = ICO.lupa;
    $$("[data-ico]").forEach((el) => {
      const ico = ICO[el.dataset.ico];
      if (ico) el.innerHTML = ico;
    });
  }

  function eventos() {
    // Delegacion global de clicks
    document.addEventListener("click", (e) => {
      const ver = e.target.closest("[data-ver]");
      if (ver) return abrirFicha(ver.dataset.ver);

      const add = e.target.closest("[data-agregar]");
      if (add) return agregar(add.dataset.agregar, 1);

      const mas = e.target.closest("[data-mas]");
      if (mas) return cambiarCantidad(mas.dataset.mas, 1);

      const menos = e.target.closest("[data-menos]");
      if (menos) return cambiarCantidad(menos.dataset.menos, -1);

      const quit = e.target.closest("[data-quitar]");
      if (quit) return quitar(quit.dataset.quitar);

      const cant = e.target.closest("[data-cant]");
      if (cant && productoAbierto) {
        cantidadModal = Math.min(
          Math.max(1, cantidadModal + Number(cant.dataset.cant)),
          productoAbierto.stock
        );
        $("#cantValor").textContent = cantidadModal;
        return;
      }

      if (e.target.closest("#agregarModal") && productoAbierto) {
        agregar(productoAbierto.id, cantidadModal);
        cerrarFicha();
        abrirCarrito();
      }
    });

    // Buscador
    $("#busqueda").addEventListener("input", (e) => {
      filtroTexto = e.target.value;
      visibles = 12;
      pintarCatalogo();
    });

    // Orden
    $("#orden").addEventListener("change", (e) => {
      orden = e.target.value;
      pintarCatalogo();
    });

    // Solo ofertas
    $("#ofertas").addEventListener("change", (e) => {
      soloOfertas = e.target.checked;
      visibles = 12;
      pintarCatalogo();
    });

    // Ver mas
    $("#verMas").addEventListener("click", () => {
      visibles += 12;
      pintarCatalogo();
    });

    // Modal
    $("#modalCerrar").addEventListener("click", cerrarFicha);
    $("#modal").addEventListener("click", (e) => {
      if (e.target.id === "modal") cerrarFicha();
    });

    // Carrito
    $("#btnCarrito").addEventListener("click", abrirCarrito);
    $("#carritoCerrar").addEventListener("click", cerrarCarrito);
    $("#carritoVelo").addEventListener("click", cerrarCarrito);
    $("#btnEnviarPedido").addEventListener("click", enviarPedido);
    $("#btnVaciar").addEventListener("click", () => {
      if (carrito.length && confirm("Vaciar todo el pedido?")) {
        carrito = [];
        persistir();
      }
    });

    // Menu movil
    $("#btnMenu").addEventListener("click", () => $("#nav").classList.toggle("abierto"));
    $("#nav").addEventListener("click", (e) => {
      if (e.target.tagName === "A") $("#nav").classList.remove("abierto");
    });

    // Tema
    $("#btnTema").addEventListener("click", () => {
      aplicarTema(document.documentElement.dataset.tema === "oscuro" ? "claro" : "oscuro");
    });

    // Escape cierra
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!$("#modal").classList.contains("oculto")) cerrarFicha();
      else if (!$("#panelCarrito").classList.contains("oculto")) cerrarCarrito();
    });
  }

  function iniciar() {
    const t = temaInicial();
    aplicarTema(t.tema, t.recordar);
    iconosEstaticos();
    pintarDatosNegocio();
    pintarCategorias();
    pintarDestacados();
    pintarCatalogo();
    persistir();
    eventos();

    $("#totalProductos").textContent = PRODUCTOS.length;
    $("#totalCategorias").textContent = CATEGORIAS.length;
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
