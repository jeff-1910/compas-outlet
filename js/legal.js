/* =========================================================================
   DATOS LEGALES DEL NEGOCIO
   -------------------------------------------------------------------------
   Este es el UNICO archivo que hay que tocar para las paginas legales
   (privacidad, terminos, cookies y devoluciones) y para el pie de la tienda.

   Lo que escribas aqui aparece solo en las paginas. Lo que dejes en ""
   simplemente NO se muestra: la pagina no inventa nada ni queda con un
   hueco raro. Por eso es mejor dejar vacio lo que todavia no sabes que
   poner algo aproximado.

   Las lineas con  <-- FALTA  son las que Jeff tiene que completar.
   ========================================================================= */

const CO_LEGAL = {
  /* ---------------------------------------------------- Quien vende ----- */

  // Como se llama el negocio de cara al publico.
  nombreComercial: "Compas Outlet",

  // El nombre legal: tu nombre completo si vendes como persona fisica, o el
  // nombre de la sociedad si esta a nombre de una empresa.
  razonSocial: "Jefferson Pérez Vargas",

  // Cedula fisica o juridica. La ley del consumidor (7472) pide que el que
  // vende se pueda identificar. Sin esto, si un Compa reclama, el negocio
  // queda como "no identificado".
  cedula: "4-0240-0603",

  // Direccion fisica donde opera el negocio (provincia, canton, distrito y
  // una sena). No hace falta la casa exacta si vendes desde tu casa, pero
  // si al menos el canton.
  direccion: "Heredia, San Francisco, Santa Cecilia, calle La Deportiva, 300 m sur de Taco Bell",
  pais: "Costa Rica",

  /* ------------------------------------------------------- Contacto ----- */

  email: "compasoutlet@gmail.com",

  // WhatsApp del equipo: es el que atiende ventas, reclamos y devoluciones.
  whatsappEquipo: "50670090544",
  whatsappEquipoVisible: "+506 7009 0544",

  // WhatsApp del catalogo: lo contesta el asistente automatico.
  whatsappBot: "50670431317",
  whatsappBotVisible: "+506 7043 1317",

  /* -------------------------------------------------- Como se vende ----- */

  // Si los precios publicados ya llevan el IVA del 13% incluido.
  // En Costa Rica el precio que ve el consumidor final debe ser el precio
  // final, con impuestos incluidos.
  ivaIncluido: true,

  // Dias de garantia que das. La ley pide un minimo de 30 dias naturales
  // desde la entrega. Podes dar mas, nunca menos.
  diasGarantia: 30,

  // Dias para arrepentirse de una compra hecha a distancia (sin haber visto
  // el articulo en persona). La ley 7472 da 8 dias habiles. Podes dar mas.
  diasRetracto: 8,

  // Fecha de la ultima revision de las paginas legales.
  actualizado: "24 de septiembre de 2026",
};

/* ---------------------------------------------------------------- Pintar */
/* Rellena los <span data-legal="campo"> de cualquier pagina que cargue este
   archivo. Si el campo esta vacio, borra el bloque [data-legal-si] entero,
   para que no quede una frase a medias. */

(function () {
  "use strict";

  function pintar() {
    document.querySelectorAll("[data-legal]").forEach(function (el) {
      var valor = CO_LEGAL[el.dataset.legal];
      if (valor === undefined || valor === null) valor = "";
      el.textContent = String(valor);
    });

    // Bloques que solo tienen sentido si el dato existe.
    document.querySelectorAll("[data-legal-si]").forEach(function (el) {
      var valor = CO_LEGAL[el.dataset.legalSi];
      if (!valor) el.remove();
    });

    // Enlaces de WhatsApp y correo.
    document.querySelectorAll("[data-legal-wa]").forEach(function (el) {
      el.href = "https://wa.me/" + CO_LEGAL.whatsappEquipo;
    });
    document.querySelectorAll("[data-legal-mail]").forEach(function (el) {
      el.href = "mailto:" + CO_LEGAL.email;
      if (!el.textContent.trim()) el.textContent = CO_LEGAL.email;
    });

    // El anio del pie se actualiza solo: nadie se va a acordar en enero.
    document.querySelectorAll("[data-legal-anio]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pintar);
  } else {
    pintar();
  }
})();
