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

### Opción A — el panel (es la buena)

**Doble clic en `administrar.cmd`.**

Se abre una ventana negra (el motor del panel) y el navegador con el panel.
**No cierres la ventana negra** mientras trabajas: si la cierras, el panel deja
de poder guardar.

Dentro del panel:

1. Llenas el formulario y pulsas *Guardar artículo*. Repites con cada producto.
2. Cuando termines la tanda, pulsas **«Guardar en la tienda»** — ahí se
   escriben de verdad en tu página.
3. *Ver tienda* para revisar cómo quedó.
4. **«Publicar en internet»** y en menos de un minuto está en
   `compas-outlet.vercel.app`.

Las fotos se suben solas: eliges la foto y el panel la guarda en `img/` ya
achicada y optimizada. Una foto de celular de 5 MB queda en unos 20 KB, sin que
tengas que hacer nada.

Consejos para cargar muchos de una vez:

- La categoría se queda puesta después de guardar y el cursor vuelve al nombre,
  para que metas todos los muebles seguidos sin volver a elegir "Muebles".
- Pulsa «Guardar en la tienda» cada 10 o 15 artículos, no solo al final.
- Los 3 artículos de ejemplo (butaca, caja fuerte, librero) los puedes editar
  con sus datos reales o borrarlos. La página funciona igual con el catálogo
  vacío.
- Al guardar, el catálogo anterior queda como `js/productos-anterior.js` por si
  necesitas volver atrás.

> **Ojo:** si abres `admin.html` haciendo doble clic, o entras a
> `compas-outlet.vercel.app/admin.html`, el panel arranca en **modo solo
> lectura**: te avisa arriba en rojo y lo que edites ahí no llega a la tienda.
> Siempre entra por `administrar.cmd`.

### Opción B — a mano

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

Desde el panel no tienes que hacer nada: eliges la foto y se guarda sola en
`img/`, ya achicada a 1200 px y comprimida. También le limpia el nombre
(`Foto WhatsApp ÑÁ.PNG` queda como `foto-whatsapp-na.jpg`).

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
├── administrar.cmd    ← DOBLE CLIC AQUÍ para cargar artículos
├── index.html         La tienda
├── admin.html         El panel (no lo abras directo: usa administrar.cmd)
├── servidor-admin.ps1 El motor del panel
├── publicar.cmd       Publicar sin abrir el panel (por si editas a mano)
├── css/
│   └── estilos.css    Colores y diseño
├── js/
│   ├── config.js      ← tus datos (WhatsApp, redes, moneda)
│   ├── productos.js   ← tu catálogo
│   ├── tienda.js      Funcionamiento de la tienda
│   └── admin.js       Funcionamiento del panel
└── img/               ← tu logo.jpg y las fotos de los productos
```

El panel y las herramientas locales no se publican en internet: los excluye
`.vercelignore`. En tu sitio solo queda la tienda.
