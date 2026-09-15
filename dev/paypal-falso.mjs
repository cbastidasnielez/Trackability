/**
 * Un PayPal de mentira para probar el flujo de cobro sin credenciales reales.
 * Responde a lo justo: token, crear orden, capturar y leer.
 *
 *   node dev/paypal-falso.mjs           (escucha en 127.0.0.1:9911)
 *
 * Y en .env.local: PAYPAL_API_BASE=http://127.0.0.1:9911
 *                  PAYPAL_CLIENT_ID=falso  PAYPAL_CLIENT_SECRET=falso
 */
import { createServer } from 'node:http';

const ordenes = new Map();
let n = 0;

function leer(req) {
  return new Promise((ok) => { const t = []; req.on('data', (c) => t.push(c)); req.on('end', () => ok(Buffer.concat(t).toString())); });
}

const servidor = createServer(async (req, res) => {
  const cuerpo = await leer(req);
  const responder = (estado, datos) => { res.writeHead(estado, { 'content-type': 'application/json' }); res.end(JSON.stringify(datos)); };

  if (req.url === '/v1/oauth2/token') return responder(200, { access_token: 'token-falso', expires_in: 3600 });

  if (req.url === '/v2/checkout/orders' && req.method === 'POST') {
    const orden = JSON.parse(cuerpo);
    const id = 'ORD' + String(++n).padStart(6, '0');
    ordenes.set(id, { id, status: 'CREATED', purchase_units: orden.purchase_units, payer: { email_address: 'pagador@ejemplo.com', name: { given_name: 'Pepe', surname: 'Prueba' } } });
    return responder(201, { id, status: 'CREATED' });
  }

  const m = req.url.match(/^\/v2\/checkout\/orders\/([^/]+)(\/capture)?$/);
  if (m) {
    const o = ordenes.get(m[1]);
    if (!o) return responder(404, { name: 'RESOURCE_NOT_FOUND' });
    if (m[2]) {
      if (o.status === 'COMPLETED') return responder(422, { name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'ORDER_ALREADY_CAPTURED' }] });
      if (process.env.FALSO_RECHAZA) return responder(422, { name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'INSTRUMENT_DECLINED' }] });
      o.status = 'COMPLETED';
      o.purchase_units[0].payments = { captures: [{ id: 'CAP' + o.id.slice(3), status: 'COMPLETED', amount: o.purchase_units[0].amount, custom_id: o.purchase_units[0].custom_id }] };
    }
    return responder(200, o);
  }

  responder(404, { name: 'NOT_FOUND', url: req.url });
});

servidor.listen(Number(process.env.PUERTO || 9911), '127.0.0.1', () => console.log('PayPal falso en http://127.0.0.1:' + (process.env.PUERTO || 9911)));
