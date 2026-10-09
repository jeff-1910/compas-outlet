# Aprobar los posts por WhatsApp

Guía para Jeff. Lo que hay que hacer una sola vez, y cómo se usa después.

---

## Qué cambia

Antes, para que un post saliera había que abrir la hoja de Google, buscar la
fila y escribir "si" en la columna N. Desde el teléfono eso es un dolor, y por
eso se juntaron 12 posts sin aprobar.

Ahora le escribís **posts** al WhatsApp del negocio y te llegan los borradores
con la foto del artículo y dos botones: **Aprobar** y **No va**. Tocás uno y
listo.

La hoja de Google **sigue existiendo**, pero vos ya no la abrís. Es el archivero
del sistema: ahí guarda el agente lo que escribe y de ahí lo lee el publicador.
Trabaja sola, como el motor de un carro.

**Los números que importan:**

| Número | Qué es |
|---|---|
| **+506 7043 1317** | El WhatsApp del negocio. A este le escribís vos. |
| **+506 6101 9986** | Tu número. Es el único al que el sistema le hace caso. |

---

## Lo único que tenés que hacer una vez

WhatsApp necesita saber a dónde mandar tus toques de botón. Hoy esa dirección
apunta al bot viejo, que está apagado, así que hay que cambiarla.

Es **un campo**. Son cinco minutos.

### Paso a paso

1. Entrá a **developers.facebook.com** (es un sitio web, con tu usuario y
   contraseña de Facebook).

2. Arriba, en **Mis apps**, entrá a la app que se llama **compas bot**.

3. En la lista de la izquierda buscá **WhatsApp** y debajo **Configuración**
   (en inglés dice *Configuration*).

4. Vas a ver una parte que dice **Webhook**. Tocá el botón **Editar**.

5. Se abre una ventanita con dos campos. Llenalos así:

   - **URL de devolución de llamada** (*Callback URL*):

     ```
     https://compas-outlet.vercel.app/api/whatsapp
     ```

   - **Token de verificación** (*Verify token*): es una palabra larga que ya
     existe. Está en el archivo **`chat bot/.env`** de tu computadora, en la
     línea que empieza con `WHATSAPP_VERIFY_TOKEN=`. Copiá lo que está después
     del `=`, sin espacios.

     > Esa palabra no se comparte con nadie ni se escribe en ningún chat.

6. Tocá **Verificar y guardar**. Si la dirección quedó bien, la ventanita se
   cierra sola. Si dice error, revisá que la dirección esté completa y que la
   palabra sea exactamente la del archivo.

7. Ahora, en esa misma pantalla, buscá **Campos de webhook** (*Webhook fields*)
   y tocá **Administrar**. En la lista, prendé el interruptor de **messages**.
   Es el único que hace falta.

8. Listo. No hay que tocar nada más.

---

## Cómo se usa, de ahora en adelante

Desde tu teléfono, escribile al **+506 7043 1317**:

| Escribís | Qué pasa |
|---|---|
| **posts** | Te llegan los borradores pendientes, con foto y botones |
| **mensajes** | Lo mismo con los mensajes a compas |
| **ayuda** | Te recuerda qué entiende |

Después solo tocás **Aprobar** o **No va**.

Te manda hasta 5 de una, para que el chat no se vuelva ilegible. Si hay más,
escribís **posts** otra vez y seguís.

### Cosas que conviene saber

- **Los borradores vencen a los 3 días.** Un post aprobado tarde no se publica:
  el precio o el stock pueden haber cambiado, y un outlet se mueve rápido. Los
  vencidos te llegan con un solo botón, **Descartar**, para limpiarlos rápido.
  Si aprobás seguido, nunca vas a ver uno vencido.

- **Por ahora, aprobar no publica solo.** Instagram y Facebook todavía no están
  conectados, así que un post aprobado queda marcado *LISTO PARA COPIAR* y lo
  pegás vos. Cuando conectemos Meta (las 3 plantillas y los datos de la página
  de Facebook), aprobás y sale solo.

- **TikTok y el grupo de WhatsApp siempre van a ser a mano.** TikTok exige que
  la app pase una revisión suya y los grupos no se pueden publicar desde un
  programa. Los textos te llegan listos para copiar.

- **El sistema solo le contesta al 6101-9986.** Si otra persona le escribe a ese
  número, no recibe nada. El bot de ventas sigue apagado y esto no lo enciende.

---

## Si algo falla

- **Escribo "posts" y no contesta nada** → el paso de Meta no quedó guardado.
  Volvé al punto 5 y revisá que la dirección y la palabra estén exactas, y que
  **messages** esté prendido en el punto 7.

- **Toco Aprobar y no pasa nada** → lo mismo de arriba: el toque no está
  llegando.

- **No me llega ningún mensaje** → WhatsApp solo deja que el negocio te escriba
  libremente durante las 24 horas siguientes a que vos le escribas. Mandale
  cualquier cosa al +506 7043 1317 y volvé a intentar.

---

## La página, por si acaso

También quedó una página de respaldo para revisar con calma desde la
computadora, con el texto completo, la historia, el guion de TikTok y botones
para copiar cada cosa.

Está en **compas-outlet.vercel.app/aprobar.html** y necesita una clave que
tenés guardada aparte. No sale en Google ni está enlazada desde la tienda.
