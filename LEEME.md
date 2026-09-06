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
- Categorías pensadas para lo que vendes: Muebles, Hogar, Cocina,
  Electrónicos, Ropa, Calzado y Varios

---

## Cargar tus artículos

Ahora hay **3 artículos**, sacados de las fotos de tu Instagram (la butaca, la
caja fuerte y el librero hexagonal). Les faltan los nombres exactos y los
precios. Tienes 54 publicaciones más por subir.

### Opción A — el panel en línea (la buena)

Entrá desde el celular o cualquier computadora a:

**https://compas-outlet.vercel.app/panel.html**

Con tu correo y contraseña. Cargás el artículo, elegís la foto de la galería,
*Guardar artículo*, y aparece en la tienda **al instante**. Sin publicar nada,
sin ventanas negras.

> **Hay que activarlo una vez.** Seguí los 5 pasos de
> [PANEL-EN-LINEA.md](PANEL-EN-LINEA.md) — unos 15 minutos, y no se repite.

Consejos para cargar muchos seguidos:

- La categoría queda puesta después de guardar y el cursor vuelve al nombre.
- Las fotos se achican solas antes de subirse: una del celular de 4 MB queda
  liviana y la tienda no se pone lenta.
- Poné **0** en el precio y el artículo sale como «Consultar precio», con un
  botón de WhatsApp. Útil si todavía no lo definiste.
- Los 3 artículos de ejemplo los podés editar con datos reales o borrarlos.

### Opción B — el panel de la computadora (respaldo)

**Doble clic en «Panel Compas Outlet»** (el acceso directo del Escritorio).
Se abre una ventana negra y el navegador con el panel.

Este edita el archivo `js/productos.js` y hay que pulsar *Publicar en
internet* para que se vea. Queda como respaldo hasta confirmar que el panel en
línea funciona; después lo retiramos para no tener dos.

> **Ojo:** si abrís `admin.html` con doble clic, arranca en **modo solo
> lectura** y lo que edites no llega a la tienda. Entrá siempre por el acceso
> directo.

### Opción C — a mano en el archivo

(Solo aplica al catálogo local de respaldo, no al panel en línea.)

Abre `js/productos.js` y copia un bloque, cambiando los valores:

```js
{
  id: 4,                            // número único, no repetir
  nombre: "Juego de comedor 6 sillas",
  categoria: "muebles",             // muebles, hogar, cocina,
                                    // electronicos, ropa, calzado, otros
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

No tienes que hacer nada: eliges la foto y el panel la achica a 1200 px y la
comprime antes de guardarla. Una del celular de 4 MB queda en unos 200 KB.

- Desde el **panel en línea**, la foto se guarda en la nube y la tienda la
  toma de ahí.
- Desde el **panel de la computadora**, se guarda en la carpeta `img/`.

Consejos:
- Cuadradas (1:1) se ven mejor en la cuadrícula.
- Si no pones foto, sale un recuadro con el ícono de la categoría. No se rompe
  nada, así que puedes cargar el artículo ahora y ponerle la foto después.

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

## Tu página en internet

Ya está publicada en **https://compas-outlet.vercel.app**

Funciona así: tu carpeta está conectada a un repositorio en GitHub
(`github.com/jeff-1910/compas-outlet`), y Vercel vigila ese repositorio. Cada
vez que pulsas «Publicar en internet» en el panel, los cambios viajan a GitHub
y Vercel actualiza el sitio solo, en menos de un minuto.

No tienes que tocar nada de eso: el botón hace todo.

### Si quieres tu propio dominio

Algo como `compasoutlet.com` hay que comprarlo (unos 10–15 dólares al año en
Namecheap, Porkbun o Cloudflare). Después, en Vercel entras a
*Settings → Domains → Add*, escribes el dominio y Vercel te da unos registros
DNS que copias en el panel de donde lo compraste. El candado de seguridad
(HTTPS) lo pone Vercel gratis.

El `.vercel.app` que ya tienes es permanente y gratis, así que no hay apuro.

---

## Estructura de archivos

```
pagina weeb/
├── panel.html            El panel en línea (se abre desde internet)
├── PANEL-EN-LINEA.md     ← cómo activarlo, paso a paso
├── index.html            La tienda
├── supabase/
│   └── configuracion.sql El SQL a pegar en Supabase (una sola vez)
├── css/
│   └── estilos.css       Colores y diseño
├── js/
│   ├── config.js         ← tus datos (WhatsApp, redes, moneda, Supabase)
│   ├── datos.js          De dónde saca el catálogo la tienda
│   ├── panel.js          Funcionamiento del panel en línea
│   ├── productos.js      Catálogo de respaldo (si falla la conexión)
│   └── tienda.js         Funcionamiento de la tienda
├── img/                  Tu logo y las fotos del panel de la computadora
│
│   -- respaldo, hasta confirmar que el panel en línea anda --
├── administrar.cmd       Abre el panel de la computadora
├── admin.html            Ese panel (no lo abras directo)
├── servidor-admin.ps1    Su motor
└── publicar.cmd          Publicar sin abrir el panel
```

Lo que solo sirve en tu computadora no se publica en internet: lo excluye
`.vercelignore`. En tu sitio quedan la tienda y el panel en línea.
