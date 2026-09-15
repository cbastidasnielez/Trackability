/**
 * Genera con Chromium (Playwright) las imágenes estáticas del producto:
 *   public/cara-demo.png    cara neutra para la demo (no es una persona real)
 *   public/og.png           imagen de previsualización de la página de venta
 *   public/og-regalo.png    previsualización del enlace del regalo
 * Uso: node dev/imagenes.mjs
 */
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

const cara = `<body style="margin:0;background:transparent"><canvas id=c width=256 height=256></canvas><script>
const c=document.getElementById('c').getContext('2d');
c.beginPath();c.arc(128,128,126,0,Math.PI*2);c.closePath();c.clip();
const g=c.createRadialGradient(100,90,20,128,128,140);g.addColorStop(0,'#f3d698');g.addColorStop(1,'#c9a05a');
c.fillStyle=g;c.fillRect(0,0,256,256);
c.fillStyle='rgba(240,143,164,.55)';c.beginPath();c.ellipse(74,150,20,12,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(182,150,20,12,0,0,Math.PI*2);c.fill();
c.fillStyle='#1b1410';c.beginPath();c.ellipse(90,112,11,14,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(166,112,11,14,0,0,Math.PI*2);c.fill();
c.fillStyle='#fff';c.beginPath();c.arc(94,106,4,0,Math.PI*2);c.fill();c.beginPath();c.arc(170,106,4,0,Math.PI*2);c.fill();
c.strokeStyle='#1b1410';c.lineWidth=7;c.lineCap='round';c.beginPath();c.arc(128,140,38,0.25*Math.PI,0.75*Math.PI);c.stroke();
</script></body>`;

function og(titulo, sub, pie) {
  return `<body style="margin:0;width:1200px;height:630px;background:#050505;font-family:Helvetica,Arial,sans-serif;color:#f5f2ea;position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 0%,rgba(240,143,164,.18),transparent 60%),radial-gradient(ellipse 100% 80% at 50% 50%,#121212,#050505 70%)"></div>
  <div style="position:absolute;left:80px;top:80px;font-size:20px;letter-spacing:.4em;text-transform:uppercase;color:#f08fa4">${pie}</div>
  <div style="position:absolute;left:80px;top:150px;width:760px;font-family:Georgia,serif;font-size:66px;line-height:1.12">${titulo}</div>
  <div style="position:absolute;left:80px;top:430px;width:720px;font-size:28px;line-height:1.4;color:rgba(245,242,234,.75)">${sub}</div>
  <div style="position:absolute;right:120px;top:150px;width:300px;height:300px;border-radius:50%;border:4px solid rgba(227,192,122,.7);box-shadow:0 0 120px rgba(227,192,122,.3);background:radial-gradient(circle at 40% 35%,#f3d698,#c9a05a)"></div>
  <div style="position:absolute;right:90px;top:100px;width:70px;height:170px;background:linear-gradient(90deg,#2a2118,#4a3a24,#2a2118);border:3px solid rgba(227,192,122,.55);border-radius:6px"></div>
  <div style="position:absolute;right:90px;bottom:60px;width:70px;height:120px;background:linear-gradient(90deg,#2a2118,#4a3a24,#2a2118);border:3px solid rgba(227,192,122,.55);border-radius:6px"></div>
  <div style="position:absolute;left:80px;bottom:60px;font-family:Georgia,serif;font-size:30px;letter-spacing:.05em">Gánatelo <span style="font-family:Helvetica,Arial;font-size:14px;letter-spacing:.35em;text-transform:uppercase;color:rgba(245,242,234,.5);margin-left:14px">Regalos que se ganan</span></div>
  </body>`;
}

const navegador = await chromium.launch({ executablePath: exe });
const pagina = await navegador.newPage({ deviceScaleFactor: 1 });

await pagina.setViewportSize({ width: 256, height: 256 });
await pagina.setContent(cara);
await pagina.locator('#c').screenshot({ path: resolve('public/cara-demo.png'), omitBackground: true });

await pagina.setViewportSize({ width: 1200, height: 630 });
await pagina.setContent(og('¿Qué le regalo cuando ya le he regalado de todo?', 'Un juego con su cara, vuestros premios y un mensaje tuyo al final. Lo tiene en el móvil en dos minutos.', 'Un regalo con su cara'));
await pagina.screenshot({ path: resolve('public/og.png') });

await pagina.setContent(og('Tienes un regalo. Pero te lo tienes que ganar.', 'Alguien te ha preparado un juego con tu cara. Cada punto te acerca a un premio.', 'Para ti'));
await pagina.screenshot({ path: resolve('public/og-regalo.png') });

await navegador.close();
console.log('imágenes generadas');
