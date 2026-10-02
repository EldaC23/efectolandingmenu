/**
 * Graba la demo REAL de Pizzería Borcelle (menupizzas/index-premium.html) mientras un "cliente"
 * elige, personaliza, revisa el pedido y confirma. Genera el clip para la sección "Cómo funciona".
 *
 * Variables de entorno:
 *   CHROME   ruta del chromium
 *   DEMO     ruta del index-premium.html local
 *   TWCSS    CSS de Tailwind compilado con la config de la demo (la CDN puede estar bloqueada)
 *   FA       carpeta de @fortawesome/fontawesome-free
 *   ROBOTO   carpeta @fontsource/roboto/files
 *   WORK     carpeta de trabajo para los cuadros
 */
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const E = process.env, OUT = path.join(__dirname, '..', '..', 'assets');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(E.WORK, { recursive: true });
  const browser = await chromium.launch({ executablePath: E.CHROME, args: ['--no-sandbox', '--allow-file-access-from-files'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, ignoreHTTPSErrors: true });
  const page = await ctx.newPage();
  const css = fs.readFileSync(E.TWCSS, 'utf8');
  await page.route('https://cdn.tailwindcss.com/**', r => r.fulfill({ contentType: 'text/javascript',
    body: `window.tailwind={config:{}};var s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.appendChild(s);` }));
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/**', r => {
    const rel = new URL(r.request().url()).pathname.split('/6.4.0/')[1]; const f = path.join(E.FA, rel);
    fs.existsSync(f) ? r.fulfill({ path: f }) : r.abort();
  });
  await page.route('https://fuentes.local/**', r => r.fulfill({ path: path.join(E.ROBOTO, new URL(r.request().url()).pathname.slice(1)) }));
  await page.goto('file://' + E.DEMO, { waitUntil: 'networkidle' }).catch(() => {});
  await page.addStyleTag({ content: ['400', '500', '700', '900'].map(w => `@font-face{font-family:'Roboto';font-weight:${w};src:url(https://fuentes.local/roboto-latin-${w}-normal.woff2) format('woff2')}`).join('') +
    `body,button,input,textarea{font-family:'Roboto',sans-serif}` });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(600);

  // cursor falso (el demo no tiene) + onda de toque
  await page.evaluate(() => {
    const c = document.createElement('div'); c.id = 'fc';
    c.style.cssText = 'position:fixed;left:0;top:0;width:28px;height:28px;z-index:99999;pointer-events:none;opacity:0;transform:translate(300px,700px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))';
    c.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M5 3l14 8-6.2 1.6L9.8 19z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    const r = document.createElement('div'); r.id = 'fr';
    r.style.cssText = 'position:fixed;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;border:3px solid #D32F2F;z-index:99998;pointer-events:none;opacity:0';
    document.body.append(r, c);
    window.__move = (x, y, ms) => new Promise(res => {
      const el = document.getElementById('fc'); const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(el.style.transform); const x0 = +m[1], y0 = +m[2], t0 = performance.now();
      el.style.opacity = 1;
      (function f(t) { const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        el.style.transform = `translate(${x0 + (x - x0) * e}px,${y0 + (y - y0) * e}px)`; k < 1 ? requestAnimationFrame(f) : res(); })(t0);
    });
    window.__ripple = (x, y) => { const r = document.getElementById('fr'); r.style.left = x + 'px'; r.style.top = y + 'px';
      r.animate([{ opacity: .9, transform: 'scale(.4)' }, { opacity: 0, transform: 'scale(1.5)' }], { duration: 450, easing: 'ease-out' }); };
  });

  // captura continua de la pantalla (CDP screencast) con marca de tiempo por cuadro
  const cdp = await ctx.newCDPSession(page); const frames = [];
  cdp.on('Page.screencastFrame', async f => { frames.push({ t: f.metadata.timestamp, data: f.data }); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
  const now = () => page.evaluate(() => (performance.timeOrigin + performance.now()) / 1000);
  const marks = {};
  const center = async sel => { const b = await page.locator(sel).first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  const tap = async (sel, move = 650, after = 350) => { const p = await center(sel); await page.evaluate(([x, y, m]) => window.__move(x + 4, y + 6, m), [p.x, p.y, move]);
    await page.evaluate(([x, y]) => window.__ripple(x, y), [p.x + 4, p.y + 6]); await page.mouse.click(p.x, p.y); await sleep(after); };

  await sleep(1500);                                   // paso 1: se abre el menú
  marks.paso1 = await now();
  marks.paso2 = (await now()) + 0.2; await sleep(200);
  await tap(`button[onclick="updateQty('p1', 1)"]`, 800);
  await tap(`button[onclick="updateQty('p1', 1)"]`, 250, 450);
  await tap(`[data-mod-toggle="p1"]`, 650, 650);
  await tap(`.choice-btn[data-product="p1"][data-choice="relleno-queso"]`, 600, 450);
  await tap(`label.mod-chip:has(input[data-product="p1"][data-mod="oregano"])`, 450, 900);
  marks.paso3 = await now();
  await tap(`button[onclick="openModal()"]`, 750, 900);
  await tap(`#customerName`, 650, 250); await page.keyboard.type('María', { delay: 150 }); await sleep(900);
  marks.paso4 = await now();
  await tap(`button[onclick="sendToWhatsApp()"]`, 700, 2400);
  const fin = await now(); await sleep(300);
  await cdp.send('Page.stopScreencast'); await browser.close();

  // cuadros -> duraciones reales -> mp4/webm a 30 fps
  frames.sort((a, b) => a.t - b.t); const T0 = frames[0].t, TEND = Math.max(fin + .4, frames[frames.length - 1].t + .1);
  let list = ''; frames.forEach((f, i) => { const n = path.join(E.WORK, `f${String(i).padStart(4, '0')}.jpg`); fs.writeFileSync(n, Buffer.from(f.data, 'base64'));
    const next = i + 1 < frames.length ? frames[i + 1].t : TEND; list += `file '${n}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}\n`; });
  list += `file '${path.join(E.WORK, `f${String(frames.length - 1).padStart(4, '0')}.jpg`)}'\n`;
  fs.writeFileSync(path.join(E.WORK, 'list.txt'), list);
  const dur = TEND - T0, tm = k => +(marks[k] - T0).toFixed(2);
  const times = { duracion: +dur.toFixed(2), paso1: 0, paso2: tm('paso2'), paso3: tm('paso3'), paso4: tm('paso4') };
  fs.writeFileSync(path.join(__dirname, 'tiempos.json'), JSON.stringify(times, null, 2));
  const vf = `fps=30,scale=540:-2:flags=lanczos,fade=t=in:st=0:d=0.3,fade=t=out:st=${(dur - 0.4).toFixed(2)}:d=0.4`;
  execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${E.WORK}/list.txt -vf "${vf}" -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart -an ${OUT}/video/pasos.mp4`);
  execSync(`ffmpeg -y -loglevel error -f concat -safe 0 -i ${E.WORK}/list.txt -vf "${vf}" -c:v libvpx-vp9 -crf 38 -b:v 0 -row-mt 1 -an ${OUT}/video/pasos.webm`);
  execSync(`ffmpeg -y -loglevel error -ss ${(times.paso2 + 3.2).toFixed(2)} -i ${OUT}/video/pasos.mp4 -frames:v 1 -vf scale=540:-2 -q:v 3 ${E.WORK}/poster.png`);
  console.log(JSON.stringify(times), 'cuadros:', frames.length);
})();
