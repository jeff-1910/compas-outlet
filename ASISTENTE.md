# Asistente de ventas — cómo activarlo

El chat de la tienda ya está construido. Falta **una sola cosa**: darle una
clave de la API de Claude. Hasta que la pongas, el botón del chat simplemente
no aparece y la tienda funciona igual que siempre.

---

## Paso 1 — Sacar la clave

1. Entrá a [console.anthropic.com](https://console.anthropic.com) y creá una cuenta
2. Cargá algo de saldo (**Billing** → *Add credits*). Con 5 dólares te sobra
   para empezar y ver cuánto consume de verdad
3. Andá a **API Keys** → *Create Key*
4. Copiala. **Solo se muestra una vez.**

## Paso 2 — Ponerla en Vercel

1. Entrá a tu proyecto en [vercel.com](https://vercel.com)
2. **Settings** → **Environment Variables**
3. Agregá:

   | Campo | Valor |
   |---|---|
   | Name | `ANTHROPIC_API_KEY` |
   | Value | la clave que copiaste |
   | Environments | dejá las tres marcadas |

4. **Save**
5. Andá a **Deployments** → en el último, menú `...` → **Redeploy**

Al minuto, el botón del chat aparece en la tienda.

> **Esa clave es secreta.** Va solo en Vercel, nunca en un archivo de la
> carpeta ni en un mensaje. Vive en el servidor: el visitante nunca la ve.

---

## Qué sabe y qué no

El asistente lee **tu catálogo real de Supabase** cada vez que alguien
escribe. Si cargás un artículo en el panel, lo sabe enseguida.

Tiene reglas estrictas para no meterte en problemas:

- Solo habla de artículos que existen en tu catálogo
- **Nunca inventa** precios, medidas, colores ni plazos de entrega
- Si algo dice «precio a consultar», no estima: manda a WhatsApp
- Si está agotado, lo dice claro
- No promete descuentos, envíos gratis ni fechas
- No pide datos personales ni de tarjetas
- Cuando alguien quiere comprar o apartar, lo pasa a tu WhatsApp

Para cambiar cómo habla o qué puede decir, se edita el texto de
`instrucciones()` en `api/chat.js`. Decime qué querés cambiar y lo hago.

---

## Cuánto cuesta

Se paga por conversación, no una mensualidad. Depende de cuánta gente escriba.

Dos cosas que ya bajan el costo:

- **El catálogo se cachea.** A partir del segundo mensaje de una charla, la
  parte cara se cobra un décimo.
- **Se limitan los turnos** (24) y el largo de cada mensaje, para que una
  conversación no se dispare.

Podés poner un tope de gasto mensual en la consola de Anthropic:
**Billing** → *Usage limits*. Te recomiendo empezar con un límite bajo y
subirlo si ves que hace falta.

Si el costo te resulta alto, se puede cambiar a un modelo más barato: es una
línea en `api/chat.js`. Avisame y lo cambio.

---

## Si algo falla

- **No aparece el botón:** falta la clave, o falta el *Redeploy* después de
  ponerla.
- **Dice «El asistente no está disponible»:** la clave está mal copiada o la
  cuenta se quedó sin saldo.
- **Dice «Hay mucha gente escribiendo»:** llegaste al límite de tu cuenta.
  Esperá un momento.
