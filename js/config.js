/* =========================================================================
   CONFIGURACION DE LA TIENDA
   -------------------------------------------------------------------------
   Cambia aqui los datos de tu negocio. Es el unico archivo que necesitas
   tocar para personalizar nombre, contacto y redes sociales.

   Las lineas marcadas con  <-- REVISAR  son suposiciones que hay que
   confirmar o corregir.
   ========================================================================= */

const CONFIG = {
  // --- Identidad ---
  nombre: "Compas Outlet",
  eslogan: "No son clientes, son nuestros Compas",
  descripcion:
    "Somos un Outlet y ustedes no son nuestros clientes, son nuestros Compas. " +
    "Muebles, hogar, cocina, electronicos, ropa, calzado y mucho mas, a precio de outlet.",

  // Logo. Tu logo, ya recortado y listo, en img/logo.jpg
  // Si el archivo no existe, se dibuja uno de respaldo automaticamente.
  logo: "img/logo.jpg",

  // --- Contacto ---
  // Numero de WhatsApp en formato internacional, SOLO digitos, sin + ni espacios.
  // Costa Rica: 506 + los 8 digitos.
  whatsapp: "50670090544",

  // Enlace de invitacion a tu grupo de WhatsApp (el de tu bio de Instagram).
  // En la captura salia cortado: "chat.whatsapp.com/HyBRK7wvDPTB1DnM3Sto..."
  // Pegalo completo aqui para que aparezca el boton del grupo.
  grupoWhatsapp: "",                                    // <-- REVISAR

  email: "",
  telefono: "+506 7009 0544",
  direccion: "Costa Rica",
  horario: "Escribenos por WhatsApp",                   // <-- REVISAR

  // --- Redes sociales (deja "" para ocultar el icono) ---
  instagram: "https://instagram.com/compasoutlet",
  facebook: "https://www.facebook.com/share/1BqqDjbWfL/",
  tiktok: "",

  // --- Moneda ---
  // Colon costarricense. Si trabajas en dolares, pon "$", decimales: 2
  // y locale: "es-CR" igual funciona.
  // --- Panel en linea (Supabase) ---
  // Con esto lleno, el catalogo se lee y se edita desde internet, y podes
  // administrar la tienda desde el celular. Si queda vacio, la tienda usa
  // el catalogo guardado en js/productos.js y todo sigue funcionando.
  //
  // Los dos valores salen de tu proyecto de Supabase:
  //   Project Settings -> API -> "Project URL" y "anon public"
  //
  // La clave "anon" es publica a proposito: sirve solo para LEER. Para
  // agregar o borrar hay que iniciar sesion con tu correo y contrasena.
  supabase: {
    url: "",       // ej: "https://abcdefgh.supabase.co"
    anonKey: "",   // la clave larga que dice "anon public"
  },

  simboloMoneda: "₡",   // el simbolo del colon
  decimales: 0,              // 0 para colones, 2 para dolares

  // Formato de numero. "es-ES" da 1.234,56 (punto de miles, coma decimal),
  // que es como se escriben los precios en Costa Rica.
  // Ojo: "es-CR" separa los miles con un espacio (85 000), se ve raro.
  locale: "es-ES",

  // --- Envios ---
  notaEnvio: "Coordinamos entrega por WhatsApp.",        // <-- REVISAR
};
