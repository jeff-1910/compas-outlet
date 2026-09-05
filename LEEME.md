# Compas Outlet — página web

Catálogo online de la tienda. Los Compas arman su pedido y te lo envían por
WhatsApp con un toque.

**Para abrirla:** doble clic en `index.html`. No necesita internet ni instalar nada.

---

## Lo que falta completar

Tu WhatsApp ya está puesto: **+506 7009 0544**. Todos los botones de la página
escriben a ese número. Si algún dígito está mal, cámbialo en `js/config.js`,
en el campo `whatsapp` (va como `50670090544`: el 506 pegado y sin espacios).

Quedan estos campos en `js/config.js`, marcados `<-- REVISAR`:

| Campo | Qué falta |
|---|---|
| `grupoWhatsapp` | El enlace de tu grupo (el de tu bio de Instagram). En la captura salía cortado: `chat.whatsapp.com/HyBRK7wvDPTB1DnM3Sto…`. Pégalo completo y aparece el botón "Unirme al grupo de ofertas" |
| `direccion` | Tu ubicación o zona de entrega |
| `horario` | Tus horas de atención |
| `notaEnvio` | Cómo manejas las entregas |

Ninguno impide usar la página: son solo textos que ahora salen genéricos.

### Tu logo

Ya está puesto, en `img/logo.jpg`. Le recorté el marco blanco que traía
(ocupaba el 64% de la altura) y lo reduje a 600 px de ancho, así que pesa
24 KB en vez de 48 KB y se lee bien en el encabezado.

Como el logo ya dice «COMPAS Outlet», la página oculta el texto del nombre que
iba al lado para no repetirlo. Va sobre una placa blanca redondeada, para que
también se vea bien en modo oscuro.

Si algún día cambias de logo: reemplaza `img/logo.jpg` (o pon otro nombre y
actualiza el campo `logo` en `js/config.js`). Que venga sin marco blanco de
sobra y en horizontal.

---

## Lo que ya está puesto

- Nombre, eslogan y descripción sacados de tu bio de Instagram
- Colores tomados de tu logo: rojo `#ce1126` y azul `#0f2a66`
- Enlaces a `@compasoutlet` y a tu Facebook
- Precios en colones, con formato `₡85.000`
- Las tres cosas que anuncias en tus destacados de Instagram: **WhatsApp**,
  **Apartados** y **Métodos de pago**
- Categorías pensadas para lo que vendes: Muebles, Decoración, Hogar y Cocina,
  Organización, Seguridad y Varios

---

## Cargar tus artículos

Ahora hay **3 artículos**, sacados de las fotos de tu Instagram (la butaca, la
caja fuerte y el librero hexagonal). Les faltan los nombres exactos y los
precios. Tienes 54 publicaciones más por subir.

### Opción A — con formulario (recomendada)

1. Abre **`admin.html`**.
2. Llena el formulario y pulsa *Guardar artículo*. Repite con cada producto.
3. Cuando termines, pulsa **«Descargar productos.js»**.
4. Mueve el archivo descargado a la carpeta `js/`, reemplazando el que está ahí.
5. Recarga `index.html`.

Los cambios se guardan solos en el navegador mientras trabajas, así que puedes
cerrar y seguir después. Pero **hasta que no descargues el archivo y lo
reemplaces, la tienda sigue mostrando lo anterior**.

Consejos para cargar muchos de una vez:

- La categoría se queda puesta después de guardar, y el cursor vuelve al campo
  del nombre. Así puedes meter todos los muebles seguidos sin volver a
  elegir "Muebles" cada vez.
- Ve descargando `productos.js` cada 10 o 15 artículos, no solo al final. Si se
  borran los datos del navegador, pierdes lo que no hayas descargado.
- Los 3 artículos de ejemplo (butaca, caja fuerte, librero) los puedes editar
  con sus datos reales o borrarlos y empezar de cero. La página funciona igual
  con el catálogo vacío.

### Opción B — a mano

Abre `js/productos.js` y copia un bloque, cambiando los valores:

```js
{
  id: 4,                            // número único, no repetir
  nombre: "Juego de comedor 6 sillas",
  categoria: "muebles",             // muebles, decoracion, hogar,
                                    // organizacion, seguridad, otros
  precio: 325000,                   // 0 = muestra "Consultar precio"
  precioAntes: 420000,              // 0 si no está en oferta
  imagen: "img/comedor.jpg",        // "" si todavía no tienes foto
  descripcion: "Mesa en madera sólida con 6 sillas tapizadas.",
  stock: 2,                         // 0 = se muestra AGOTADO
  destacado: true,                  // true = sale en la portada
  etiquetas: ["comedor", "mesa", "sillas"],
},
```

### Artículos sin precio publicado

Si pones `precio: 0`, la tarjeta muestra **«Consultar precio»** y el botón se
vuelve verde: «Consultar». Al pulsarlo se abre WhatsApp con el nombre del
artículo ya escrito. Útil cuando el precio depende del estado de la pieza o
prefieres cotizar en privado. Esos artículos no entran al carrito.

---

## Las fotos

1. Copia las fotos dentro de la carpeta **`img/`**.
2. En el campo *imagen* escribe `img/` + el nombre exacto del archivo.

Consejos:
- Nombres sin espacios ni acentos: `butaca-cuero.jpg`, no `Butaca de Cuero.JPG`.
- Cuadradas (1:1) se ven mejor en la cuadrícula.
- Menos de 300 KB cada una, para que cargue rápido.
- Si no pones foto, sale un recuadro con el ícono de la categoría. No se rompe nada.

---

## Qué trae la página

- Buscador tolerante a acentos: «sillon» encuentra «Sillón»
- Filtro por categoría, filtro de solo ofertas y 5 formas de ordenar
- Ficha de cada artículo con foto grande, descripción y disponibilidad
- Carrito que se guarda aunque el Compa cierre la página
- Pedido completo enviado por WhatsApp, ya formateado con cantidades y total
- Etiquetas automáticas: `-29%`, `Destacado`, `Últimas 3`, `AGOTADO`
- Modo claro y oscuro
- Se adapta a teléfono, tablet y computadora
- Botón flotante de WhatsApp

---

## Publicarla en internet (gratis)

Cuando ya tengas tus productos cargados:

1. Entra a [netlify.com/drop](https://app.netlify.com/drop)
2. Arrastra la carpeta **`pagina weeb`** completa a esa página.
3. Te da un enlace público al instante. Ese es el que pones en la biografía de
   Instagram y Facebook, en lugar del enlace del grupo (o junto a él).

Para actualizar el catálogo después, vuelves a arrastrar la carpeta.

---

## Estructura de archivos

```
pagina weeb/
├── index.html         La tienda
├── admin.html         Panel para cargar artículos
├── css/
│   └── estilos.css    Colores y diseño
├── js/
│   ├── config.js      ← tus datos (WhatsApp, redes, moneda)
│   ├── productos.js   ← tu catálogo
│   ├── tienda.js      Funcionamiento de la tienda
│   └── admin.js       Funcionamiento del panel
└── img/               ← tu logo.png y las fotos de los productos
```
