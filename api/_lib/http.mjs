/** Utilidades para las funciones de Vercel. */

import { randomBytes } from 'node:crypto';

export function json(res, estado, cuerpo, cache = 'no-store') {
  res.setHeader('cache-control', cache);
  res.setHeader('content-type', 'application/json; charset=utf-8');
  return res.status(estado).send(JSON.stringify(cuerpo));
}

export function soloMetodo(req, res, metodo) {
  if (req.method === metodo) return true;
  res.setHeader('allow', metodo);
  json(res, 405, { error: 'metodo no permitido' });
  return false;
}

/** El body ya viene parseado en Vercel; en local o con otros content-type puede venir como texto. */
export function cuerpo(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === 'string') { try { return JSON.parse(b); } catch (e) { return {}; } }
  if (Buffer.isBuffer(b)) { try { return JSON.parse(b.toString('utf8')); } catch (e) { return {}; } }
  return b;
}

/** Ids cortos, legibles y difíciles de adivinar (12 chars ≈ 60 bits). */
const ALFABETO = 'abcdefghjkmnpqrstuvwxyz23456789';
export function nuevoId(largo = 12) {
  const bytes = randomBytes(largo);
  let s = '';
  for (let i = 0; i < largo; i++) s += ALFABETO[bytes[i] % ALFABETO.length];
  return s;
}

export function idValido(id) {
  return typeof id === 'string' && /^[a-z0-9]{8,24}$/.test(id);
}

export function limpiar(texto, largo) {
  return String(texto == null ? '' : texto).replace(/\s+/g, ' ').trim().slice(0, largo);
}

export function emailValido(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120;
}
