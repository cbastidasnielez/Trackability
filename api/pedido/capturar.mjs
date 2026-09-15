/**
 * Paso 2 del pago. PayPal ya tiene la aprobación del comprador; aquí se
 * cobra de verdad, se comprueba el importe y se publica el regalo.
 *
 * Es idempotente: si la orden ya estaba capturada (por ejemplo, el
 * comprador recargó la página a medias) devuelve el mismo enlace.
 */

import { json, soloMetodo, cuerpo, idValido } from '../_lib/http.mjs';
import { almacen, claves } from '../_lib/store.mjs';
import { configurado, capturarOrden, leerOrden, resumenCaptura, esProduccion } from '../_lib/paypal.mjs';
import { PRECIO, MONEDA, enlaceRegalo } from '../_lib/producto.mjs';
import { avisarComprador, avisarVenta, correoCompradorActivo } from '../_lib/correo.mjs';

async function capturarOLeer(ordenId) {
  try {
    return await capturarOrden(ordenId);
  } catch (e) {
    const nombre = e?.datos?.details?.[0]?.issue || e?.datos?.name || '';
    if (/ORDER_ALREADY_CAPTURED/i.test(nombre) || e.status === 422) {
      return leerOrden(ordenId);
    }
    throw e;
  }
}

export default async function handler(req, res) {
  if (!soloMetodo(req, res, 'POST')) return;
  if (!configurado()) return json(res, 503, { error: 'pago no configurado' });

  const { ordenId } = cuerpo(req);
  if (typeof ordenId !== 'string' || !/^[A-Za-z0-9-]{4,64}$/.test(ordenId)) {
    return json(res, 400, { error: 'falta ordenId' });
  }

  let orden;
  try {
    orden = await capturarOLeer(ordenId);
  } catch (e) {
    console.error('capturar', e.message, e.datos);
    return json(res, 502, { error: 'paypal no pudo cobrar', detalle: e?.datos?.details?.[0]?.issue || e?.datos?.name || null });
  }

  const pago = resumenCaptura(orden);
  const id = pago.referencia;

  // la referencia la pusimos nosotros al crear la orden, pero se valida igual:
  // acaba siendo una clave del almacén y no puede llevar barras ni puntos
  if (!idValido(id)) {
    console.error('referencia rara', id, pago);
    return json(res, 409, { error: 'orden sin referencia válida' });
  }

  // ¿ya estaba publicado? (recarga, doble clic, reintento)
  const yaPedido = await almacen.leer(claves.pedido(id));
  if (yaPedido) {
    return json(res, 200, { id, enlace: yaPedido.enlace, repetido: true, emailEnviado: !!yaPedido.emailEnviado });
  }

  const cobrado = pago.estadoOrden === 'COMPLETED' && pago.estadoCaptura === 'COMPLETED';
  const importeOk = pago.importe === PRECIO && pago.moneda === MONEDA;
  if (!cobrado || !importeOk) {
    console.error('captura no valida', pago);
    return json(res, 402, { error: 'pago no completado', estado: pago.estadoCaptura || pago.estadoOrden });
  }

  const borrador = await almacen.leer(claves.borrador(id));
  if (!borrador) {
    // se ha cobrado pero no está la configuración: no puede pasar, pero si pasa, que quede rastro
    console.error('borrador perdido', id, pago);
    await almacen.escribir(claves.pedido(id), { id, perdido: true, paypal: pago, pagadoEn: new Date().toISOString() });
    return json(res, 500, { error: 'pago recibido pero falta la configuración; escríbenos con el id', id });
  }

  const enlace = enlaceRegalo(req, id);
  const ahora = new Date().toISOString();

  const regalo = {
    id,
    ella: borrador.ella,
    de: borrador.de,
    ocasion: borrador.ocasion,
    premios: borrador.premios,
    mensaje: borrador.mensaje,
    cara: borrador.cara,
    creadoEn: ahora
  };

  const pedido = {
    id,
    enlace,
    email: borrador.email,
    ella: borrador.ella,
    de: borrador.de,
    ocasion: borrador.ocasion,
    dificultad: borrador.dificultad,
    premios: borrador.premios,
    mensaje: borrador.mensaje,
    importe: pago.importe,
    moneda: pago.moneda,
    paypal: pago,
    entorno: esProduccion() ? 'live' : 'sandbox',
    creadoEn: borrador.creadoEn,
    pagadoEn: ahora,
    emailEnviado: false
  };

  try {
    await almacen.escribir(claves.regalo(id), regalo);
    await almacen.escribir(claves.pedido(id), pedido);
    await almacen.borrar(claves.borrador(id));
  } catch (e) {
    console.error('publicar', e);
    return json(res, 500, { error: 'pago recibido pero no se pudo publicar; escríbenos con el id', id });
  }

  const [emailEnviado] = await Promise.all([
    avisarComprador({ email: pedido.email, ella: pedido.ella, de: pedido.de, enlace }),
    avisarVenta(pedido)
  ]);
  if (emailEnviado) {
    try { await almacen.escribir(claves.pedido(id), { ...pedido, emailEnviado: true }); } catch (e) { /* da igual */ }
  }

  return json(res, 200, { id, enlace, emailEnviado, emailPosible: correoCompradorActivo() });
}
