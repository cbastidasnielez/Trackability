/**
 * Paso 1 del pago. Recibe lo que el comprador configuró en la demo, lo
 * guarda como borrador y crea la orden en PayPal. El importe lo pone este
 * servidor: el navegador no manda ningún precio.
 */

import { json, soloMetodo, cuerpo, nuevoId, limpiar, emailValido } from '../_lib/http.mjs';
import { almacen, claves } from '../_lib/store.mjs';
import { configurado, crearOrden, esProduccion } from '../_lib/paypal.mjs';
import { MARCA, PRECIO, MONEDA, UMBRALES, LIMITES, urlBase } from '../_lib/producto.mjs';

const OCASIONES = ['Aniversario', 'Cumpleaños', 'San Valentín', 'Navidad', 'Porque sí', 'Picante'];

function caraValida(cara) {
  if (typeof cara !== 'string') return false;
  if (!/^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(cara)) return false;
  return cara.length <= LIMITES.caraBytes * 1.4;   // base64 pesa un 33 % más
}

export function validarPedido(b) {
  const errores = [];

  const email = limpiar(b.email, 120).toLowerCase();
  if (!emailValido(email)) errores.push('email');

  const ella = limpiar(b.ella, LIMITES.nombreLargo);
  if (!ella) errores.push('ella');

  const de = limpiar(b.de, LIMITES.nombreLargo);

  const ocasion = OCASIONES.includes(b.ocasion) ? b.ocasion : 'Porque sí';
  const dificultad = b.dificultad === 'facil' ? 'facil' : 'normal';

  const textos = Array.isArray(b.premios) ? b.premios.map((p) => limpiar(typeof p === 'string' ? p : p?.texto, LIMITES.premioLargo)).filter(Boolean) : [];
  if (textos.length < LIMITES.premiosMin || textos.length > LIMITES.premiosMax) errores.push('premios');
  const premios = textos.map((texto, i) => ({ puntos: UMBRALES[dificultad][i], texto }));

  const mensaje = limpiar(b.mensaje, LIMITES.mensajeLargo) || 'Te lo has ganado. Como todo lo demás.';

  if (!caraValida(b.cara)) errores.push('cara');

  if (b.derechoFoto !== true) errores.push('derechoFoto');

  return { errores, datos: { email, ella, de, ocasion, dificultad, premios, mensaje, cara: b.cara } };
}

export default async function handler(req, res) {
  if (!soloMetodo(req, res, 'POST')) return;

  if (!configurado()) return json(res, 503, { error: 'pago no configurado' });
  if (!almacen.persistente && process.env.VERCEL) return json(res, 503, { error: 'almacen no configurado' });

  const { errores, datos } = validarPedido(cuerpo(req));
  if (errores.length) return json(res, 400, { error: 'datos incompletos', campos: errores });

  const id = nuevoId();
  const borrador = {
    id,
    creadoEn: new Date().toISOString(),
    entorno: esProduccion() ? 'live' : 'sandbox',
    precio: PRECIO,
    moneda: MONEDA,
    ...datos
  };

  try {
    await almacen.escribir(claves.borrador(id), borrador);
  } catch (e) {
    console.error('borrador', e);
    return json(res, 500, { error: 'no se pudo guardar el borrador' });
  }

  try {
    const orden = await crearOrden({
      importe: PRECIO,
      moneda: MONEDA,
      descripcion: `${MARCA} · regalo para ${datos.ella}`,
      referencia: id,
      marca: MARCA,
      urlVuelta: `${urlBase(req)}/demo`
    });
    // se apunta la orden en el borrador para poder cruzarlos si algo falla a medias
    await almacen.escribir(claves.borrador(id), { ...borrador, paypalOrdenId: orden.id });
    return json(res, 200, { id, ordenId: orden.id });
  } catch (e) {
    console.error('crear orden', e.message, e.datos);
    return json(res, 502, { error: 'paypal no respondió', detalle: e.datos?.name || null });
  }
}
