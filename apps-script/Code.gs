/**
 * Menús Interactivos by Efecto Landing
 * Recibe el formulario de cotización de la landing y lo guarda en esta hoja de Google,
 * con las 3 cotizaciones ya calculadas y el mensaje de respuesta listo para enviar.
 *
 * Los precios viven AQUÍ (en tu cuenta de Google), no en la página de la landing.
 * Guía de instalación: docs/formulario-google-sheets.md
 */

/* ============ CONFIGURACIÓN (lo único que normalmente editas) ============ */

var SHEET_NAME = 'Cotizaciones';
var DEFAULT_COUNTRY_CODE = '58';   // Venezuela. Se usa si el cliente escribe el número sin código de país.

var MIN_PRODUCTS = 25;             // Menús más pequeños se cotizan como si tuvieran 25 productos
var PRICE = {
  basicoMin: 35,                   // Básico = productos + basicoExtra, mínimo 35
  basicoExtra: 10,
  mixtoMin: 40,                    // Mixto = Básico + $1 por categoría, mínimo 40
  perCategory: 1,
  fullMin: 50,                     // Full = productos x 2, mínimo 50
  fullFactor: 2
};

// Mensaje de respuesta. Puedes cambiar el texto; las palabras entre {llaves} se rellenan solas.
var MESSAGE_TEMPLATE =
  'Hola, equipo de @{instagram} 👋 Gracias por escribirnos.\n\n' +
  'Para un menú de {productos} productos y {categorias} categorías, estas son las opciones:\n\n' +
  '• Básico (sin imágenes): ${basico}\n' +
  '• Mixto (imágenes por categoría): ${mixto}\n' +
  '• Full Imágenes (foto en cada producto): ${full}\n\n' +
  'Todas son de pago único e incluyen carrito con envío a WhatsApp, QR en alta definición, ' +
  'hosting y dominio gratis y un mes de acompañamiento.\n\n' +
  '¿Cuál opción se ajusta más a lo que quieres mostrar en @{instagram}?';

// Aviso por correo con cada cotización nueva (llega con el mensaje de respuesta listo para copiar).
var SEND_EMAIL = true;
var NOTIFY_EMAIL = '';             // Vacío = el correo de tu propia cuenta de Google. O escribe otro, por ejemplo 'tucorreo@gmail.com'.

var HEADERS = ['Fecha', 'Estado', 'Instagram', 'WhatsApp', 'Productos', 'Categorías',
               'Básico', 'Mixto', 'Full', 'Perfil de Instagram', 'Responder por WhatsApp', 'Mensaje de respuesta'];

/* ============ CÁLCULO (puro, se puede probar sin Google) ============ */

function calcularCotizacion(productos, categorias) {
  var n = Math.max(MIN_PRODUCTS, productos);
  var basico = Math.max(PRICE.basicoMin, n + PRICE.basicoExtra);
  var mixto = Math.max(PRICE.mixtoMin, basico + categorias * PRICE.perCategory);
  var full = Math.max(PRICE.fullMin, n * PRICE.fullFactor);
  return { basico: basico, mixto: mixto, full: full };
}

function normalizarTelefono(raw) {
  var d = String(raw || '').replace(/\D/g, '');
  if (d.indexOf('00') === 0) d = d.slice(2);
  if (d.charAt(0) === '0') d = DEFAULT_COUNTRY_CODE + d.slice(1);
  else if (d.length <= 10) d = DEFAULT_COUNTRY_CODE + d;
  return d;
}

