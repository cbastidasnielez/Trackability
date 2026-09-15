/**
 * Cliente mínimo de la API REST de PayPal (Orders v2).
 *
 * Variables:
 *   PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET  las credenciales de la app REST
 *   PAYPAL_ENV                               'sandbox' (por defecto) o 'live'
 *   PAYPAL_API_BASE                          solo para pruebas con un servidor falso
 */

const ENV = (process.env.PAYPAL_ENV || 'sandbox').toLowerCase();

export const BASE =
  process.env.PAYPAL_API_BASE ||
  (ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

export function configurado() {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export function clientId() {
  return process.env.PAYPAL_CLIENT_ID || '';
}

export function esProduccion() {
  return ENV === 'live';
}

let cache = { token: null, caduca: 0 };

async function token() {
  if (cache.token && Date.now() < cache.caduca) return cache.token;
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${basic}`,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!r.ok) throw new Error(`paypal oauth ${r.status}`);
  const d = await r.json();
  if (!d.access_token) throw new Error('paypal: sin access_token');
  cache = { token: d.access_token, caduca: Date.now() + Math.max(0, (d.expires_in || 300) - 60) * 1000 };
  return d.access_token;
}

async function llamar(metodo, ruta, cuerpo, extra = {}) {
  const r = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: {
      authorization: `Bearer ${await token()}`,
      'content-type': 'application/json',
      accept: 'application/json',
      ...extra
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  const texto = await r.text();
  let datos = {};
  try { datos = texto ? JSON.parse(texto) : {}; } catch (e) { datos = { raw: texto }; }
  if (!r.ok) {
    const err = new Error(`paypal ${metodo} ${ruta} ${r.status}: ${datos?.name || ''} ${datos?.message || ''}`.trim());
    err.status = r.status;
    err.datos = datos;
    throw err;
  }
  return datos;
}

/**
 * Crea una orden de pago único. El importe lo fija SIEMPRE el servidor.
 * `referencia` es nuestro id de borrador: viaja en custom_id y en invoice_id
 * para poder cruzarlo desde el panel de PayPal.
 */
export async function crearOrden({ importe, moneda, descripcion, referencia, marca, urlVuelta }) {
  const cuerpo = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: 'ganatelo',
        custom_id: referencia,
        invoice_id: `GAN-${referencia}-${Date.now().toString(36)}`,
        description: descripcion,
        amount: { currency_code: moneda, value: importe }
      }
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: marca,
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          landing_page: 'LOGIN',
          return_url: urlVuelta,
          cancel_url: urlVuelta
        }
      }
    }
  };
  return llamar('POST', '/v2/checkout/orders', cuerpo, { 'PayPal-Request-Id': `crear-${referencia}` });
}

export async function capturarOrden(ordenId) {
  return llamar('POST', `/v2/checkout/orders/${encodeURIComponent(ordenId)}/capture`, null, {
    'PayPal-Request-Id': `capturar-${ordenId}`
  });
}

export async function leerOrden(ordenId) {
  return llamar('GET', `/v2/checkout/orders/${encodeURIComponent(ordenId)}`);
}

/** Saca de una orden capturada lo que nos interesa guardar. */
export function resumenCaptura(orden) {
  const unidad = orden?.purchase_units?.[0] || {};
  const captura = unidad?.payments?.captures?.[0] || {};
  return {
    ordenId: orden?.id || null,
    estadoOrden: orden?.status || null,
    capturaId: captura?.id || null,
    estadoCaptura: captura?.status || null,
    importe: captura?.amount?.value || unidad?.amount?.value || null,
    moneda: captura?.amount?.currency_code || unidad?.amount?.currency_code || null,
    referencia: unidad?.custom_id || captura?.custom_id || null,
    pagador: {
      email: orden?.payer?.email_address || null,
      nombre: [orden?.payer?.name?.given_name, orden?.payer?.name?.surname].filter(Boolean).join(' ') || null,
      pais: orden?.payer?.address?.country_code || null
    }
  };
}
