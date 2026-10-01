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
  '¿Cuál te interesa?';

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
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
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

// Solo para pruebas locales con Node; en Google Apps Script esta línea no hace nada.
if (typeof module !== 'undefined') {
  module.exports = { calcularCotizacion: calcularCotizacion, normalizarTelefono: normalizarTelefono,
                     normalizarInstagram: normalizarInstagram, armarMensaje: armarMensaje };
}
