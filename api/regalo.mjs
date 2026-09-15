/** Devuelve un regalo publicado. Solo los campos que ve quien lo recibe. */

import { json, soloMetodo, idValido } from './_lib/http.mjs';
import { almacen, claves } from './_lib/store.mjs';

export default async function handler(req, res) {
  if (!soloMetodo(req, res, 'GET')) return;

  const id = String(req.query?.id || '').toLowerCase();
  if (!idValido(id)) return json(res, 400, { error: 'id no válido' });

  let regalo = null;
  try {
    regalo = await almacen.leer(claves.regalo(id));
  } catch (e) {
    console.error('leer regalo', e);
    return json(res, 500, { error: 'no se pudo leer' });
  }
  if (!regalo) return json(res, 404, { error: 'no existe' });

  return json(res, 200, {
    id: regalo.id,
    ella: regalo.ella,
    de: regalo.de,
    ocasion: regalo.ocasion,
    premios: regalo.premios,
    mensaje: regalo.mensaje,
    cara: regalo.cara
  }, 'public, s-maxage=300, stale-while-revalidate=86400');
}
