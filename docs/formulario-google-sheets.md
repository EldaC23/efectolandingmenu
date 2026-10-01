# Formulario de cotización → Google Sheets

Cuando un cliente llena el formulario de la landing pasan dos cosas:

1. Se abre **tu WhatsApp** con sus datos ya escritos (Instagram, WhatsApp, productos y categorías).
2. Se guarda **una fila en tu hoja de Google** con las 3 cotizaciones ya calculadas (Básico, Mixto y Full), un
   botón **Responder** que abre el chat con ese cliente y el mensaje de cotización escrito, y el link a su Instagram.

Los precios viven solo en el script de tu hoja. La landing no los contiene.

## Instalación (una sola vez, unos 10 minutos)

### 1. Crea la hoja
1. Entra a [sheets.google.com](https://sheets.google.com) y crea una hoja en blanco.
2. Ponle nombre, por ejemplo **Cotizaciones Menús Interactivos**.

### 2. Pega el script
1. En la hoja: **Extensiones → Apps Script**.
2. Borra el código que aparece y pega **todo** el contenido de `apps-script/Code.gs` (de este repositorio).
3. Pulsa el ícono de guardar (💾).

### 3. Prepara la pestaña
1. En el menú de funciones (arriba) elige **`setup`** y pulsa **Ejecutar**.
2. Google pedirá permisos: **Revisar permisos → tu cuenta → Avanzado → Ir a (proyecto) → Permitir**.
   (Es normal: el script es tuyo y solo escribe en esta hoja.)
3. Aparecerá una pestaña **Cotizaciones** con los encabezados.

### 4. Publícalo como Web App
1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En el engranaje elige **Aplicación web**.
3. Configura:
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** Cualquier persona
4. Pulsa **Implementar** y **copia la URL** que termina en `/exec`.

### 5. Conecta la landing
1. En GitHub abre `assets/js/config.js` y pega la URL entre las comillas:
   ```js
   window.QUOTE_ENDPOINT = 'https://script.google.com/macros/s/XXXXXXXX/exec';
   ```
2. Guarda (commit). En uno o dos minutos GitHub Pages lo publica.

### 6. Prueba
- En el editor de Apps Script ejecuta **`probarCotizacion`**: agrega una fila de ejemplo (puedes borrarla).
- Luego llena el formulario de la landing y verifica que llegue la fila y que se abra WhatsApp.

## Cómo la usas
Cada fila nueva trae:

| Columna | Qué es |
|---|---|
| Estado | Nuevo / Respondido / Cerrado (lista desplegable, para llevar el control) |
| Instagram, WhatsApp | Los datos del cliente (el número ya viene con código de país) |
| Productos, Categorías | Lo que escribió |
| Básico, Mixto, Full | Las 3 cotizaciones calculadas |
| Perfil de Instagram | Abre su perfil |
| **Responder por WhatsApp** | Abre el chat con él y el mensaje de cotización listo. Solo pulsas enviar |
| Mensaje de respuesta | El mismo texto, por si prefieres copiarlo |

## Aviso por correo
Cada cotización nueva también te llega **por correo**, con el Instagram, el WhatsApp, las 3 cotizaciones, el enlace
para responder y el mensaje de respuesta ya armado. Así puedes verla desde la notificación del celular sin abrir la hoja.

- Por defecto llega al correo de **tu propia cuenta de Google**. Para usar otro, escríbelo en `NOTIFY_EMAIL` al inicio de `Code.gs`.
- Para desactivarlo, pon `SEND_EMAIL = false`.
- Si el correo falla por cualquier motivo, la cotización se guarda igual en la hoja.

**Al activarlo por primera vez** Google necesita un permiso nuevo (enviar correo):
1. Pega el `Code.gs` actualizado en el editor y guarda.
2. Elige la función **`probarCotizacion`** y pulsa **Ejecutar**. Acepta el permiso (Revisar permisos → tu cuenta → Avanzado → Ir a → Permitir).
   Llegará un correo de prueba y se agregará una fila de ejemplo (puedes borrarla).
3. Publica la nueva versión: **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar**.

## Cambiar precios o el texto del mensaje
Todo está al inicio de `Code.gs`, en la sección **CONFIGURACIÓN**: los mínimos, los $10 y $1 por categoría, el factor del Full
y el texto del mensaje.

> **Importante:** cada vez que cambies el script, hay que publicar de nuevo para que aplique:
> **Implementar → Administrar implementaciones → ✏️ editar → Versión: Nueva versión → Implementar**.
> La URL se mantiene igual.

## Reglas de cotización actuales
- Menús de menos de 25 productos se cotizan como si tuvieran 25.
- **Básico** = productos + $10, mínimo $35.
- **Mixto** = Básico + $1 por categoría, mínimo $40.
- **Full** = productos × 2, mínimo $50.

## Números de teléfono
Si el cliente escribe `0412 1234567` o `4121234567`, el script le agrega el código de Venezuela (58).
Si escribe un número con otro código de país (por ejemplo `+57 ...`), lo respeta. Puedes cambiar el código por
defecto en `DEFAULT_COUNTRY_CODE`.
