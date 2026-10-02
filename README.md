# Menús Interactivos by Efecto Landing

Landing de conversión para vender menús digitales interactivos a negocios de comida.
HTML + Tailwind CSS + JavaScript plano, sin framework. Publicada con GitHub Pages.

## Estructura

```
index.html            Página completa (contenido, meta tags Open Graph)
assets/css/styles.css CSS compilado de Tailwind (se commitea, Pages lo sirve tal cual)
assets/js/main.js     Reveal al scroll, formulario de cotización y animación de Google Sheets
assets/js/config.js   URL del Web App de Google para guardar las cotizaciones
apps-script/Code.gs   Script de Google Sheets: calcula las 3 cotizaciones y arma la respuesta
docs/                 Guía para conectar el formulario con tu hoja de Google
assets/video/         Clip de la demo (MP4 y WebM) de la sección Cómo funciona
assets/img/           Logo, capturas de menús, WhatsApp, testimonios y og-image.jpg
src/input.css         Estilos propios + directivas de Tailwind
tailwind.config.js    Colores y tipografías de la marca
```

## Editar

Textos, links y número de WhatsApp están directo en `index.html`
(busca `584128995687` para cambiar el número).

Si cambias clases de Tailwind o `src/input.css`, recompila el CSS:

```bash
npm install
npm run build
```

## Publicar

Settings → Pages → Deploy from branch → `main` / `(root)`.
Al cambiar el dominio, actualiza `og:url`, `og:image` y `canonical` en el `<head>`.