function normalizarInstagram(raw) {
  var v = String(raw || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
  v = v.split(/[\/?#]/)[0].replace(/^@+/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(v) ? v : '';
}

function armarMensaje(datos, cot) {
  var vals = {
    instagram: datos.instagram, productos: datos.productos, categorias: datos.categorias,
    basico: cot.basico, mixto: cot.mixto, full: cot.full
  };
  return MESSAGE_TEMPLATE.replace(/\{(\w+)\}/g, function (m, k) { return vals[k] !== undefined ? vals[k] : m; });
}

/* ============ RECEPCIÓN DEL FORMULARIO ============ */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    var instagram = normalizarInstagram(body.instagram);
    var telefono = normalizarTelefono(body.whatsapp);
    var productos = parseInt(body.productos, 10);
    var categorias = parseInt(body.categorias, 10);

    if (!instagram || telefono.length < 8 || telefono.length > 15 ||
        !(productos >= 1 && productos <= 999) || !(categorias >= 1 && categorias <= 50)) {
      return json_({ ok: false, error: 'datos invalidos' });
    }

    var datos = { instagram: instagram, productos: productos, categorias: categorias };
    var cot = calcularCotizacion(productos, categorias);
    var mensaje = armarMensaje(datos, cot);
    var waUrl = 'https://wa.me/' + telefono + '?text=' + encodeURIComponent(mensaje);

    var sheet = obtenerHoja_();
    sheet.appendRow([
      new Date(), 'Nuevo', '@' + instagram, '+' + telefono, productos, categorias,
      cot.basico, cot.mixto, cot.full,
      '=HYPERLINK("https://instagram.com/' + instagram + '","Abrir perfil")',
      '=HYPERLINK("' + waUrl + '","Responder")',
      mensaje
    ]);
    notificarPorCorreo_(datos, telefono, cot, mensaje, waUrl);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/** Envía un aviso por correo. Si falla, no afecta: la cotización ya quedó guardada en la hoja. */
function notificarPorCorreo_(datos, telefono, cot, mensaje, waUrl) {
  if (!SEND_EMAIL) return;
  try {
    var destino = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
    if (!destino) return;
    var cuerpo =
      'Nueva solicitud de cotización\n\n' +
      'Instagram: @' + datos.instagram + '  (https://instagram.com/' + datos.instagram + ')\n' +
      'WhatsApp: +' + telefono + '\n' +
      'Productos: ' + datos.productos + '  ·  Categorías: ' + datos.categorias + '\n\n' +
      'Cotización:\n' +
      '• Básico: $' + cot.basico + '\n' +
      '• Mixto: $' + cot.mixto + '\n' +
      '• Full: $' + cot.full + '\n\n' +
      'Responder por WhatsApp (abre el chat con el mensaje listo):\n' + waUrl + '\n\n' +
      'Mensaje de respuesta (para copiar):\n' +
      '----------------------------------------\n' + mensaje + '\n' +
      '----------------------------------------\n\n' +
      'Consejo: si esa persona ya te escribió por WhatsApp, responde en ese chat.';
    MailApp.sendEmail({
      to: destino,
      subject: 'Nueva cotización: @' + datos.instagram + ' · ' + datos.productos + ' productos',
      body: cuerpo,                                   // versión de texto, por si el correo no muestra HTML
      htmlBody: htmlCorreo_(datos, telefono, cot, mensaje, waUrl)
    });
  } catch (err) {
    // La cotización ya está guardada; el motivo queda en "Ejecuciones" del editor de Apps Script.
    console.error('No se pudo enviar el correo: ' + err);
  }
}

/** Correo en formato bonito: datos, precios, botón verde para responder y el mensaje para copiar. */
function htmlCorreo_(datos, telefono, cot, mensaje, waUrl) {
  var fila = function (etiqueta, valor) {
    return '<tr><td style="padding:8px 14px;border-bottom:1px solid #eee;color:#555">' + etiqueta +
           '</td><td style="padding:8px 14px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:#111">' + valor + '</td></tr>';
  };
  return '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#222">' +
    '<h2 style="margin:0 0 4px;color:#7b1a16">Nueva solicitud de cotización</h2>' +
    '<p style="margin:0 0 16px;color:#666">Menús Interactivos by Efecto Landing</p>' +
    '<p style="margin:0 0 6px"><b>Instagram:</b> <a href="https://instagram.com/' + esc_(datos.instagram) + '">@' + esc_(datos.instagram) + '</a><br>' +
    '<b>WhatsApp:</b> +' + esc_(telefono) + '<br>' +
    '<b>Menú:</b> ' + datos.productos + ' productos · ' + datos.categorias + ' categorías</p>' +
    '<table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #eee;border-radius:8px">' +
      fila('Básico (sin imágenes)', '$' + cot.basico) +
      fila('Mixto (imágenes por categoría)', '$' + cot.mixto) +
      fila('Full Imágenes', '$' + cot.full) +
    '</table>' +
    '<p style="text-align:center;margin:22px 0"><a href="' + esc_(waUrl) + '" ' +
      'style="background:#25d366;color:#fff;text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:10px;display:inline-block">' +
      'Responder por WhatsApp</a></p>' +
    '<p style="margin:0 0 6px;color:#666;font-size:13px">Mensaje de respuesta (para copiar):</p>' +
    '<div style="background:#f6f6f6;border-radius:8px;padding:12px 14px;font-size:14px;line-height:1.5;white-space:pre-wrap">' + esc_(mensaje) + '</div>' +
    '<p style="color:#888;font-size:12px;margin-top:16px">Si esa persona ya te escribió por WhatsApp, responde en ese chat.</p>' +
    '</div>';
}

function esc_(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function doGet() { return json_({ ok: true, servicio: 'Menús Interactivos' }); }

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function obtenerHoja_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || prepararHoja_(ss);
}

/* ============ PREPARACIÓN Y PRUEBA ============ */

/** Ejecuta esta función UNA vez para crear la pestaña con sus encabezados. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || prepararHoja_(ss);
  SpreadsheetApp.getUi().alert('Listo: la pestaña "' + sheet.getName() + '" está preparada.');
}

function prepararHoja_(ss) {
  var sheet = ss.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
       .setFontWeight('bold').setBackground('#7b1a16').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
  sheet.getRange('G:I').setNumberFormat('$#,##0');
  sheet.getRange('B2:B').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Nuevo', 'Respondido', 'Cerrado'], true).build());
  sheet.setColumnWidths(1, 1, 130); sheet.setColumnWidths(2, 1, 100); sheet.setColumnWidths(3, 2, 150);
  sheet.setColumnWidths(5, 5, 85); sheet.setColumnWidths(10, 2, 150); sheet.setColumnWidth(12, 380);
  return sheet;
}

/** Agrega una fila de prueba para ver cómo queda (puedes borrarla después). */
function probarCotizacion() {
  doPost({ postData: { contents: JSON.stringify({ instagram: 'pizzeriaborcelle', whatsapp: '0412 1234567', productos: 40, categorias: 6 }) } });
}

/** Prueba solo el correo: si algo falla, el error aparece en el Registro de ejecución. */
function probarCorreo() {
  var destino = NOTIFY_EMAIL || Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(destino, 'Prueba de correo - Menús Interactivos', 'Si lees esto, el aviso por correo funciona.');
  SpreadsheetApp.getUi().alert('Correo de prueba enviado a: ' + destino);
}

// Solo para pruebas locales con Node; en Google Apps Script esta línea no hace nada.
if (typeof module !== 'undefined') {
  module.exports = { calcularCotizacion: calcularCotizacion, normalizarTelefono: normalizarTelefono,
                     normalizarInstagram: normalizarInstagram, armarMensaje: armarMensaje };
}
