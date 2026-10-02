(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.getElementById('year').textContent = new Date().getFullYear();

  /* Reveal al hacer scroll */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* ===== Formulario de cotización ===== */
  // URL del Web App de Google Apps Script (termina en /exec). Si está vacía, el formulario
  // solo abre WhatsApp. Pasos en docs/formulario-google-sheets.md
  var QUOTE_ENDPOINT = window.QUOTE_ENDPOINT || '';
  var WA_NUMBER = '584128995687';

  var dlg = document.getElementById('quote-dialog');
  if (dlg && typeof dlg.showModal === 'function') {
    var form = document.getElementById('quote-form');
    var formView = document.getElementById('quote-form-view');
    var doneView = document.getElementById('quote-done-view');
    var errBox = document.getElementById('quote-error');

    function openQuote() {
      formView.hidden = false; doneView.hidden = true; errBox.hidden = true;
      dlg.showModal();
      document.body.style.overflow = 'hidden';
    }
    dlg.addEventListener('close', function () { document.body.style.overflow = ''; });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { dlg.close(); }); });
    document.querySelectorAll('[data-quote]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); openQuote(); });
    });

    // Enlace directo al formulario: .../efectolandingmenu/#cotizar (lo usan las demos)
    function openFromHash() {
      if (location.hash === '#cotizar') {
        history.replaceState(null, '', location.pathname + location.search);
        openQuote();
      }
    }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);

    function cleanInstagram(raw) {
      var v = String(raw || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
      v = v.split(/[/?#]/)[0].replace(/^@+/, '');
      return /^[A-Za-z0-9._]{1,30}$/.test(v) ? v : '';
    }
    function markInvalid(input, msg) {
      var box = input.closest('.q-field') || input;
      box.setAttribute('aria-invalid', 'true');
      errBox.textContent = msg; errBox.hidden = false;
      input.focus();
    }
    form.addEventListener('input', function (e) {
      var box = e.target.closest('.q-field') || e.target;
      box.removeAttribute('aria-invalid'); errBox.hidden = true;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      if (f.website.value) { dlg.close(); return; } // trampa para bots

      var ig = cleanInstagram(f.instagram.value);
      var wa = f.whatsapp.value.trim();
      var waDigits = wa.replace(/\D/g, '');
      var prod = parseInt(f.productos.value, 10);
      var cat = parseInt(f.categorias.value, 10);

      if (!ig) return markInvalid(f.instagram, 'Escribe el usuario de Instagram de tu negocio, por ejemplo: tunegocio.');
      if (waDigits.length < 8 || waDigits.length > 15) return markInvalid(f.whatsapp, 'Revisa tu número de WhatsApp.');
      if (!(prod >= 1 && prod <= 999)) return markInvalid(f.productos, 'Indica cuántos productos tiene tu menú (aproximado).');
      if (!(cat >= 1 && cat <= 50)) return markInvalid(f.categorias, 'Indica cuántas categorías tiene tu menú.');

      var msg = 'Hola, quiero cotizar mi menú interactivo.\n' +
        '• Instagram: @' + ig + '\n' +
        '• WhatsApp: ' + wa + '\n' +
        '• Productos: ' + prod + '\n' +
        '• Categorías: ' + cat;
      var waUrl = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);

      // 1) Abrir WhatsApp (dentro del gesto del usuario para que no lo bloqueen)
      var win = window.open(waUrl, '_blank');
      document.getElementById('quote-wa-link').href = waUrl;

      // 2) Guardar en la hoja de Google (si está configurada)
      if (QUOTE_ENDPOINT) {
        try {
          fetch(QUOTE_ENDPOINT, {
            method: 'POST', mode: 'no-cors', keepalive: true,
            body: JSON.stringify({ instagram: ig, whatsapp: wa, productos: prod, categorias: cat, origen: location.href })
          }).catch(function () {});
        } catch (err) { /* el pedido por WhatsApp ya salió */ }
      }

      // 3) Confirmación
      formView.hidden = true; doneView.hidden = false;
      form.reset();
      if (!win) doneView.querySelector('p').textContent = 'Pulsa el botón para abrir WhatsApp con tu mensaje y enviarlo. Te respondo con tu cotización.';
    });
  }

  /* Video de "Cómo funciona": se reproduce al verlo y resalta el paso en curso */
  var vid = document.getElementById('pasos-video');
  if (vid) {
    var lista = document.getElementById('pasos-lista');
    var pasos = Array.prototype.slice.call(lista.querySelectorAll('.paso'));
    var cortes = JSON.parse(lista.getAttribute('data-cortes'));
    vid.muted = true;
    var marcar = function () {
      var t = vid.currentTime, idx = 0;
      cortes.forEach(function (c, k) { if (t >= c - 0.05) idx = k; });
      pasos.forEach(function (p, k) { p.classList.toggle('on', k === idx); });
    };
    vid.addEventListener('timeupdate', marcar);
    vid.addEventListener('pause', function () { if (vid.currentTime === 0) pasos.forEach(function (p) { p.classList.remove('on'); }); });
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); }
          else vid.pause();
        });
      }, { threshold: 0.35 }).observe(vid);
    }
  }

  /* Demo Google Sheets -> menú */
  var demo = document.getElementById('sheet-demo');
  if (!demo) return;
  var $ = function (id) { return document.getElementById(id); };
  var ringPrice = $('ring-price'), newPrice = $('new-price');
  var ringAvail = $('ring-avail'), newAvail = $('new-avail');
  var priceEl = $('price-catira'), cardMam = $('card-mamasita');
  var timers = [], running = false;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function reset() {
    [ringPrice, newPrice, ringAvail, newAvail].forEach(function (el) { el.classList.remove('on'); });
    priceEl.textContent = '$7.80';
    priceEl.classList.remove('flash');
    cardMam.classList.remove('soldout');
  }
  function finalState() {
    ringAvail.classList.remove('on'); ringPrice.classList.remove('on');
    newPrice.classList.add('on'); newAvail.classList.add('on');
    priceEl.textContent = '$8.40';
    cardMam.classList.add('soldout');
  }
  function cycle() {
    reset();
    later(function () { ringPrice.classList.add('on'); }, 900);
    later(function () { newPrice.classList.add('on'); }, 1700);
    later(function () { ringPrice.classList.remove('on'); }, 2500);
    later(function () { priceEl.textContent = '$8.40'; priceEl.classList.remove('flash'); void priceEl.offsetWidth; priceEl.classList.add('flash'); }, 3000);
    later(function () { ringAvail.classList.add('on'); }, 4600);
    later(function () { newAvail.classList.add('on'); }, 5400);
    later(function () { ringAvail.classList.remove('on'); }, 6200);
    later(function () { cardMam.classList.add('soldout'); }, 6700);
    later(cycle, 12500);
  }
  function start() { if (running) return; running = true; reduce ? finalState() : cycle(); }
  function stop() { running = false; timers.forEach(clearTimeout); timers = []; }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0.35 }).observe(demo);
  } else { start(); }
})();
