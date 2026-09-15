/**
 * Almacén de regalos y pedidos.
 *
 * En producción usa Vercel Blob (variable BLOB_READ_WRITE_TOKEN, que Vercel
 * añade sola al conectar un store Blob al proyecto). Todo se guarda como
 * blobs PRIVADOS: nadie puede leerlos sin pasar por la API.
 *
 * Sin token (desarrollo local, pruebas) guarda en la carpeta .data/ del
 * proyecto, que está en .gitignore.
 *
 * Tres "cajones":
 *   borradores/<id>.json  lo que el comprador configuró, antes de pagar
 *   regalos/<id>.json     el regalo publicado (lo que ve quien lo recibe)
 *   pedidos/<id>.json     datos privados del pedido (email, PayPal, importe)
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const HAY_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const RAIZ_LOCAL = process.env.GANATELO_DATA_DIR || path.join(process.cwd(), '.data');

async function leerBlob(clave) {
  const { get } = await import('@vercel/blob');
  const r = await get(clave, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200 || !r.stream) return null;
  const texto = await new Response(r.stream).text();
  return JSON.parse(texto);
}

async function escribirBlob(clave, valor) {
  const { put } = await import('@vercel/blob');
  await put(clave, JSON.stringify(valor), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60
  });
}

async function borrarBlob(clave) {
  const { del } = await import('@vercel/blob');
  await del(clave);
}

async function listarBlob(prefijo) {
  const { list } = await import('@vercel/blob');
  const claves = [];
  let cursor;
  do {
    const r = await list({ prefix: prefijo, cursor, limit: 1000 });
    r.blobs.forEach((b) => claves.push(b.pathname));
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return claves;
}

function rutaLocal(clave) {
  const segura = clave.replace(/[^a-zA-Z0-9._/-]/g, '_');
  return path.join(RAIZ_LOCAL, segura);
}

async function leerLocal(clave) {
  try {
    return JSON.parse(await fs.readFile(rutaLocal(clave), 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

async function escribirLocal(clave, valor) {
  const ruta = rutaLocal(clave);
  await fs.mkdir(path.dirname(ruta), { recursive: true });
  await fs.writeFile(ruta, JSON.stringify(valor, null, 2));
}

async function borrarLocal(clave) {
  try { await fs.unlink(rutaLocal(clave)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
}

async function listarLocal(prefijo) {
  const dir = rutaLocal(prefijo);
  try {
    const nombres = await fs.readdir(dir);
    return nombres.map((n) => prefijo + n);
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

export const almacen = {
  /** true si los datos sobreviven al despliegue (Blob configurado) */
  persistente: HAY_BLOB,
  leer: HAY_BLOB ? leerBlob : leerLocal,
  escribir: HAY_BLOB ? escribirBlob : escribirLocal,
  borrar: HAY_BLOB ? borrarBlob : borrarLocal,
  listar: HAY_BLOB ? listarBlob : listarLocal
};

export const claves = {
  borrador: (id) => `borradores/${id}.json`,
  regalo: (id) => `regalos/${id}.json`,
  pedido: (id) => `pedidos/${id}.json`
};
