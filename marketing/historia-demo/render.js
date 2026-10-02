// Uso: FRAMES=<carpeta con la grabación a 30 fps (f0001.jpg ...)> OUT=<carpeta de trabajo> node render.js [preview|full]
// Compone la historia (gancho + grabación real de la demo de Borcelle + cierre) y la exporta a historia-demo-borcelle.mp4 (1080x1920, 30 fps).
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path'), {execSync}=require('child_process');
const modo=process.argv[2]||'full', out=process.env.OUT, fr=process.env.FRAMES;
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:540,height:960},deviceScaleFactor:2,ignoreHTTPSErrors:true});
  await p.goto('file://'+path.join(__dirname,'escena.html'),{waitUntil:'networkidle'}).catch(()=>{});
  await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(700);
  const total=await p.evaluate(()=>window.TOTAL), n=fs.readdirSync(fr).filter(f=>f.endsWith('.jpg')).length;
  const tiempos = modo==='preview' ? [3.6,5.6,8.4,10.4,13.0,15.4,16.8,18.0] : Array.from({length:Math.round(total*30)},(_,i)=>i/30);
  for (let i=0;i<tiempos.length;i++){
    const t=tiempos[i], k=Math.min(n,Math.max(1,Math.floor((t-3.0)*30)+1));
    await p.evaluate(async f=>{const im=document.getElementById('foto'); im.src=f; await im.decode();}, 'file://'+path.join(fr,`f${String(k).padStart(4,'0')}.jpg`));
    await p.evaluate(t=>render(t),t);
    await p.screenshot({path:path.join(out,modo==='preview'?`prev${i}.jpg`:`f${String(i).padStart(4,'0')}.jpg`),type:'jpeg',quality:94});
  }
  await b.close();
  if(modo==='full') execSync(`ffmpeg -y -loglevel error -framerate 30 -i ${out}/f%04d.jpg -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart ${path.join(__dirname,'historia-demo-borcelle.mp4')}`);
  console.log('listo',modo);
})();
