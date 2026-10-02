// Uso: node render.js [preview|full]
// Genera los cuadros (30 fps, 10 s) de escena.html en 1080x1920 y los junta con ffmpeg en historia-sheets.mp4
const { chromium } = require('playwright'); const fs=require('fs'), path=require('path'), {execSync}=require('child_process');
const modo=process.argv[2]||'full', out=process.env.OUT||path.join(__dirname,'frames');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--allow-file-access-from-files']});
  const p=await b.newPage({viewport:{width:540,height:960},deviceScaleFactor:2,ignoreHTTPSErrors:true});
  await p.goto('file://'+path.join(__dirname,'escena.html'),{waitUntil:'networkidle'}).catch(()=>{});
  await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(700);
  const tiempos = modo==='preview' ? [0.6,1.6,2.7,3.9,4.9,6.2,7.0,9.2] : Array.from({length:300},(_,i)=>i/30);
  for (let i=0;i<tiempos.length;i++){
    await p.evaluate(t=>render(t),tiempos[i]);
    const f=modo==='preview'?`prev${i}.jpg`:`f${String(i).padStart(4,'0')}.jpg`;
    await p.screenshot({path:path.join(out,f),type:'jpeg',quality:94});
  }
  await b.close();
  if(modo==='full') execSync(`ffmpeg -y -loglevel error -framerate 30 -i ${out}/f%04d.jpg -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart ${path.join(__dirname,'historia-sheets.mp4')}`);
  console.log('listo',modo);
})();
