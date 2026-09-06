# Panel en línea — cómo activarlo

Con esto vas a poder cargar artículos **desde el celular o desde cualquier
computadora**, sin la ventana negra, y que aparezcan en la tienda al instante.

Son 5 pasos. Tardás unos 15 minutos la primera vez y no se repite nunca más.

---

## Paso 1 — Crear la cuenta

Entrá a **[supabase.com](https://supabase.com)** y creá una cuenta (podés usar
tu GitHub `jeff-1910`, es lo más rápido). Es gratis.

## Paso 2 — Crear el proyecto

1. Botón **New project**
2. **Name:** `compas-outlet`
3. **Database Password:** poné una contraseña y **guardala en algún lado**.
   No es la que vas a usar para entrar al panel, pero no la pierdas.
4. **Region:** elegí la más cercana — *East US (North Virginia)* está bien
   para Costa Rica
5. **Create new project** y esperá un par de minutos

## Paso 3 — Preparar la base de datos

1. En el menú de la izquierda entrá a **SQL Editor**
2. **New query**
3. Abrí el archivo `supabase/configuracion.sql` de tu carpeta, copiá **todo**
   el contenido y pegalo ahí
4. Botón **Run** (o Ctrl+Enter)

Tiene que decir *Success*. Si sale algo en rojo, copiámelo y lo vemos.

## Paso 4 — Crear tu usuario

Este es el correo y contraseña con los que vas a entrar al panel.

1. Menú izquierdo → **Authentication** → **Users**
2. Botón **Add user** → **Create new user**
3. Poné tu correo y una contraseña que te acuerdes
4. **Importante:** marcá la casilla **Auto Confirm User**. Si no la marcás,
   Supabase te pide confirmar por correo y no vas a poder entrar.
5. **Create user**

## Paso 5 — Conectar tu página

1. Menú izquierdo → **Project Settings** (el engranaje) → **API**
2. Vas a ver dos datos:
   - **Project URL** — algo como `https://abcdefgh.supabase.co`
   - **anon public** — una clave larguísima
3. Abrí `js/config.js` con el Bloc de notas y pegalos:

```js
supabase: {
  url: "https://abcdefgh.supabase.co",
  anonKey: "eyJhbGciOi...(la clave larga)",
},
```

4. Guardá el archivo
5. Doble clic en **`publicar.cmd`** para subirlo

Listo. En un minuto entrás a:

**https://compas-outlet.vercel.app/panel.html**

---

## Cómo se usa a partir de ahí

Desde el celular, la tablet o cualquier computadora:

1. Entrás a `compas-outlet.vercel.app/panel.html`
2. Tu correo y contraseña
3. Cargás el artículo, elegís la foto desde la galería del teléfono
4. **Guardar artículo**

Y ya está en la tienda. **Sin publicar, sin esperar, sin la ventana negra.**

La foto se achica sola antes de subirse, así que la tienda no se pone lenta
aunque uses fotos del celular.

---

## Preguntas que te van a surgir

**¿La clave `anon` no es peligrosa si está a la vista?**
No. Esa clave solo permite **leer** el catálogo, que de todas formas es
público: es tu tienda. Para agregar, editar o borrar hace falta tu correo y
contraseña, que nadie más tiene.

**¿Y si se cae Supabase o me quedo sin internet?**
La tienda sigue funcionando. Muestra el último catálogo que quedó guardado en
la página y no se rompe nada.

**¿Cuánto cuesta?**
El plan gratuito de Supabase alcanza de sobra para una tienda como la tuya
(500 MB de base de datos y 1 GB de fotos). Con fotos optimizadas te caben
miles de artículos.

**Ojo:** en el plan gratuito, si el proyecto pasa **una semana entera sin que
nadie lo use**, Supabase lo pausa y hay que reactivarlo a mano desde su panel.
Mientras tengas visitas en la tienda, eso no ocurre.

**¿Qué pasa con el panel viejo (`administrar.cmd`)?**
Queda de respaldo hasta que confirmemos que este funciona. Después lo sacamos
para no tener dos paneles y confundirse.
