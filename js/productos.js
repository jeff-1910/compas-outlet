/* =========================================================================
   CATALOGO DE PRODUCTOS - Compas Outlet
   -------------------------------------------------------------------------
   Cada producto es un bloque entre llaves { }, separado por comas.

   Campos:
     id          Numero unico (no repetir).
     nombre      Nombre del articulo.
     categoria   Debe coincidir con una de las de CATEGORIAS (abajo).
     precio      Precio de venta. Pon 0 y la pagina mostrara
                 "Consultar precio" con un boton de WhatsApp.
     precioAntes Precio tachado. Pon 0 si no esta en oferta.
     imagen      Ruta de la foto, ej: "img/butaca.jpg". Vacio = icono.
     descripcion Texto corto que se ve al abrir el producto.
     stock       Cantidad disponible. 0 = se muestra AGOTADO.
     destacado   true para que salga en "Destacados" de la portada.
     etiquetas   Palabras para el buscador. Ej: ["sala", "cuero"]

   -------------------------------------------------------------------------
   ESTADO ACTUAL: los 3 articulos de abajo salieron de las fotos de tu
   Instagram (@compasoutlet). Faltan los nombres exactos y los precios, por
   eso estan en 0 = "Consultar precio". Corrigelos y agrega el resto de tus
   publicaciones con admin.html.
   ========================================================================= */

const CATEGORIAS = [
  { id: "muebles",      nombre: "Muebles",      icono: "\u{1F6CB}\u{FE0F}" },
  { id: "hogar",        nombre: "Hogar",        icono: "\u{1F3E0}" },
  { id: "cocina",       nombre: "Cocina",       icono: "\u{1F373}" },
  { id: "electronicos", nombre: "Electronicos", icono: "\u{1F50C}" },
  { id: "ropa",         nombre: "Ropa",         icono: "\u{1F455}" },
  { id: "calzado",      nombre: "Calzado",      icono: "\u{1F45F}" },
  { id: "otros",        nombre: "Varios",       icono: "\u{2728}" },
];

const PRODUCTOS = [
  {
    id: 1,
    nombre: "Butaca de cuero capitoneada",
    categoria: "muebles",
    precio: 0,
    precioAntes: 0,
    imagen: "",
    descripcion:
      "Sillon individual en cuero sintetico negro con respaldo capitoneado y " +
      "patas de madera. Ideal para sala, recibidor u oficina.",
    stock: 1,
    destacado: true,
    etiquetas: ["butaca", "sillon", "cuero", "sala", "negro", "individual"],
  },
  {
    id: 2,
    nombre: "Caja fuerte con cerradura electronica",
    categoria: "hogar",
    precio: 0,
    precioAntes: 0,
    imagen: "",
    descripcion:
      "Gabinete de seguridad en acero con teclado electronico, estantes " +
      "internos y bolsillos organizadores en la puerta.",
    stock: 1,
    destacado: true,
    etiquetas: ["caja fuerte", "seguridad", "acero", "armero", "gabinete"],
  },
  {
    id: 3,
    nombre: "Librero hexagonal de pared",
    categoria: "muebles",
    precio: 0,
    precioAntes: 0,
    imagen: "",
    descripcion:
      "Estante decorativo en tono oscuro con nichos hexagonales. " +
      "Perfecto para libros, plantas y adornos.",
    stock: 1,
    destacado: true,
    etiquetas: ["librero", "estante", "repisa", "decoracion", "pared", "nichos"],
  },
];
