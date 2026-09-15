/**
 * Panel mínimo para ti: lista de ventas. Protegido con ADMIN_TOKEN.
 *
 *   GET /api/pedidos                      lista de pedidos (sin la foto)
 *   GET /api/pedidos?id=xxxx              un pedido completo
 *   GET /api/pedidos?limpiar=1            borra borradores de más de 2 días
 *
 * Cabecera: Authorization: Bearer <ADMIN_TOKEN>  (o ?token=...)
 */

import { json, soloMetodo, idValido } from './_lib/http.mjs';
import { almacen, claves } from './_lib/store.mjs';

export default async function handler(req, res) {
  if (!soloMetodo(req, res, 'GET')) return;

  const esperado = process.env.ADMIN_TOKEN || '';
  const auth = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
  const dado = auth || String(req.query?.token || '');
  if (!esperado || dado !== esperado) return json(res, 401, { error: 'sin permiso' });

  if (req.query?.id) {
    const id = String(req.query.id).toLowerCase();
    if (!idValido(id)) return json(res, 400, { error: 'id no válido' });
    const pedido = await almacen.leer(claves.pedido(id));
    const regalo = await almacen.leer(claves.regalo(id));
    return json(res, pedido ? 200 : 404, { pedido, regalo: regalo ? { ...regalo, cara: `(${Math.round((regalo.cara || '').length / 1024)} KB)` } : null });
  }

  if (req.query?.limpiar) {
    const limite = Date.now() - 2 * 24 * 3600 * 1000;
    const borrados = [];
    for (const clave of await almacen.listar('borradores/')) {
      const b = await almacen.leer(clave);
      if (b && new Date(b.creadoEn).getTime() < limite) {
        await almacen.borrar(clave);
        borrados.push(b.id);
      }
    }
    return json(res, 200, { borrados });
  }

  const claveList = await almacen.listar('pedidos/');
  const pedidos = [];
  for (const clave of claveList) {
    const p = await almacen.leer(clave);
    if (p) pedidos.push({ id: p.id, pagadoEn: p.pagadoEn, ella: p.ella, de: p.de, email: p.email, ocasion: p.ocasion, importe: p.importe, moneda: p.moneda, entorno: p.entorno, enlace: p.enlace, capturaId: p.paypal?.capturaId, perdido: !!p.perdido });
  }
  pedidos.sort((a, b) => String(b.pagadoEn).localeCompare(String(a.pagadoEn)));
  const total = pedidos.filter((p) => p.entorno === 'live' && !p.perdido).reduce((s, p) => s + Number(p.importe || 0), 0);
  return json(res, 200, { total: pedidos.length, ingresosLive: total.toFixed(2), pedidos });
}
