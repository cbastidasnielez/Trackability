/**
 * Última novedad de la carta que viene de Orlando.
 *
 * Solo funciona si en Vercel existen las variables USPS_CLIENT_ID y
 * USPS_CLIENT_SECRET (se sacan gratis en developer.usps.com). Mientras no
 * estén, devuelve { activo: false } y la tarjeta de la web se queda con sus
 * enlaces. Nunca rompe la página: cualquier fallo se responde también como
 * { activo: false }.
 */

const NUMERO = process.env.USPS_TRACKING_NUMBER || 'LH276353799US';
const BASE = process.env.USPS_API_BASE || 'https://apis.usps.com';

function iso(valor) {
  if (!valor) return null;
  const d = new Date(valor);
  if (isNaN(d.getTime())) return String(valor).slice(0, 10) || null;
  return d.toISOString().slice(0, 10);
}

async function token() {
  const r = await fetch(`${BASE}/oauth2/v3/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.USPS_CLIENT_ID,
      client_secret: process.env.USPS_CLIENT_SECRET
    })
  });
  if (!r.ok) throw new Error(`oauth ${r.status}`);
  const d = await r.json();
  if (!d.access_token) throw new Error('sin access_token');
  return d.access_token;
}

async function seguimiento(bearer) {
  const url = `${BASE}/tracking/v3/tracking/${encodeURIComponent(NUMERO)}?expand=DETAIL`;
  const r = await fetch(url, {
    headers: { authorization: `Bearer ${bearer}`, accept: 'application/json' }
  });
  if (!r.ok) throw new Error(`tracking ${r.status}`);
  return r.json();
}

/** Normaliza los eventos vengan como vengan en el JSON, del viejo al nuevo. */
function eventos(datos) {
  const bruto =
    datos?.trackingEvents ||
    datos?.trackingEvent ||
    datos?.eventSummaries ||
    datos?.events ||
    [];

  return (Array.isArray(bruto) ? bruto : [bruto])
    .map((e) => {
      if (typeof e === 'string') return { texto: e, fecha: null, lugar: '' };
      const texto = e.eventType || e.event || e.eventDescription || e.status || '';
      const fecha = iso(
        e.eventTimestamp || e.eventDateTime || e.eventDate || e.timestamp || e.date
      );
      const lugar = [e.eventCity, e.eventState, e.eventCountry].filter(Boolean).join(', ');
      return { texto: String(texto), fecha, lugar };
    })
    .filter((e) => e.texto || e.fecha)
    .sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')));
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 's-maxage=900, stale-while-revalidate=3600');

  if (!process.env.USPS_CLIENT_ID || !process.env.USPS_CLIENT_SECRET) {
    return res.status(200).json({ activo: false, motivo: 'sin credenciales' });
  }

  try {
    const datos = await seguimiento(await token());
    const lista = eventos(datos);
    if (!lista.length) return res.status(200).json({ activo: false, motivo: 'sin eventos' });

    const ultimo = lista[lista.length - 1];

    return res.status(200).json({
      activo: true,
      numero: NUMERO,
      salida: lista[0].fecha,          // el primer escaneo: el día que salió
      ultimo: {
        texto: datos?.statusSummary || datos?.status || ultimo.texto,
        fecha: ultimo.fecha,
        lugar: ultimo.lugar
      },
      actualizado: new Date().toISOString()
    });
  } catch (e) {
    return res.status(200).json({ activo: false, motivo: String(e.message || e) });
  }
}
