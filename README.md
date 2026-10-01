# Menús Interactivos by Efecto Landing

Landing de conversión para vender menús digitales interactivos a negocios de comida.
HTML + Tailwind CSS + JavaScript plano, sin framework. Publicada con GitHub Pages.

## Estructura

```
index.html            Página completa (contenido, meta tags Open Graph)
assets/css/styles.css CSS compilado de Tailwind (se commitea, Pages lo sirve tal cual)
assets/js/main.js     Reveal al scroll, barra fija móvil y animación de Google Sheets
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
