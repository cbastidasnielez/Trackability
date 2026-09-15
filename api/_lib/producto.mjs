/**
 * Lo que se vende: precio, moneda y textos. Todo se puede cambiar desde las
 * variables de entorno de Vercel sin tocar código.
 */

export const MARCA = 'Gánatelo';

export const PRECIO = normalizarPrecio(process.env.GANATELO_PRECIO, '4.99');
export const MONEDA = (process.env.GANATELO_MONEDA || 'USD').toUpperCase().slice(0, 3);
export const CONTACTO = process.env.CONTACTO_EMAIL || '';
export const FORMSPREE_ID = process.env.FORMSPREE_ID || 'xzdnwwqa';

/** Umbrales de puntos por dificultad. El índice es el número de premio. */
export const UMBRALES = {
  normal: [5, 10, 15, 20, 25],
  facil: [3, 6, 9, 12, 15]
};

export const LIMITES = {
  premiosMin: 1,
  premiosMax: 5,
  premioLargo: 80,
  mensajeLargo: 240,
  nombreLargo: 40,
  caraBytes: 400 * 1024   // la cara viene como data URL; 400 KB de sobra para 256 px
};

function normalizarPrecio(valor, defecto) {
  const n = Number(String(valor || '').replace(',', '.'));
  if (!isFinite(n) || n <= 0) return defecto;
  return n.toFixed(2);
}

/** URL pública del sitio, para construir los enlaces de los regalos. */
export function urlBase(req) {
  if (process.env.GANATELO_URL) return process.env.GANATELO_URL.replace(/\/$/, '');
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host || 'localhost:5173';
  const proto = req?.headers?.['x-forwarded-proto'] || (String(host).startsWith('localhost') || String(host).startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export function enlaceRegalo(req, id) {
  return `${urlBase(req)}/r/${id}`;
}

export function formatearPrecio(importe = PRECIO, moneda = MONEDA) {
  try {
    return new Intl.NumberFormat('es', { style: 'currency', currency: moneda }).format(Number(importe));
  } catch (e) {
    return `${importe} ${moneda}`;
  }
}
