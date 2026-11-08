# Guía SEO de Compas Outlet (para que Google te encuentre)

Última revisión: 7 de noviembre de 2026.

## Lo que ya quedó hecho en el código (se activa al publicar)

| Pendiente de la lista | Qué se hizo |
|---|---|
| robots.txt no bloquea bots | Ya no bloquea a ninguno. Solo esconde paneles privados y `/api/`. Ahora además apunta al mapa del sitio. |
| Mapa del sitio | `/sitemap.xml` se arma solo con los artículos en stock (unas 325 direcciones). |
| Servicios y nombre del negocio en títulos | Portada: «Compas Outlet \| Muebles y hogar a precio de outlet en Costa Rica». Cada categoría y cada artículo tiene su propio título con el nombre. |
| Google no veía los artículos | Antes solo existía UNA dirección indexable (la portada). Ahora hay `/categoria/muebles`, `/categoria/cama`, etc. y `/p/<id>` por cada artículo, con foto, precio y datos estructurados. |
| Datos del negocio para Google | La portada declara: tienda, Heredia, teléfono, correo, Instagram y Facebook. |
| Analytics | Se agregó Vercel Web Analytics (sin cookies). **Falta activarlo** (paso 3). La página de cookies ya dice la verdad. |

## Lo que solo Jeff puede hacer (necesita tu cuenta de Google o de Vercel)

### 1. Google Search Console (10 min) ← el más importante
1. Entra a https://search.google.com/search-console con la cuenta de Google del negocio.
2. «Agregar propiedad» → «Prefijo de URL» → `https://compas-outlet.vercel.app/`
3. Verificación: elige «Etiqueta HTML», copia el código y pásamelo; yo lo pego en la portada.
4. Ya verificado: menú «Sitemaps» → escribe `sitemap.xml` → Enviar.
5. «Inspección de URLs» → pega `https://compas-outlet.vercel.app/` → «Solicitar indexación».

### 2. Perfil de Negocio de Google (Google My Business) (15 min)
1. https://business.google.com → «Agregar tu negocio» → nombre **Compas Outlet**.
2. Categoría principal: «Tienda de muebles» o «Tienda de outlet» (la que ofrezca Google).
3. Si no atiendes público en un local: elige «Entrego pedidos a mis clientes» y marca Heredia y las zonas a las que envías. No pongas una dirección que no sea real.
4. Teléfono +506 7009 0544, sitio web `https://compas-outlet.vercel.app/`, horario, y subir 5–10 fotos reales.
5. Google pide verificar (llamada, mensaje o postal). Hazlo desde tu teléfono.
6. Pide a tus primeros clientes una reseña; es lo que más pesa.

### 3. Activar el contador de visitas
Vercel → proyecto `compas-outlet` → pestaña **Analytics** → **Enable**. Nada más; el código ya está.
(Si prefieres Google Analytics, avísame: exige banner de cookies y cambiar las políticas.)

### 4. Dirección propia (decisión tuya, cuesta dinero)
`compas-outlet.vercel.app` es una dirección prestada: a Google le cuesta confiar en ella y en tarjetas de Google Business se ve poco profesional. Un dominio como `compasoutlet.com` cuesta unos $12–15 al año. Si lo compras, yo lo conecto y cambio todas las direcciones.

## Qué busca la gente (consultado en el autocompletado de Google, Costa Rica, 7-nov-2026)
Frases reales: «outlet costa rica», «outlet costa rica muebles», «outlet heredia», «outlet heredia muebles», «outlet colchones costa rica», «outlet electrodomésticos costa rica», «outlet herramientas costa rica», «ropa de cama king costa rica», «muebles americanos usados heredia», «dónde comprar muebles baratos en costa rica».

Lo que NO busca nadie: «No son clientes, son nuestros Compas» (es tu lema, no una búsqueda). Se quedó en la portada, pero ya no es el título.

Textos escritos con esas frases: portada, `/categoria/muebles`, `/categoria/cama` (colchones y ropa de cama), `/categoria/electronicos`, `/categoria/jardin`, etc.

## Mejoras futuras (cuando quieras)
- **Electrodomésticos y herramientas**: se buscan, pero hoy tienes casi ninguno en catálogo. Si los vas a vender, ahí hay oportunidad.
- **Horario y dirección**: hoy la web dice «Escríbenos por WhatsApp» y «Costa Rica». Cuando definas horario/zona, se agrega a Google y a la portada.
- **Reseñas de clientes** en Google y en la web.
