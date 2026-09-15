/**
 * Abre las páginas del producto en Chromium, comprueba que no hay errores de
 * consola y guarda pantallazos. Uso: node dev/pantallazos.mjs <base> <enlace-regalo> <carpeta>
 */
import { chromium } from 'playwright-core';

const BASE = process.argv[2];
const REGALO = process.argv[3];
const OUT = process.argv[4];

const navegador = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await navegador.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();

const fallos = [];
p.on('console', (m) => { if (m.type() === 'error') fallos.push('consola: ' + m.text()); });
p.on('pageerror', (e) => fallos.push('js: ' + e.message));

// ---- la página de venta ----
await p.goto(BASE + '/demo', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1200);
await p.screenshot({ path: OUT + '/demo-hero.png' });

// juega un poco: se fuerzan puntos con la sonda del juego
await p.evaluate(() => window.__juego && window.__juego.puntuar(5));
await p.waitForTimeout(500);
const primerPremio = await p.textContent('#premios .premio.abierto .premio-t');
console.log('premio desbloqueado en la demo:', JSON.stringify(primerPremio));

await p.locator('#demo').scrollIntoViewIfNeeded();
await p.waitForTimeout(400);
await p.screenshot({ path: OUT + '/demo-juego.png' });

// el checkout
await p.locator('#pedir').scrollIntoViewIfNeeded();
await p.waitForTimeout(600);
await p.screenshot({ path: OUT + '/demo-checkout.png' });
const hayPaypal = await p.locator('#paypal iframe').count();
console.log('iframes de PayPal:', hayPaypal);

// ---- el regalo ----
await p.goto(REGALO, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(900);
await p.screenshot({ path: OUT + '/regalo-portada.png' });
console.log('título del regalo:', await p.textContent('#nombre'), '| de:', await p.textContent('#de'));

await p.click('#empezar');
await p.waitForTimeout(800);
await p.screenshot({ path: OUT + '/regalo-juego.png' });

// comprueba que un premio con html se pinta como texto, no como etiqueta
const html = await p.innerHTML('#premios');
console.log('premios escapados:', !/<b>xss<\/b>/.test(html));

// ---- lo legal ----
await p.goto(BASE + '/legal', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(400);
await p.screenshot({ path: OUT + '/legal.png' });

// ---- un enlace inventado ----
await p.goto(BASE + '/r/noexisteaqui', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(600);
console.log('enlace inventado muestra aviso:', await p.isVisible('#noExiste'));

await navegador.close();
if (fallos.length) { console.error('\nERRORES:\n' + fallos.join('\n')); process.exit(1); }
console.log('\nsin errores de consola');
