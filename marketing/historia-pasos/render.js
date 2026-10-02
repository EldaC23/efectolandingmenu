// Uso: node render.js [preview|full]
// Genera los cuadros (30 fps, 20 s) de escena.html en 1080x1920 y los junta con ffmpeg en historia-pasos.mp4
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path'), {execSync}=require('child_process');
const modo=process.argv[2]||'full', out=process.env.OUT||path.join(__dirname,'frames');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:540,height:960},deviceScaleFactor:2,ignoreHTTPSErrors:true});
  await p.goto('file://'+path.join(__dirname,'escena.html'),{waitUntil:'networkidle'}).catch(()=>{});
  await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(700);
  const tiempos = modo==='preview' ? [1.2,4.4,7.4,10.4,13.4,14.4,16.0,19.0] : Array.from({length:600},(_,i)=>i/30);
  for (let i=0;i<tiempos.length;i++){
    await p.evaluate(t=>render(t),tiempos[i]);
    const f=modo==='preview'?`prev${i}.jpg`:`f${String(i).padStart(4,'0')}.jpg`;
    await p.screenshot({path:path.join(out,f),type:'jpeg',quality:94});
  }
  await b.close();
  if(modo==='full') execSync(`ffmpeg -y -loglevel error -framerate 30 -i ${out}/f%04d.jpg -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart ${path.join(__dirname,'historia-pasos.mp4')}`);
  console.log('listo',modo);
})();
