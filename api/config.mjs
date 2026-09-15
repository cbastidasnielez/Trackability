/**
 * Lo que la página de venta necesita saber antes de pintar el botón de pago.
 * No expone nada secreto: el client id de PayPal es público por diseño.
 */

import { json, soloMetodo } from './_lib/http.mjs';
import { almacen } from './_lib/store.mjs';
import { configurado, clientId, esProduccion } from './_lib/paypal.mjs';
import { correoCompradorActivo } from './_lib/correo.mjs';
import { PRECIO, MONEDA, UMBRALES, LIMITES, CONTACTO, FORMSPREE_ID, formatearPrecio } from './_lib/producto.mjs';

export default async function handler(req, res) {
  if (!soloMetodo(req, res, 'GET')) return;

  const pagoListo = configurado();
  const local = !process.env.VERCEL;

  return json(res, 200, {
    // se puede cobrar: PayPal configurado y un sitio donde guardar los regalos
    listo: pagoListo && (almacen.persistente || local),
    paypal: pagoListo ? { clientId: clientId(), sandbox: !esProduccion() } : null,
    almacen: almacen.persistente ? 'blob' : (local ? 'local' : 'ninguno'),
    precio: PRECIO,
    moneda: MONEDA,
    precioTexto: formatearPrecio(),
    emailComprador: correoCompradorActivo(),
    umbrales: UMBRALES,
    limites: LIMITES,
    contacto: CONTACTO || null,
    formspree: FORMSPREE_ID || null
  }, 's-maxage=60, stale-while-revalidate=600');
}
