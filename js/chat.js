/* =========================================================================
   Burbuja de chat de la tienda.

   Habla con /api/chat, que es quien tiene la clave. Aqui nunca hay claves.
   Si el asistente no esta configurado, el boton no aparece y la tienda
   sigue funcionando igual.
   ========================================================================= */

(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };

  var abierto = false;
  var enviando = false;
  var historial = [];   // lo que se manda a la API
  var caja = null;

  var escapar = function (t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  // Convierte los enlaces en texto plano a enlaces reales, y respeta
  // los saltos de linea. Todo lo demas queda escapado.
  function comoHtml(texto) {
    return escapar(texto)
      .replace(/(https?:\/\/[^\s<]+)/g, function (u) {
        return '<a href="' + u + '" target="_blank" rel="noopener">' + u + "</a>";
      })
      .replace(/\n/g, "<br>");
  }

  var SALUDO =
    "¡Hola! Soy el asistente de " + (CONFIG.nombre || "la tienda") + ". " +
    "Contame qué buscás y te digo qué tenemos.";

  /* --------------------------------------------------------- Interfaz */

  function construir() {
    var html =
      '<button class="chat-burbuja" id="chatBurbuja" aria-label="Abrir el chat de la tienda">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z"/>' +
        "</svg>" +
      "</button>" +
      '<section class="chat-panel oculto" id="chatPanel" aria-label="Chat de la tienda">' +
        '<header class="chat-cabecera">' +
          '<div><strong>Asistente</strong><span>Te ayudo a encontrar lo que buscás</span></div>' +
          '<button id="chatCerrar" aria-label="Cerrar el chat">×</button>' +
        "</header>" +
        '<div class="chat-mensajes" id="chatMensajes" role="log" aria-live="polite"></div>' +
        '<form class="chat-pie" id="chatForm">' +
          '<input id="chatEntrada" type="text" autocomplete="off" ' +
          'placeholder="Escribí tu pregunta..." aria-label="Tu mensaje" maxlength="1500">' +
          '<button type="submit" id="chatEnviar" aria-label="Enviar">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>' +
          "</button>" +
        "</form>" +
      "</section>";

    var cont = document.createElement("div");
    cont.innerHTML = html;
    while (cont.firstChild) document.body.appendChild(cont.firstChild);
    caja = $("#chatMensajes");
  }

  function pintarMensaje(quien, texto) {
    var div = document.createElement("div");
    div.className = "chat-msg chat-msg--" + quien;
    div.innerHTML = comoHtml(texto);
    caja.appendChild(div);
    caja.scrollTop = caja.scrollHeight;
    return div;
  }

  function pintarEscribiendo() {
    var div = document.createElement("div");
    div.className = "chat-msg chat-msg--bot chat-escribiendo";
    div.innerHTML = "<span></span><span></span><span></span>";
    caja.appendChild(div);
    caja.scrollTop = caja.scrollHeight;
    return div;
  }

  function sugerencias() {
    var opciones = ["¿Qué tienen en oferta?", "Busco algo para la sala", "¿Cómo son los apartados?"];
    var cont = document.createElement("div");
    cont.className = "chat-sugerencias";
    cont.innerHTML = opciones.map(function (t) {
      return '<button type="button" data-sug="' + escapar(t) + '">' + escapar(t) + "</button>";
    }).join("");
    caja.appendChild(cont);
  }

  /* ---------------------------------------------------------- Envio */

  async function enviar(texto) {
    if (enviando || !texto.trim()) return;
    enviando = true;

    var sug = caja.querySelector(".chat-sugerencias");
    if (sug) sug.remove();

    pintarMensaje("yo", texto);
    historial.push({ role: "user", content: texto });

    $("#chatEntrada").value = "";
    $("#chatEnviar").disabled = true;
    var puntos = pintarEscribiendo();

    try {
      var r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: historial }),
      });
      var d = await r.json();
      puntos.remove();

      if (!r.ok) {
        pintarMensaje("bot", (d && d.error) ||
          "No pude responder ahora. Escribinos por WhatsApp y te atendemos.");
      } else {
        pintarMensaje("bot", d.respuesta);
        historial.push({ role: "assistant", content: d.respuesta });
      }
    } catch (e) {
      puntos.remove();
      pintarMensaje("bot", "Se me cayó la conexión. Revisá tu internet y probá de nuevo.");
    } finally {
      enviando = false;
      $("#chatEnviar").disabled = false;
      $("#chatEntrada").focus();
    }
  }

  function alternar() {
    abierto = !abierto;
    $("#chatPanel").classList.toggle("oculto", !abierto);
    $("#chatBurbuja").classList.toggle("chat-burbuja--abierta", abierto);
    if (abierto) {
      if (!caja.children.length) {
        pintarMensaje("bot", SALUDO);
        sugerencias();
      }
      setTimeout(function () { $("#chatEntrada").focus(); }, 100);
    }
  }

  /* ------------------------------------------------------- Arranque */

  async function iniciar() {
    // Si la funcion del servidor no responde, no mostramos nada: mejor sin
    // chat que con un boton que da error.
    try {
      var prueba = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      // 400 = viva pero sin mensajes (lo esperado). 503 = falta la clave.
      if (prueba.status === 503 || prueba.status === 404 || prueba.status === 405) return;
    } catch (e) {
      return;
    }

    construir();

    $("#chatBurbuja").addEventListener("click", alternar);
    $("#chatCerrar").addEventListener("click", alternar);
    $("#chatForm").addEventListener("submit", function (e) {
      e.preventDefault();
      enviar($("#chatEntrada").value);
    });
    caja.addEventListener("click", function (e) {
      var b = e.target.closest("[data-sug]");
      if (b) enviar(b.dataset.sug);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && abierto) alternar();
    });
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();
