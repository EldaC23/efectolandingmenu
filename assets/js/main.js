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

  /* Barra fija de WhatsApp en móvil: aparece tras el hero */
  var sticky = document.getElementById('sticky-cta');
  function toggleSticky() {
    var show = window.scrollY > 520;
    sticky.classList.toggle('translate-y-full', !show);
    sticky.classList.toggle('pointer-events-none', !show);
    document.body.classList.toggle('has-bar', show);
  }
  window.addEventListener('scroll', toggleSticky, { passive: true });
  toggleSticky();

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
