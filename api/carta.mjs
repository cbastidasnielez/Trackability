/**
 * Estado real de la carta que viene de Orlando.
 *
 * Solo funciona si en Vercel existen las variables USPS_CLIENT_ID y
 * USPS_CLIENT_SECRET (se sacan gratis en developer.usps.com). Mientras no
 * estén, devuelve { activo: false } y la web se queda en modo "a mano",
 * marcando las etapas desde el navegador. Nunca rompe la página: cualquier
 * fallo se responde también como { activo: false }.
 */

const NUMERO = process.env.USPS_TRACKING_NUMBER || 'LH276353799US';
const BASE = process.env.USPS_API_BASE || 'https://apis.usps.com';

// las mismas seis etapas que pinta la web, en el mismo orden
const ETAPAS = 6;

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

/** Normaliza los eventos vengan como vengan en el JSON. */
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
      const lugar = [e.eventCity, e.eventState, e.eventCountry]
        .filter(Boolean)
        .join(', ');
      const pais = String(e.eventCountry || e.country || '').toUpperCase();
      return { texto: String(texto), fecha, lugar, pais };
    })
    .filter((e) => e.texto || e.fecha)
    .sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')));
}

/** Reparte los eventos entre las seis etapas de la web. */
function etapas(lista) {
  const salida = Array.from({ length: ETAPAS }, () => ({ hecho: false, fecha: null }));
  const marcar = (i, fecha) => {
    if (i < 0 || i >= ETAPAS) return;
    if (!salida[i].hecho) { salida[i].hecho = true; salida[i].fecha = fecha || null; }
  };

  const fuera = (e) => e.pais && e.pais !== 'US' && e.pais !== 'USA' &&
                       e.pais !== 'UNITED STATES';

  lista.forEach((e) => {
    const t = e.texto.toLowerCase();

    if (/accept|pre-shipment|usps in possession|picked up|origin/.test(t)) marcar(0, e.fecha);
    if (/depart|dispatch|processed through|international service center|isc/.test(t) && !fuera(e)) marcar(1, e.fecha);
    if (/arriv|custom|aduana|inbound|spain|españa/.test(t) && fuera(e)) { marcar(2, e.fecha); marcar(3, e.fecha); }
    if (fuera(e)) { marcar(2, e.fecha); marcar(3, e.fecha); }
    if (/out for delivery|reparto|delivery attempt/.test(t)) marcar(4, e.fecha);
    if (/delivered|entregad/.test(t)) marcar(5, e.fecha);
  });

  // si hay cualquier evento, al menos salió de Orlando
  if (lista.length) marcar(0, lista[0].fecha);

  // las etapas son un camino: si una está hecha, las anteriores también
  let vista = null;
  for (let i = ETAPAS - 1; i >= 0; i--) {
    if (salida[i].hecho) vista = salida[i].fecha;
    else if (vista !== null) { salida[i].hecho = true; salida[i].fecha = salida[i].fecha || vista; }
  }

  return salida;
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
      etapas: etapas(lista),
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
