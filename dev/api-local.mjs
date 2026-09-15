/**
 * Plugin de Vite que sirve las funciones de /api en local, imitando a Vercel,
 * y aplica las mismas rutas bonitas de vercel.json (/demo, /r/<id>...).
 * Solo actúa en `npm run dev`; el build de producción ni lo toca.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const RAIZ = resolve(process.cwd());

function cargarEnv() {
  // .env.local y .env, como hace Vercel en local; no pisa lo que ya exista
  for (const nombre of ['.env.local', '.env']) {
    const ruta = join(RAIZ, nombre);
    if (!existsSync(ruta)) continue;
    for (const linea of readFileSync(ruta, 'utf8').split('\n')) {
      const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m || m[1] in process.env) continue;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

function leerCuerpo(req) {
  return new Promise((ok) => {
    const trozos = [];
    req.on('data', (c) => trozos.push(c));
    req.on('end', () => {
      const texto = Buffer.concat(trozos).toString('utf8');
      const tipo = String(req.headers['content-type'] || '');
      if (tipo.includes('application/json')) { try { ok(JSON.parse(texto)); return; } catch (e) { /* cae abajo */ } }
      ok(texto);
    });
  });
}

function envolverRes(res) {
  res.status = (n) => { res.statusCode = n; return res; };
  res.send = (b) => { res.end(typeof b === 'string' || Buffer.isBuffer(b) ? b : JSON.stringify(b)); return res; };
  res.json = (b) => { res.setHeader('content-type', 'application/json; charset=utf-8'); res.end(JSON.stringify(b)); return res; };
  return res;
}

export function apiLocal() {
  return {
    name: 'ganatelo-api-local',
    configureServer(servidor) {
      cargarEnv();
      const rutas = JSON.parse(readFileSync(join(RAIZ, 'vercel.json'), 'utf8')).rewrites || [];

      servidor.middlewares.use(async (req, res, siguiente) => {
        const url = new URL(req.url, 'http://local');

        if (url.pathname.startsWith('/api/')) {
          const nombre = url.pathname.slice(5).replace(/[^a-zA-Z0-9/_-]/g, '');
          const archivo = join(RAIZ, 'api', nombre + '.mjs');
          if (!existsSync(archivo) || nombre.startsWith('_')) { res.statusCode = 404; res.end('no api'); return; }
          try {
            const mod = await import(pathToFileURL(archivo).href + '?t=' + Date.now());
            req.query = Object.fromEntries(url.searchParams);
            req.body = await leerCuerpo(req);
            await mod.default(req, envolverRes(res));
          } catch (e) {
            console.error(e);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(e.message || e) }));
          }
          return;
        }

        // rutas de vercel.json, solo las sencillas (sin host)
        for (const r of rutas) {
          if (r.has) continue;
          const patron = '^' + r.source.replace(/:([a-zA-Z]+)/g, '[^/]+').replace(/\(\.\*\)/g, '.*') + '$';
          if (new RegExp(patron).test(url.pathname) && r.destination !== '/' ) {
            req.url = r.destination + url.search;
            break;
          }
        }
        siguiente();
      });
    }
  };
}
